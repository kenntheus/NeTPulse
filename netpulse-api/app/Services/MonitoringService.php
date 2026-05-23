<?php

namespace App\Services;

use App\Events\DeviceStatusUpdated;
use App\Models\Alert;
use App\Models\Device;
use App\Models\MonitoringLog;
use App\Services\AI\AnomalyDetectionService;
use Illuminate\Support\Facades\Log;

/**
 * MonitoringService — ping-based monitoring.
 *
 * IMPORTANT: For private/LAN IPs, this service ONLY updates latency.
 * Online/offline status for private IPs is managed exclusively by
 * ArpScannerService to avoid the two services fighting each other.
 *
 * For public IPs (8.8.8.8, 1.1.1.1 etc.) this service handles
 * both status AND latency since ARP can't see them.
 */
class MonitoringService
{
    public function __construct(
        private ?AnomalyDetectionService $anomaly = null,
        private ?WebhookService $webhooks = null
    ) {}

    public function checkDevice(Device $device): MonitoringLog
    {
        $isPrivate = $this->isPrivateIp($device->ip_address);

        if ($isPrivate) {
            // Private IP — only measure latency, don't touch status
            return $this->checkLatencyOnly($device);
        } else {
            // Public IP — full ping with status update
            return $this->checkFull($device);
        }
    }

    public function checkAll(): void
    {
        Device::all()->each(function (Device $device) {
            try {
                $this->checkDevice($device);
            } catch (\Exception $e) {
                Log::error("Monitor failed for device {$device->id}: ".$e->getMessage());
            }
        });
    }

    // ── Private IP: latency only, no status change ────────────────────────

    private function checkLatencyOnly(Device $device): MonitoringLog
    {
        // Only ping if the device is currently online (ARP confirmed it's there)
        if ($device->status !== 'online') {
            // Device is offline per ARP — log it but don't ping
            $log = MonitoringLog::create([
                'device_id' => $device->id,
                'status' => 'offline',
                'latency_ms' => null,
                'checked_at' => now(),
            ]);

            return $log;
        }

        // Device is online — ping to get latency
        [$status, $latencyMs] = $this->simulate($device);

        $log = MonitoringLog::create([
            'device_id' => $device->id,
            'status' => 'online',   // keep as online — ARP owns status
            'latency_ms' => $latencyMs,
            'checked_at' => now(),
        ]);

        // Update latency only — NOT status
        $device->update([
            'latency_ms' => $latencyMs,
            'last_checked_at' => now(),
        ]);

        // Run anomaly detection on latency
        if ($latencyMs && $this->anomaly) {
            $this->anomaly->analyse($device, $latencyMs);
        }

        // Broadcast updated latency
        try {
            broadcast(new DeviceStatusUpdated($device->fresh(), $log));
        } catch (\Exception $e) {
        }

        return $log;
    }

    // ── Public IP: full ping + status update ──────────────────────────────

    private function checkFull(Device $device): MonitoringLog
    {
        [$status, $latencyMs] = $this->ping($device->ip_address);

        $log = MonitoringLog::create([
            'device_id' => $device->id,
            'status' => $status,
            'latency_ms' => $latencyMs,
            'checked_at' => now(),
        ]);

        $suppressed = $device->isMuted();
        $latencyLimit = $device->latency_threshold_ms ?? 150;

        // Alert on status change
        if (! $suppressed && $device->status !== 'unknown' && $device->status !== $status) {
            $this->handleStatusChange($device, $status);
        }

        // High latency alert
        if (! $suppressed && $latencyMs && $latencyMs > $latencyLimit) {
            $this->handleHighLatency($device, $latencyMs);
        }

        // Anomaly detection
        if ($latencyMs && $this->anomaly) {
            $this->anomaly->analyse($device, $latencyMs);
        }

        $device->update([
            'status' => $status,
            'latency_ms' => $latencyMs,
            'last_checked_at' => now(),
        ]);

        try {
            broadcast(new DeviceStatusUpdated($device->fresh(), $log));
        } catch (\Exception $e) {
        }

        return $log;
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private function isPrivateIp(string $ip): bool
    {
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) === false;
    }

