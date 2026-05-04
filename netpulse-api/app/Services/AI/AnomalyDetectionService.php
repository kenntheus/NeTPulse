<?php

namespace App\Services\AI;

use App\Models\Alert;
use App\Models\Device;
use App\Models\MonitoringLog;
use Illuminate\Support\Facades\Log;

class AnomalyDetectionService
{
    private const WINDOW_SIZE   = 100;
    private const SPIKE_Z       = 2.5;
    private const FAST_Z        = -1.5;
    private const MIN_SAMPLES   = 10;
    private const THROTTLE_MINS = 30;

    public function analyse(Device $device, int $latencyMs): void
    {
        $baseline = $this->getBaseline($device->id);
        if (!$baseline || $baseline['stddev'] < 1) return;

        $z = ($latencyMs - $baseline['mean']) / $baseline['stddev'];

        if ($z > self::SPIKE_Z) {
            $this->createAnomalyAlert($device, $latencyMs, $baseline['mean'], $z, 'spike');
        }

        if ($z < self::FAST_Z && $latencyMs < 2) {
            $this->createAnomalyAlert($device, $latencyMs, $baseline['mean'], $z, 'suspicious_fast');
        }
    }

    public function analyseAll(): void
    {
        Device::where('status', 'online')->get()->each(function (Device $device) {
            if ($device->latency_ms === null) return;
            try {
                $this->analyse($device, $device->latency_ms);
            } catch (\Exception $e) {
                Log::error("[Anomaly] Device {$device->id}: " . $e->getMessage());
            }
        });
    }

    public function getBaseline(int $deviceId): ?array
    {
        $samples = MonitoringLog::where('device_id', $deviceId)
            ->where('status', 'online')
            ->whereNotNull('latency_ms')
            ->orderByDesc('checked_at')
            ->limit(self::WINDOW_SIZE)
            ->pluck('latency_ms')
            ->toArray();

        $count = count($samples);
        if ($count < self::MIN_SAMPLES) return null;

        $mean     = array_sum($samples) / $count;
        $variance = array_sum(array_map(fn($x) => ($x - $mean) ** 2, $samples)) / $count;
        $stddev   = sqrt($variance);

        return [
            'mean'   => round($mean, 2),
            'stddev' => round($stddev, 2),
            'count'  => $count,
            'min'    => min($samples),
            'max'    => max($samples),
        ];
    }

    public function getAllBaselines(): array
    {
        $results = [];
        Device::all()->each(function (Device $device) use (&$results) {
            $baseline = $this->getBaseline($device->id);
            if ($baseline) {
                $results[] = array_merge($baseline, [
                    'device_id'   => $device->id,
                    'device_name' => $device->name,
                    'ip_address'  => $device->ip_address,
                    'current_ms'  => $device->latency_ms,
                    'status'      => $device->status,
                ]);
            }
        });
        return $results;
    }

    private function createAnomalyAlert(Device $device, int $current, float $mean, float $z, string $type): void
    {
        $recent = Alert::where('device_id', $device->id)
            ->where('type', 'high_latency')
            ->where('created_at', '>=', now()->subMinutes(self::THROTTLE_MINS))
            ->exists();

        if ($recent) return;

        $zf      = number_format(abs($z), 1);
        $message = match($type) {
            'spike'           => "🔺 Latency anomaly on [{$device->name}]: {$current}ms (normal ~{$mean}ms, Z={$zf}σ). Possible congestion.",
            'suspicious_fast' => "⚡ Suspicious response from [{$device->name}]: {$current}ms (normal ~{$mean}ms). Possible ARP spoofing.",
            default           => "⚠️ Anomaly on [{$device->name}]: {$current}ms",
        };

        Alert::create([
            'device_id'  => $device->id,
            'type'       => 'high_latency',
            'message'    => $message,
            'created_at' => now(),
        ]);

        Log::info("[Anomaly] {$message}");
    }
}