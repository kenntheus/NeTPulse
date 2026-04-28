<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\MonitoringLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $devices = Device::all();

        return response()->json([
            'total'   => $devices->count(),
            'online'  => $devices->where('status', 'online')->count(),
            'offline' => $devices->where('status', 'offline')->count(),
            'unknown' => $devices->where('status', 'unknown')->count(),
        ]);
    }

    public function latencyChart(Request $request): JsonResponse
    {
        $deviceId = $request->query('device_id');
        $hours    = $request->query('hours', 24);

        $logs = MonitoringLog::when($deviceId, fn($q) => $q->where('device_id', $deviceId))
            ->where('checked_at', '>=', now()->subHours($hours))
            ->where('status', 'online')
            ->selectRaw('DATE_FORMAT(checked_at, "%H:%i") as time, AVG(latency_ms) as avg_latency')
            ->groupByRaw('DATE_FORMAT(checked_at, "%Y-%m-%d %H:%i")')
            ->orderBy('checked_at')
            ->get();

        return response()->json($logs);
    }

    public function uptimeChart(Request $request): JsonResponse
    {
        $deviceId = $request->query('device_id');
        $days     = $request->query('days', 7);

        $logs = MonitoringLog::when($deviceId, fn($q) => $q->where('device_id', $deviceId))
            ->where('checked_at', '>=', now()->subDays($days))
            ->selectRaw('DATE(checked_at) as date,
                         SUM(status = "online") as online_count,
                         COUNT(*) as total_count')
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