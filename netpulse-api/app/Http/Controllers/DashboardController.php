<?php

namespace App\Http\Controllers;

use App\Models\Alert;
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
            'total' => $devices->count(),
            'online' => $devices->where('status', 'online')->count(),
            'offline' => $devices->where('status', 'offline')->count(),
            'unknown' => $devices->where('status', 'unknown')->count(),
            'unread_alerts' => Alert::unread()->count(),
        ]);
    }

    public function latencyChart(Request $request): JsonResponse
    {
        $hours = min((int) $request->query('hours', 24), 168);
        $deviceId = $request->query('device_id');

        $bucket = 'FLOOR(UNIX_TIMESTAMP(checked_at) / 300)';

        $data = MonitoringLog::when($deviceId, fn ($q) => $q->where('device_id', $deviceId))
            ->where('checked_at', '>=', now()->subHours($hours))
            ->where('status', 'online')
            ->selectRaw("
                DATE_FORMAT(FROM_UNIXTIME(({$bucket}) * 300), '%m-%d %H:%i') as time,
                ROUND(AVG(latency_ms)) as avg_latency
            ")
            ->groupByRaw($bucket)
            ->orderByRaw($bucket)
            ->limit(288)
            ->get();

        return response()->json($data);
    }

    public function uptimeChart(Request $request): JsonResponse
    {
        $days = min((int) $request->query('days', 7), 30);
        $deviceId = $request->query('device_id');

        $data = MonitoringLog::when($deviceId, fn ($q) => $q->where('device_id', $deviceId))
            ->where('checked_at', '>=', now()->subDays($days))
            ->selectRaw("DATE(checked_at) as date,
                         SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_count,
                         COUNT(*) as total_count")
            ->groupByRaw('DATE(checked_at)')
            ->orderByRaw('DATE(checked_at)')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->date,
                'uptime' => $row->total_count > 0
                    ? round(($row->online_count / $row->total_count) * 100, 1)
                    : 0,
            ]);

        return response()->json($data);
    }
}
