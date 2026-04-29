<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\Device;
use App\Models\MonitoringLog;
use App\Events\DeviceStatusUpdated;
use Illuminate\Support\Facades\Log;

class MonitoringService
{
    // ── Public API ────────────────────────────────────────────────────────

    /**
     * Check a single device: ping, log, alert, broadcast.
     */
    public function checkDevice(Device $device): MonitoringLog
    {
        [$status, $latencyMs] = $this->ping($device->ip_address);

        // Persist monitoring log
        $log = MonitoringLog::create([
            'device_id'  => $device->id,
            'status'     => $status,
            'latency_ms' => $latencyMs,
            'checked_at' => now(),
        ]);

        // Detect transition and create alert
        if ($device->status !== $status) {
            $this->handleStatusChange($device, $status);
        }

        // High latency alert (>200ms)
        if ($latencyMs !== null && $latencyMs > 200) {
            $this->handleHighLatency($device, $latencyMs);
        }

        // Refresh device snapshot
        $device->update([
            'status'          => $status,
            'latency_ms'      => $latencyMs,
            'last_checked_at' => now(),
        ]);

        // Broadcast real-time update
        try {
            broadcast(new DeviceStatusUpdated($device->fresh(), $log));
        } catch (\Exception $e) {
            // Don't crash the scheduler if Pusher is not configured
            Log::warning('Broadcast failed: ' . $e->getMessage());
        }

        return $log;
    }

    /**
     * Check all devices — called by the Laravel scheduler.
     */
    public function checkAll(): void
    {
        Device::all()->each(function (Device $device) {
            try {
                $this->checkDevice($device);
            } catch (\Exception $e) {
                Log::error("Failed to check device {$device->id}: " . $e->getMessage());
            }
        });
    }

    // ── Private helpers ───────────────────────────────────────────────────

    /**
     * Ping an IP address using system ping command.
     * Returns [status, latency_ms].
     */
    private function ping(string $ip): array
    {
        // Sanitize IP to prevent command injection
        if (!filter_var($ip, FILTER_VALIDATE_IP)) {
            return ['offline', null];
        }

        $isWindows = PHP_OS_FAMILY === 'Windows';
        $cmd       = $isWindows
            ? "ping -n 1 -w 2000 " . escapeshellarg($ip) . " 2>&1"
            : "ping -c 1 -W 2 "    . escapeshellarg($ip) . " 2>&1";

        $start   = microtime(true);
        $output  = shell_exec($cmd) ?? '';
        $elapsed = (int) round((microtime(true) - $start) * 1000);

        $success = $isWindows
            ? str_contains($output, 'TTL=') || str_contains($output, 'ttl=')
            : str_contains($output, '1 received') || str_contains($output, '1 packets received');

        if ($success) {
            // Try to extract the actual latency from ping output
            $latency = $this->extractLatency($output, $isWindows) ?? $elapsed;
            return ['online', max(1, $latency)];
        }

        return ['offline', null];
    }

    /**
     * Parse latency from ping output string.
     */
    private function extractLatency(string $output, bool $isWindows): ?int
    {
        if ($isWindows) {
            // "Average = 12ms"
            if (preg_match('/Average\s*=\s*(\d+)ms/i', $output, $m)) {
                return (int) $m[1];
            }
        } else {
            // "time=12.3 ms" or "time=12 ms"
            if (preg_match('/time[=<]([\d.]+)\s*ms/i', $output, $m)) {
                return (int) round((float) $m[1]);
            }
        }
        return null;
    }

    private function handleStatusChange(Device $device, string $newStatus): void
    {
        $type    = $newStatus === 'offline' ? 'offline' : 'recovered';
        $emoji   = $newStatus === 'offline' ? '🔴' : '🟢';
        $message = $newStatus === 'offline'
            ? "{$emoji} Device [{$device->name}] at {$device->ip_address} went OFFLINE."
            : "{$emoji} Device [{$device->name}] at {$device->ip_address} has RECOVERED.";

        Alert::create([
            'device_id'  => $device->id,
            'type'       => $type,
            'message'    => $message,
            'created_at' => now(),
        ]);

        Log::info($message);
    }

    private function handleHighLatency(Device $device, int $latencyMs): void
    {
        // Only alert if no recent high-latency alert exists (within 30 min)
        $recentAlert = Alert::where('device_id', $device->id)
            ->where('type', 'high_latency')
            ->where('created_at', '>=', now()->subMinutes(30))
            ->exists();

        if (!$recentAlert) {
            Alert::create([
                'device_id'  => $device->id,
                'type'       => 'high_latency',
                'message'    => "⚠️ High latency detected on [{$device->name}]: {$latencyMs}ms",
                'created_at' => now(),
            ]);
        }
    }
}