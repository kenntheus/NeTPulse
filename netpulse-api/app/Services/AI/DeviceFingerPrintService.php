<?php

namespace App\Services\AI;

use App\Models\Device;
use App\Models\MonitoringLog;

/**
 * DeviceFingerprintService
 *
 * Classifies devices based on behavioural patterns from monitoring logs:
 *
 *   - Uptime pattern  → is it always on? does it sleep at night?
 *   - Active hours    → when is it most often online?
 *   - Response pattern → consistent latency = infrastructure, variable = user device
 *   - Offline pattern  → regular sleep schedule = phone/laptop
 *
 * Resume talking point:
 *   "Built a behavioural device classifier using activity pattern analysis
 *    on time-series monitoring data without requiring ML libraries"
 */
class DeviceFingerprintService
{
    /**
     * Analyse all devices and return fingerprint profiles.
     */
    public function fingerprintAll(): array
    {
        return Device::all()->map(fn($d) => $this->fingerprint($d))->toArray();
    }

    /**
     * Build a behavioural fingerprint for one device.
     */
    public function fingerprint(Device $device): array
    {
        $logs = MonitoringLog::where('device_id', $device->id)
            ->where('checked_at', '>=', now()->subDays(7))
            ->orderBy('checked_at')
            ->get();

        if ($logs->count() < 20) {
            return $this->emptyFingerprint($device);
        }

        $totalChecks  = $logs->count();
        $onlineLogs   = $logs->where('status', 'online');
        $offlineLogs  = $logs->where('status', 'offline');
        $uptimePct    = round(($onlineLogs->count() / $totalChecks) * 100, 1);

        // Latency stats
        $latencies    = $onlineLogs->pluck('latency_ms')->filter()->values();
        $avgLatency   = $latencies->count() ? round($latencies->avg(), 1) : null;
        $latencyStd   = $this->stddev($latencies->toArray());

        // Active hours — which hours of day is device most online?
        $activeHours  = $this->getActiveHours($onlineLogs);
        $peakHour     = $activeHours ? array_search(max($activeHours), $activeHours) : null;

        // Sleep pattern — does it go offline regularly at night?
        $hasSleepPattern = $this->detectSleepPattern($logs);

        // Behaviour classification
        $behaviour = $this->classifyBehaviour($uptimePct, $avgLatency, $latencyStd, $hasSleepPattern);

        // Suggested device type based on behaviour
        $suggestedType = $this->suggestType($behaviour, $device->type);

        return [
            'device_id'       => $device->id,
            'device_name'     => $device->name,
            'ip_address'      => $device->ip_address,
            'current_type'    => $device->type,
            'suggested_type'  => $suggestedType,
            'confidence'      => $this->confidence($behaviour),
            'uptime_pct'      => $uptimePct,
            'avg_latency_ms'  => $avgLatency,
            'latency_stddev'  => round($latencyStd, 1),
            'peak_hour'       => $peakHour,
            'has_sleep_pattern' => $hasSleepPattern,
            'behaviour'       => $behaviour,
            'active_hours'    => $activeHours,
            'total_checks'    => $totalChecks,
        ];
    }

    // ── Analysis helpers ──────────────────────────────────────────────────

    private function getActiveHours($onlineLogs): array
    {
        $hours = array_fill(0, 24, 0);
        foreach ($onlineLogs as $log) {
            $hour = (int) $log->checked_at->format('G');
            $hours[$hour]++;
        }
        return $hours;
    }

    /**
     * Detect if device has a regular sleep schedule (e.g. phone at night).
     * Looks for consistent offline periods between 11pm and 7am.
     */
    private function detectSleepPattern($logs): bool
    {
        $nightOffline = 0;
        $nightTotal   = 0;

        foreach ($logs as $log) {
            $hour = (int) $log->checked_at->format('G');
            if ($hour >= 23 || $hour < 7) {
                $nightTotal++;
                if ($log->status === 'offline') $nightOffline++;
            }
        }

        if ($nightTotal < 10) return false;

        // If >60% of night checks are offline → sleep pattern
        return ($nightOffline / $nightTotal) > 0.6;
    }

    /**
     * Classify device behaviour from metrics.
     */
    private function classifyBehaviour(
        float  $uptime,
        ?float $avgLatency,
        float  $latencyStd,
        bool   $sleeps
    ): string {
        // Always-on + very low/stable latency = infrastructure (router, switch, server)
        if ($uptime >= 98 && $avgLatency !== null && $avgLatency < 20 && $latencyStd < 5) {
            return 'infrastructure';
        }

        // Always-on + higher latency = server/NAS
        if ($uptime >= 95 && $avgLatency !== null && $avgLatency >= 20) {
            return 'server';
        }

        // Sleeps at night + variable uptime = phone/laptop
        if ($sleeps && $uptime < 90) {
            return 'personal_device';
        }

        // High variability + moderate uptime = user device
        if ($latencyStd > 15 && $uptime < 95) {
            return 'personal_device';
        }

        // Moderate uptime, no sleep = smart home device
        if ($uptime >= 80 && $uptime < 98 && !$sleeps) {
            return 'smart_home';
        }

        return 'unknown';
    }

    private function suggestType(string $behaviour, string $currentType): string
    {
        return match($behaviour) {
            'infrastructure'  => in_array($currentType, ['router','switch','firewall','ap'])
                                    ? $currentType : 'router',
            'server'          => in_array($currentType, ['server','pc']) ? $currentType : 'server',
            'personal_device' => in_array($currentType, ['phone','laptop','tablet']) ? $currentType : 'phone',
            'smart_home'      => in_array($currentType, ['smarttv','cctv','printer']) ? $currentType : 'smarttv',
            default           => $currentType,
        };
    }

    private function confidence(string $behaviour): string
    {
        return match($behaviour) {
            'infrastructure'  => 'high',
            'server'          => 'high',
            'personal_device' => 'medium',
            'smart_home'      => 'medium',
            default           => 'low',
        };
    }

    private function stddev(array $values): float
    {
        $count = count($values);
        if ($count < 2) return 0;
        $mean     = array_sum($values) / $count;
        $variance = array_sum(array_map(fn($x) => ($x - $mean) ** 2, $values)) / $count;
        return sqrt($variance);
    }

    private function emptyFingerprint(Device $device): array
    {
        return [
            'device_id'         => $device->id,
            'device_name'       => $device->name,
            'ip_address'        => $device->ip_address,
            'current_type'      => $device->type,
            'suggested_type'    => $device->type,
            'confidence'        => 'none',
            'uptime_pct'        => null,
            'avg_latency_ms'    => null,
            'latency_stddev'    => null,
            'peak_hour'         => null,
            'has_sleep_pattern' => false,
            'behaviour'         => 'insufficient_data',
            'active_hours'      => [],
            'total_checks'      => 0,
        ];
    }
}