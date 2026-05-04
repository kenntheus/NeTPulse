<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\Device;
use App\Models\MonitoringLog;
use App\Events\DeviceStatusUpdated;
use Illuminate\Support\Facades\Log;

class MonitoringService
{
    public function checkDevice(Device $device): MonitoringLog
    {
        [$status, $latencyMs] = $this->shouldSimulate($device->ip_address)
            ? $this->simulate($device)
            : $this->ping($device->ip_address);

        $log = MonitoringLog::create([
            'device_id'  => $device->id,
            'status'     => $status,
            'latency_ms' => $latencyMs,
            'checked_at' => now(),
        ]);

        if ($device->status !== 'unknown' && $device->status !== $status) {
            $this->handleStatusChange($device, $status);
        }

        if ($latencyMs !== null && $latencyMs > 150) {
            $this->handleHighLatency($device, $latencyMs);
        }

        $device->update([
            'status'          => $status,
            'latency_ms'      => $latencyMs,
            'last_checked_at' => now(),
        ]);

        try {
            broadcast(new DeviceStatusUpdated($device->fresh(), $log));
        } catch (\Exception $e) {
            Log::warning('Broadcast failed: ' . $e->getMessage());
        }

        return $log;
    }

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

    private function shouldSimulate(string $ip): bool
    {
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) === false;
    }

    private function simulate(Device $device): array
    {
        $profiles = [
            'router'   => ['uptime' => 99, 'min' =>  1, 'max' => 15],
            'switch'   => ['uptime' => 99, 'min' =>  1, 'max' => 12],
            'firewall' => ['uptime' => 99, 'min' =>  1, 'max' => 10],
            'server'   => ['uptime' => 97, 'min' =>  2, 'max' => 35],
            'ap'       => ['uptime' => 95, 'min' =>  2, 'max' => 25],
            'other'    => ['uptime' => 85, 'min' =>  5, 'max' => 60],
        ];

        $profile  = $profiles[$device->type] ?? $profiles['other'];
        $isOnline = rand(1, 100) <= $profile['uptime'];

        if (!$isOnline) {
            return ['offline', null];
        }

        $latency = rand($profile['min'], $profile['max']);

        if (rand(1, 100) <= 5) {
            $latency = rand(100, 280);
        }

        if ($device->status === 'offline') {
            $latency = min($latency + rand(10, 30), 200);
        }

        return ['online', $latency];
    }

    private function ping(string $ip): array
    {
        if (!filter_var($ip, FILTER_VALIDATE_IP)) {
            return ['offline', null];
        }

        $isWindows = PHP_OS_FAMILY === 'Windows';
        $cmd       = $isWindows
            ? 'ping -n 1 -w 2000 ' . escapeshellarg($ip) . ' 2>&1'
            : 'ping -c 1 -W 2 '    . escapeshellarg($ip) . ' 2>&1';

        $start   = microtime(true);
        $output  = shell_exec($cmd) ?? '';
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
        $type    = $newStatus === 'offline' ? 'offline' : 'recovered';
        $emoji   = $newStatus === 'offline' ? '🔴' : '🟢';
        $message = $newStatus === 'offline'
            ? "{$emoji} [{$device->name}] ({$device->ip_address}) went OFFLINE."
            : "{$emoji} [{$device->name}] ({$device->ip_address}) has RECOVERED.";

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
        $recent = Alert::where('device_id', $device->id)
            ->where('type', 'high_latency')
            ->where('created_at', '>=', now()->subMinutes(30))
            ->exists();

        if (!$recent) {
            Alert::create([
                'device_id'  => $device->id,
                'type'       => 'high_latency',
                'message'    => "⚠️ High latency on [{$device->name}]: {$latencyMs}ms",
                'created_at' => now(),
            ]);
        }
    }
}