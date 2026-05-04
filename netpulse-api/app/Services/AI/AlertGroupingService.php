<?php

namespace App\Services\AI;

use App\Models\Alert;
use App\Models\Device;
use Illuminate\Support\Facades\Log;

/**
 * AlertGroupingService
 *
 * Detects when multiple devices go offline within a short window
 * and creates a single root-cause alert instead of N separate alerts.
 *
 * Logic:
 *   - If 3+ devices go offline within 60 seconds → network-wide event
 *   - Suppress individual alerts, create one grouped alert
 *   - Identify the likely root cause (router at .1 or .254)
 *
 * Resume talking point:
 *   "Built AI-powered alert correlation to identify root-cause network
 *    events and suppress alert storms"
 */
class AlertGroupingService
{
    private const GROUP_WINDOW_SECS = 60;  // seconds to look back
    private const GROUP_THRESHOLD   = 3;   // devices offline to trigger grouping

    /**
     * Run after each monitoring cycle.
     * Checks if a cascade of offline events just occurred.
     */
    public function detectCascade(): void
    {
        // Count devices that went offline in the last N seconds
        $recentOfflineAlerts = Alert::where('type', 'offline')
            ->where('created_at', '>=', now()->subSeconds(self::GROUP_WINDOW_SECS))
            ->where('message', 'not like', '%[ROOT CAUSE]%')
            ->where('message', 'not like', '%[GROUPED]%')
            ->get();

        $count = $recentOfflineAlerts->count();

        if ($count < self::GROUP_THRESHOLD) return;

        // Already raised a grouped alert recently?
        $existingGroup = Alert::where('type', 'offline')
            ->where('message', 'like', '%[GROUPED]%')
            ->where('created_at', '>=', now()->subMinutes(5))
            ->exists();

        if ($existingGroup) return;

        // Identify affected devices
        $deviceIds    = $recentOfflineAlerts->pluck('device_id')->unique();
        $deviceNames  = Device::whereIn('id', $deviceIds)->pluck('name')->join(', ');

        // Try to identify root cause — is the router/gateway also offline?
        $rootCause = $this->identifyRootCause($deviceIds->toArray());

        $message = $rootCause
            ? "🌐 [GROUPED] Network outage detected — {$count} devices offline. Root cause: [{$rootCause->name}] ({$rootCause->ip_address}) may be down. Affected: {$deviceNames}"
            : "🌐 [GROUPED] Network event — {$count} devices went offline simultaneously: {$deviceNames}. Check your router/switch.";

        // Create one grouped alert (use first affected device as reference)
        Alert::create([
            'device_id'  => $deviceIds->first(),
            'type'       => 'offline',
            'message'    => $message,
            'created_at' => now(),
        ]);

        // Mark individual alerts as grouped so they're visually de-emphasised
        Alert::whereIn('id', $recentOfflineAlerts->pluck('id'))
            ->update(['message' => \DB::raw("CONCAT('[GROUPED] ', message)")]);

        Log::warning("[AlertGrouping] Cascade detected: {$count} devices. {$message}");
    }

    /**
     * Identify the likely root cause device (router/gateway).
     * Looks for a device at .1 or .254 that is also offline.
     */
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

    /**
     * Get alert grouping stats for the AI insights panel.
     */
    public function getGroupingStats(): array
    {
        $totalAlerts   = Alert::count();
        $groupedAlerts = Alert::where('message', 'like', '%[GROUPED]%')->count();
        $cascades      = Alert::where('type', 'offline')
            ->where('message', 'like', '%Network outage%')
            ->count();

        return [
            'total_alerts'   => $totalAlerts,
            'grouped_alerts' => $groupedAlerts,
            'cascades_found' => $cascades,
            'noise_reduced'  => $totalAlerts > 0
                ? round(($groupedAlerts / $totalAlerts) * 100, 1)
                : 0,
        ];
    }
}