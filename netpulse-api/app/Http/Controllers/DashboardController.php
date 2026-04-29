<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\Device;
use App\Models\MonitoringLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard/summary
     */
    public function summary(): JsonResponse
    {
        $devices = Device::all();

        return response()->json([
            'total'         => $devices->count(),
            'online'        => $devices->where('status', 'online')->count(),
            'offline'       => $devices->where('status', 'offline')->count(),
            'unknown'       => $devices->where('status', 'unknown')->count(),
            'unread_alerts' => Alert::unread()->count(),
        ]);
    }

    /**
     * GET /api/dashboard/latency-chart?device_id=1&hours=24
     */
    public function latencyChart(Request $request): JsonResponse
    {
        $hours    = min((int) $request->query('hours', 24), 168);
        $deviceId = $request->query('device_id');

        $data = MonitoringLog::when($deviceId, fn($q) => $q->where('device_id', $deviceId))
            ->where('checked_at', '>=', now()->subHours($hours))
            ->where('status', 'online')
            ->selectRaw("DATE_FORMAT(checked_at, '%m-%d %H:%i') as time, ROUND(AVG(latency_ms)) as avg_latency")
            ->groupByRaw("DATE_FORMAT(checked_at, '%Y-%m-%d %H:%i')")
            ->orderByRaw("MIN(checked_at)")
            ->limit(288)
            ->get();

        return response()->json($data);
    }

    /**
     * GET /api/dashboard/uptime-chart?device_id=1&days=7
     */
    public function uptimeChart(Request $request): JsonResponse
    {
        $days     = min((int) $request->query('days', 7), 30);
        $deviceId = $request->query('device_id');

        $data = MonitoringLog::when($deviceId, fn($q) => $q->where('device_id', $deviceId))
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

        return response()->json($data);
    }
}