<?php

namespace App\Services;

use App\Models\Device;
use App\Models\MonitoringLog;
use App\Models\Alert;
use App\Events\DeviceStatusUpdated;

class MonitoringService
{
    /**
     * Ping a single device, log the result, fire events & alerts.
     */
    public function checkDevice(Device $device): MonitoringLog
    {
        [$status, $latencyMs] = $this->ping($device->ip_address);

        // Persist log
        $log = MonitoringLog::create([
            'device_id'  => $device->id,
            'status'     => $status,
            'latency_ms' => $latencyMs,
        ]);

        // Detect status change → create alert
        if ($device->status !== $status) {
            $this->handleStatusChange($device, $status);
        }

        // Update device snapshot
        $device->update([
            'status'          => $status,
            'last_checked_at' => now(),
        ]);

        // Broadcast via WebSocket (Pusher)
        broadcast(new DeviceStatusUpdated($device, $log))->toOthers();

        return $log;
    }

    /**
     * ICMP ping using proc_open for cross-platform support.
     * Returns ['online'|'offline', latency_ms|null]
     */
    private function ping(string $ip): array
    {
        $isWindows = PHP_OS_FAMILY === 'Windows';
        $cmd = $isWindows
            ? "ping -n 1 -w 1000 {$ip}"
            : "ping -c 1 -W 1 {$ip}";

        $start  = microtime(true);
        $output = shell_exec($cmd);
        $elapsed = (int) round((microtime(true) - $start) * 1000);

        $success = $isWindows
            ? str_contains($output, 'TTL=')
            : str_contains($output, '1 received');

        return $success
            ? ['online',  $elapsed]
            : ['offline', null];
    }

    private function handleStatusChange(Device $device, string $newStatus): void
    {
        $type    = $newStatus === 'offline' ? 'offline' : 'recovered';
        $message = $newStatus === 'offline'
            ? "Device {$device->name} ({$device->ip_address}) is OFFLINE."
            : "Device {$device->name} ({$device->ip_address}) has recovered.";

        Alert::create([
            'device_id' => $device->id,
            'type'      => $type,
            'message'   => $message,
        ]);

        // Optional: send email
        // Mail::to(config('monitoring.alert_email'))
        //     ->send(new DeviceAlertMail($device, $message));
    }

    /**
     * Check all devices — called by the scheduler.
     */
    public function checkAll(): void
    {
        Device::all()->each(fn($device) => $this->checkDevice($device));
    }
}