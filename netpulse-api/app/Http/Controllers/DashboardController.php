<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\MonitoringLog;
use App\Models\Alert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

// ──────────────────────────────────────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────────────────────────────────────

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard/summary
     */
    public function summary(): JsonResponse
    {
        $devices = Device::all();
        return response()->json([
            'total'          => $devices->count(),
            'online'         => $devices->where('status', 'online')->count(),
            'offline'        => $devices->where('status', 'offline')->count(),
            'unknown'        => $devices->where('status', 'unknown')->count(),
            'unread_alerts'  => Alert::unread()->count(),
        ]);
    }

    /**
     * GET /api/dashboard/latency-chart?device_id=1&hours=24
     */
    public function latencyChart(Request $request): JsonResponse
    {
        $hours    = min((int) $request->query('hours', 24), 168); // cap at 7 days
        $deviceId = $request->query('device_id');

        $logs = MonitoringLog::when($deviceId, fn($q) => $q->where('device_id', $deviceId))
            ->where('checked_at', '>=', now()->subHours($hours))
            ->where('status', 'online')
            ->selectRaw("DATE_FORMAT(checked_at, '%m-%d %H:%i') as time, ROUND(AVG(latency_ms)) as avg_latency")
            ->groupByRaw("DATE_FORMAT(checked_at, '%Y-%m-%d %H:%i')")
            ->orderByRaw("MIN(checked_at)")
            ->limit(288) // max 288 points (24h × 12 per hour)
            ->get();

        return response()->json($logs);
    }

    /**
     * GET /api/dashboard/uptime-chart?device_id=1&days=7
     */
    public function uptimeChart(Request $request): JsonResponse
    {
        $days     = min((int) $request->query('days', 7), 30);
        $deviceId = $request->query('device_id');

        $logs = MonitoringLog::when($deviceId, fn($q) => $q->where('device_id', $deviceId))
            ->where('checked_at', '>=', now()->subDays($days))
            ->selectRaw("DATE(checked_at) as date,
                         SUM(status = 'online') as online_count,
                         COUNT(*) as total_count")
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($row) => [
                'date'   => $row->date,
                'uptime' => $row->total_count > 0
                    ? round(($row->online_count / $row->total_count) * 100, 1)
                    : 0,
            ]);

        return response()->json($logs);
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Monitoring Logs
// ──────────────────────────────────────────────────────────────────────────────

class MonitoringLogController extends Controller
{
    /**
     * GET /api/devices/{device}/logs?from=2024-01-01&to=2024-01-07&per_page=50
     */
    public function index(Request $request, Device $device): JsonResponse
    {
        $logs = MonitoringLog::where('device_id', $device->id)
            ->when($request->from, fn($q, $d) => $q->where('checked_at', '>=', $d))
            ->when($request->to,   fn($q, $d) => $q->where('checked_at', '<=', $d . ' 23:59:59'))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->orderByDesc('checked_at')
            ->paginate($request->per_page ?? 50);

        return response()->json($logs);
    }

    /**
     * GET /api/logs/export?device_id=1&from=...&to=...
     * Export as CSV download.
     */
    public function export(Request $request): Response
    {
        $deviceId = $request->query('device_id');

        $logs = MonitoringLog::with('device')
            ->when($deviceId, fn($q) => $q->where('device_id', $deviceId))
            ->when($request->from, fn($q, $d) => $q->where('checked_at', '>=', $d))
            ->when($request->to,   fn($q, $d) => $q->where('checked_at', '<=', $d . ' 23:59:59'))
            ->orderByDesc('checked_at')
            ->limit(50000)
            ->get();

        $csv  = "ID,Device,IP Address,Status,Latency (ms),Checked At\n";
        foreach ($logs as $log) {
            $csv .= implode(',', [
                $log->id,
                '"' . ($log->device->name ?? '') . '"',
                $log->device->ip_address ?? '',
                $log->status,
                $log->latency_ms ?? '',
                $log->checked_at,
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="netpulse-logs-' . now()->format('Y-m-d') . '.csv"',
        ]);
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Alerts
// ──────────────────────────────────────────────────────────────────────────────

class AlertController extends Controller
{
    /**
     * GET /api/alerts?unread=1
     */
    public function index(Request $request): JsonResponse
    {
        $alerts = Alert::with('device')
            ->when($request->unread, fn($q) => $q->unread())
            ->orderByDesc('created_at')
            ->paginate(30);

        return response()->json($alerts);
    }

    /**
     * PATCH /api/alerts/{alert}/read
     */
    public function markRead(Alert $alert): JsonResponse
    {
        $alert->update(['is_read' => true]);
        return response()->json(['data' => $alert]);
    }

    /**
     * POST /api/alerts/read-all
     */
    public function markAllRead(): JsonResponse
    {
        Alert::unread()->update(['is_read' => true]);
        return response()->json(['message' => 'All alerts marked as read.']);
    }

    /**
     * DELETE /api/alerts/{alert}
     */
    public function destroy(Alert $alert): JsonResponse
    {
        $alert->delete();
        return response()->json(['message' => 'Alert deleted.']);
    }
}