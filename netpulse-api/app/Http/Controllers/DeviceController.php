<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Services\MonitoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class DeviceController extends Controller
{
    use AuthorizesRequests;

    private const VALID_TYPES = [
        'router','switch','server','firewall','ap',
        'phone','tablet','laptop','pc','cctv','printer','smarttv','other'
    ];

    public function __construct(private MonitoringService $monitoring) {}

    public function index(Request $request): JsonResponse
    {
        $devices = Device::query()
            ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('ip_address', 'like', "%{$s}%"))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->type,   fn($q, $t) => $q->where('type', $t))
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $devices]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Device::class);

        $data = $request->validate([
            'name'        => ['required', 'string', 'max:100'],
            'ip_address'  => ['required', 'ip'],
            'type'        => ['required', 'in:' . implode(',', self::VALID_TYPES)],
            'location'    => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
        ]);

        $device = Device::create([...$data, 'created_by' => $request->user()->id]);
        $this->monitoring->checkDevice($device);

        return response()->json(['data' => $device->fresh()], 201);
    }

    public function show(Device $device): JsonResponse
    {
        return response()->json(['data' => $device->load('creator')]);
    }

    public function update(Request $request, Device $device): JsonResponse
    {
        $this->authorize('update', $device);

        $data = $request->validate([
            'name'        => ['sometimes', 'string', 'max:100'],
            'ip_address'  => ['sometimes', 'ip'],
            'type'        => ['sometimes', 'in:' . implode(',', self::VALID_TYPES)],
            'location'    => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
        ]);

        $device->update($data);
        return response()->json(['data' => $device->fresh()]);
    }

    public function destroy(Device $device): JsonResponse
    {
        $this->authorize('delete', $device);
        $device->delete();
        return response()->json(['message' => 'Device deleted.']);
    }

    public function ping(Device $device): JsonResponse
    {
        $log = $this->monitoring->checkDevice($device);
        return response()->json([
            'status'     => $device->fresh()->status,
            'latency_ms' => $log->latency_ms,
            'checked_at' => $log->checked_at,
        ]);
    }
}