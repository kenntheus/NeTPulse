<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Services\MonitoringService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    use AuthorizesRequests;

    private const VALID_TYPES = [
        'router', 'switch', 'server', 'firewall', 'ap',
        'phone', 'tablet', 'laptop', 'pc', 'cctv', 'printer', 'smarttv', 'other',
    ];

    public function __construct(private MonitoringService $monitoring) {}

    public function index(Request $request): JsonResponse
    {
        $devices = Device::query()
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('ip_address', 'like', "%{$s}%"))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $devices]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Device::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'ip_address' => ['required', 'ip'],
            'type' => ['required', 'in:'.implode(',', self::VALID_TYPES)],
            'location' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
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
            'name' => ['sometimes', 'string', 'max:100'],
            'ip_address' => ['sometimes', 'ip'],
            'type' => ['sometimes', 'in:'.implode(',', self::VALID_TYPES)],
            'location' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
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

    public function bulkDestroy(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer'],
        ]);

        $count = Device::whereIn('id', $data['ids'])->delete();

        return response()->json(['message' => "{$count} device(s) deleted.", 'count' => $count]);
    }

    public function mute(Request $request, Device $device): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $data = $request->validate([
            'minutes' => ['nullable', 'integer', 'min:1', 'max:10080'],
        ]);

        $minutes = $data['minutes'] ?? 60;
        $device->update(['muted_until' => now()->addMinutes($minutes)]);

        return response()->json([
            'data' => $device->fresh(),
            'message' => "Alerts muted for {$minutes} minute(s).",
        ]);
    }

    public function unmute(Request $request, Device $device): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $device->update(['muted_until' => null]);

        return response()->json(['data' => $device->fresh(), 'message' => 'Alerts unmuted.']);
    }

    public function import(Request $request): JsonResponse
    {
        $this->authorize('create', Device::class);

        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:512'],
        ]);

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        $header = array_map('strtolower', array_map('trim', fgetcsv($handle)));

        foreach (['name', 'ip_address'] as $col) {
            if (! in_array($col, $header)) {
                fclose($handle);

                return response()->json(['message' => 'CSV must have columns: name, ip_address'], 422);
            }
        }

        $created = 0;
        $errors = [];
        $row = 1;

        while (($line = fgetcsv($handle)) !== false) {
            $row++;
            if (count($line) < count($header)) {
                $errors[] = "Row {$row}: not enough columns.";

                continue;
            }

            $data = array_combine($header, array_map('trim', $line));

            if (empty($data['name']) || empty($data['ip_address'])) {
                $errors[] = "Row {$row}: name and ip_address are required.";

                continue;
            }

            if (! filter_var($data['ip_address'], FILTER_VALIDATE_IP)) {
                $errors[] = "Row {$row}: invalid IP '{$data['ip_address']}'.";

                continue;
            }

            $type = $data['type'] ?? 'other';
            if (! in_array($type, self::VALID_TYPES)) {
                $type = 'other';
            }

            Device::create([
                'name' => substr($data['name'], 0, 100),
                'ip_address' => $data['ip_address'],
                'type' => $type,
                'location' => isset($data['location']) ? substr($data['location'], 0, 150) : null,
                'description' => $data['description'] ?? null,
                'created_by' => $request->user()->id,
            ]);
            $created++;
        }

        fclose($handle);

        return response()->json([
            'created' => $created,
            'errors' => $errors,
            'message' => "{$created} device(s) imported.",
        ]);
    }

    public function ping(Device $device): JsonResponse
    {
        $log = $this->monitoring->checkDevice($device);

        return response()->json([
            'status' => $device->fresh()->status,
            'latency_ms' => $log->latency_ms,
            'checked_at' => $log->checked_at,
        ]);
    }
}
