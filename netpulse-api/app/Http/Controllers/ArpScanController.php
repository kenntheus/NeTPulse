<?php

namespace App\Http\Controllers;

use App\Services\ArpScannerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArpScanController extends Controller
{
    public function __construct(private ArpScannerService $scanner) {}

    public function scan(): JsonResponse
    {
        $result = $this->scanner->scan();

        return response()->json([
            'message' => "Scan complete. Found {$result['found']} devices on the network. {$result['new']} new device(s) added.",
            'found' => $result['found'],
            'new' => $result['new'],
            'entries' => $result['entries'],
        ]);
    }

    public function receivePush(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entries' => ['required', 'array', 'min:1'],
            'entries.*.ip' => ['required', 'ip'],
            'entries.*.mac' => ['required', 'string', 'max:17'],
            'entries.*.type' => ['sometimes', 'string'],
        ]);

        $result = $this->scanner->scan($validated['entries']);

        return response()->json([
            'message' => "Agent push processed. Found {$result['found']} devices. {$result['new']} new.",
            'found' => $result['found'],
            'new' => $result['new'],
        ]);
    }
}
