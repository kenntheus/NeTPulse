<?php

namespace App\Services\AI;

use App\Models\Alert;
use App\Models\Device;
use App\Models\MonitoringLog;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class AnomalyDetectionService
{
    private const MIN_SAMPLES = 20;

    private const Z_SCORE_THRESHOLD = 2.5;

    private const HIGH_LATENCY_ABSOLUTE = 200;

    private const COOLDOWN_MINUTES = 20;

    public function detectAll(): array
    {
        $results = [];

        Device::where('status', 'online')->get()->each(function (Device $device) use (&$results) {
            $result = $this->detectForDevice($device);
            if ($result) {
                $results[] = $result;
            }
        });

        return $results;
    }

    public function detectForDevice(Device $device): ?array
    {
        $logs = MonitoringLog::where('device_id', $device->id)
            ->where('status', 'online')
            ->whereNotNull('latency_ms')
            ->orderByDesc('checked_at')
            ->limit(100)
            ->get();

        if ($logs->count() < self::MIN_SAMPLES) {
            return null;
        }

        $latencies  = $logs->pluck('latency_ms')->map(fn($v) => (float) $v);
        $latest     = $latencies->first();
        $historical = $latencies->slice(1);

        $mean   = $historical->average();
        $stddev = $this->standardDeviation($historical);

        if ($stddev < 0.5) {
            $stddev = 0.5;
        }

        $zScore = abs($latest - $mean) / $stddev;

        $isAnomaly = $zScore >= self::Z_SCORE_THRESHOLD
                  || $latest >= self::HIGH_LATENCY_ABSOLUTE;

        if (!$isAnomaly) {
            return null;
        }

        $recentAlert = Alert::where('device_id', $device->id)
            ->where('type', 'high_latency')
            ->where('created_at', '>=', now()->subMinutes(self::COOLDOWN_MINUTES))
            ->exists();

        if ($recentAlert) {
            return null;
        }

        $severity = $zScore >= 4.0 || $latest >= 300 ? 'critical' : 'warning';

        $message = sprintf(
            '⚡ Anomaly on [%s]: latency %dms is %.1f× above normal (avg: %dms, σ: %dms)',
            $device->name,
            (int) $latest,
            $latest / max($mean, 1),
            (int) $mean,
            (int) $stddev
        );

        Alert::create([
            'device_id'  => $device->id,
            'type'       => 'high_latency',
            'message'    => $message,
            'created_at' => now(),
        ]);

        Log::info("[Anomaly] {$message}");

        return [
            'device_id'  => $device->id,
            'device'     => $device->name,
            'ip'         => $device->ip_address,
            'latency'    => (int) $latest,
            'mean'       => round($mean, 1),
            'stddev'     => round($stddev, 1),
            'z_score'    => round($zScore, 2),
            'severity'   => $severity,
            'message'    => $message,
        ];
    }

    public function getDeviceStats(Device $device): array
    {
        $logs = MonitoringLog::where('device_id', $device->id)
            ->where('status', 'online')
            ->whereNotNull('latency_ms')
            ->orderByDesc('checked_at')
            ->limit(100)
            ->get();

        if ($logs->count() < self::MIN_SAMPLES) {
            return [
                'status'         => 'insufficient_data',
                'samples'        => $logs->count(),
                'min_required'   => self::MIN_SAMPLES,
            ];
        }

        $latencies = $logs->pluck('latency_ms')->map(fn($v) => (float) $v);
        $mean      = $latencies->average();
        $stddev    = $this->standardDeviation($latencies);
        $min       = $latencies->min();
        $max       = $latencies->max();

        $anomalyCount = $latencies->filter(function ($v) use ($mean, $stddev) {
            return $stddev > 0 && abs($v - $mean) / $stddev >= self::Z_SCORE_THRESHOLD;
        })->count();

        return [
            'status'        => 'ok',
            'samples'       => $logs->count(),
            'mean_ms'       => round($mean, 1),
            'stddev_ms'     => round($stddev, 1),
            'min_ms'        => (int) $min,
            'max_ms'        => (int) $max,
            'anomaly_count' => $anomalyCount,
            'anomaly_rate'  => round(($anomalyCount / $logs->count()) * 100, 1),
            'threshold_ms'  => round($mean + (self::Z_SCORE_THRESHOLD * $stddev), 0),
        ];
    }

    public function getNetworkSummary(): array
    {
        $devices  = Device::where('status', 'online')->get();
        $anomalies = [];
        $healthy   = 0;

        foreach ($devices as $device) {
            $stats = $this->getDeviceStats($device);
            if (isset($stats['anomaly_count']) && $stats['anomaly_count'] > 0) {
                $anomalies[] = array_merge($stats, ['device' => $device->name, 'ip' => $device->ip_address]);
            } elseif ($stats['status'] === 'ok') {
                $healthy++;
            }
        }

        return [
            'total_devices'   => $devices->count(),
            'healthy_devices' => $healthy,
            'devices_with_anomalies' => count($anomalies),
            'anomalies'       => $anomalies,
        ];
    }

    private function standardDeviation(Collection $values): float
    {
        $count = $values->count();
        if ($count < 2) return 0.0;

        $mean      = $values->average();
        $variance  = $values->map(fn($v) => pow($v - $mean, 2))->average();

        return sqrt($variance);
    }
}