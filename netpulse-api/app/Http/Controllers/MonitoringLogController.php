<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\MonitoringLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MonitoringLogController extends Controller
{
    /**
     * GET /api/devices/{device}/logs
     *
     * Query params:
     *   from     (date)    e.g. 2024-01-01
     *   to       (date)    e.g. 2024-01-07
     *   status   (string)  online|offline
     *   per_page (int)     default 50
     */
    public function index(Request $request, Device $device): JsonResponse
    {
        $logs = MonitoringLog::where('device_id', $device->id)
            ->when($request->from,   fn($q, $d) => $q->where('checked_at', '>=', $d))
            ->when($request->to,     fn($q, $d) => $q->where('checked_at', '<=', $d . ' 23:59:59'))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->orderByDesc('checked_at')
            ->paginate((int) $request->per_page ?? 50);

        return response()->json($logs);
    }

    /**
     * GET /api/logs/export
     *
     * Exports monitoring logs as a CSV download.
     * Query params: device_id, from, to
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

        // Build CSV string
        $csv = "ID,Device Name,IP Address,Status,Latency (ms),Checked At\n";

        foreach ($logs as $log) {
            $csv .= implode(',', [
                $log->id,
                '"' . ($log->device->name ?? 'Unknown') . '"',
                $log->device->ip_address ?? '',
                $log->status,
                $log->latency_ms ?? '',
                $log->checked_at,
            ]) . "\n";
        }

        $filename = 'netpulse-logs-' . now()->format('Y-m-d') . '.csv';

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}