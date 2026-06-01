<?php

namespace App\Http\Controllers;

use App\Models\Device;
use Illuminate\Http\JsonResponse;

class StatusController extends Controller
{
    public function index(): JsonResponse
    {
        $devices = Device::orderBy('name')->get(['id', 'name', 'ip_address', 'type', 'status', 'latency_ms', 'last_checked_at']);

        $total   = $devices->count();
        $online  = $devices->where('status', 'online')->count();
        $offline = $devices->where('status', 'offline')->count();
        $unknown = $total - $online - $offline;

        if ($total === 0 || $offline === 0) {
            $overall = 'operational';
        } elseif ($offline / $total >= 0.5) {
            $overall = 'major_outage';
        } elseif ($offline > 0) {
            $overall = 'partial_outage';
        } else {
            $overall = 'operational';
        }

        return response()->json([
            'overall'     => $overall,
            'summary'     => compact('total', 'online', 'offline', 'unknown'),
            'devices'     => $devices,
            'generated_at' => now()->toIso8601String(),
        ]);
    }
}
