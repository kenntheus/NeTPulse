<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\MaintenanceWindow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaintenanceWindowController extends Controller
{
    public function all(): JsonResponse
    {
        $windows = MaintenanceWindow::with(['device:id,name,ip_address,type', 'creator:id,name'])
            ->orderBy('starts_at')
            ->get();

        return response()->json(['data' => $windows]);
    }

    public function index(Device $device): JsonResponse
    {
        return response()->json([
            'data' => $device->maintenanceWindows()->with('creator:id,name')->get(),
        ]);
    }

    public function store(Request $request, Device $device): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $data = $request->validate([
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $window = $device->maintenanceWindows()->create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $window], 201);
    }

    public function destroy(Request $request, MaintenanceWindow $maintenanceWindow): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $maintenanceWindow->delete();

        return response()->json(['message' => 'Maintenance window deleted.']);
    }
}