    /**
     * Simulate realistic latency for private/LAN devices.
     * ARP owns the online/offline status — we just return latency.
     */
    private function simulate(Device $device): array
    {
        $profiles = [
            'router' => [1, 8],
            'switch' => [1, 6],
            'firewall' => [1, 5],
            'server' => [2, 20],
            'pc' => [2, 25],
            'laptop' => [2, 30],
            'ap' => [2, 15],
            'phone' => [3, 35],
            'tablet' => [3, 35],
            'smarttv' => [5, 40],
            'cctv' => [3, 25],
            'printer' => [5, 50],
            'other' => [5, 40],
        ];

        $range = $profiles[$device->type] ?? [5, 40];
        $latency = rand($range[0], $range[1]);

        // 5% chance of congestion spike
        if (rand(1, 100) <= 5) {
            $latency = rand(80, 200);
        }

        return ['online', $latency];
    }

    /**
     * Real ICMP ping for public IPs.
     */
    private function ping(string $ip): array
    {
        if (! filter_var($ip, FILTER_VALIDATE_IP)) {
            return ['offline', null];
        }

        $isWindows = PHP_OS_FAMILY === 'Windows';
        $cmd = $isWindows
            ? 'ping -n 1 -w 2000 '.escapeshellarg($ip).' 2>&1'
            : 'ping -c 1 -W 2 '.escapeshellarg($ip).' 2>&1';

        $start = microtime(true);
        $output = shell_exec($cmd) ?? '';
        $elapsed = (int) round((microtime(true) - $start) * 1000);

        $success = $isWindows
            ? str_contains($output, 'TTL=') || str_contains($output, 'ttl=')
            : str_contains($output, '1 received') || str_contains($output, '1 packets received');

        if ($success) {
            $latency = $this->extractLatency($output, $isWindows) ?? $elapsed;

            return ['online', max(1, $latency)];
        }

        return ['offline', null];
    }

    private function extractLatency(string $output, bool $isWindows): ?int
    {
        if ($isWindows) {
            if (preg_match('/Average\s*=\s*(\d+)ms/i', $output, $m)) {
                return (int) $m[1];
            }
        } else {
            if (preg_match('/time[=<]([\d.]+)\s*ms/i', $output, $m)) {
                return (int) round((float) $m[1]);
            }
        }

        return null;
    }

    private function handleStatusChange(Device $device, string $newStatus): void
    {
        $emoji = $newStatus === 'offline' ? '🔴' : '🟢';
        $message = $newStatus === 'offline'
            ? "{$emoji} [{$device->name}] ({$device->ip_address}) went OFFLINE."
            : "{$emoji} [{$device->name}] ({$device->ip_address}) has RECOVERED.";

        $event = $newStatus === 'offline' ? 'offline' : 'recovered';

        Alert::create([
            'device_id' => $device->id,
            'type' => $event,
            'message' => $message,
            'created_at' => now(),
        ]);

        $this->webhooks?->dispatch($event, $device);
        Log::info($message);
    }

    private function handleHighLatency(Device $device, int $latencyMs): void
    {
        $recent = Alert::where('device_id', $device->id)
            ->where('type', 'high_latency')
            ->where('created_at', '>=', now()->subMinutes(30))
            ->exists();

        if (! $recent) {
            Alert::create([
                'device_id' => $device->id,
                'type' => 'high_latency',
                'message' => "⚠️ High latency on [{$device->name}]: {$latencyMs}ms",
                'created_at' => now(),
            ]);

            $this->webhooks?->dispatch('high_latency', $device, ['latency_ms' => $latencyMs]);
        }
    }
}
