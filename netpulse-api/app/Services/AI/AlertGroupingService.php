<?php

namespace App\Services\AI;

use App\Models\Alert;
use App\Models\Device;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AlertGroupingService
{
    private const GROUP_WINDOW_SECS = 60;

    private const GROUP_THRESHOLD = 3;

    public function detectCascade(): void
    {
        $recentOfflineAlerts = Alert::where('type', 'offline')
            ->where('created_at', '>=', now()->subSeconds(self::GROUP_WINDOW_SECS))
            ->where('message', 'not like', '%[ROOT CAUSE]%')
            ->where('message', 'not like', '%[GROUPED]%')
            ->get();

        $count = $recentOfflineAlerts->count();

        if ($count < self::GROUP_THRESHOLD) {
            return;
        }

        $existingGroup = Alert::where('type', 'offline')
            ->where('message', 'like', '%[GROUPED]%')
            ->where('created_at', '>=', now()->subMinutes(5))
            ->exists();

        if ($existingGroup) {
            return;
        }

        $deviceIds = $recentOfflineAlerts->pluck('device_id')->unique();
        $deviceNames = Device::whereIn('id', $deviceIds)->pluck('name')->join(', ');

        $rootCause = $this->identifyRootCause($deviceIds->toArray());

        $message = $rootCause
            ? "🌐 [GROUPED] Network outage detected — {$count} devices offline. Root cause: [{$rootCause->name}] ({$rootCause->ip_address}) may be down. Affected: {$deviceNames}"
            : "🌐 [GROUPED] Network event — {$count} devices went offline simultaneously: {$deviceNames}. Check your router/switch.";

        Alert::create([
            'device_id' => $deviceIds->first(),
            'type' => 'offline',
            'message' => $message,
            'created_at' => now(),
        ]);

        Alert::whereIn('id', $recentOfflineAlerts->pluck('id'))
            ->update(['message' => DB::raw("CONCAT('[GROUPED] ', message)")]);

        Log::warning("[AlertGrouping] Cascade detected: {$count} devices. {$message}");
    }

    private function identifyRootCause(array $offlineDeviceIds): ?Device
    {
        return Device::whereIn('id', $offlineDeviceIds)
            ->where(function ($q) {
                $q->where('ip_address', 'like', '%.1')
                    ->orWhere('ip_address', 'like', '%.254')
                    ->orWhere('type', 'router');
            })
            ->first();
    }

    public function getGroupingStats(): array
    {
        $totalAlerts = Alert::count();
        $groupedAlerts = Alert::where('message', 'like', '%[GROUPED]%')->count();
        $cascades = Alert::where('type', 'offline')
            ->where('message', 'like', '%Network outage%')
            ->count();

        return [
            'total_alerts' => $totalAlerts,
            'grouped_alerts' => $groupedAlerts,
            'cascades_found' => $cascades,
            'noise_reduced' => $totalAlerts > 0
                ? round(($groupedAlerts / $totalAlerts) * 100, 1)
                : 0,
        ];
    }
}
