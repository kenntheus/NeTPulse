<?php

namespace App\Http\Controllers;

use App\Models\Webhook;
use App\Services\WebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class WebhookController extends Controller
{
    private const VALID_EVENTS = ['offline', 'recovered', 'high_latency'];

    public function index(): JsonResponse
    {
        return response()->json(['data' => Webhook::orderBy('name')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'url' => ['required', 'url', 'max:500'],
            'events' => ['required', 'array', 'min:1'],
            'events.*' => ['in:'.implode(',', self::VALID_EVENTS)],
            'active' => ['boolean'],
        ]);

        $webhook = Webhook::create([...$data, 'created_by' => $request->user()->id]);

        return response()->json(['data' => $webhook], 201);
    }

    public function update(Request $request, Webhook $webhook): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'url' => ['sometimes', 'url', 'max:500'],
            'events' => ['sometimes', 'array', 'min:1'],
            'events.*' => ['in:'.implode(',', self::VALID_EVENTS)],
            'active' => ['boolean'],
        ]);

        $webhook->update($data);

        return response()->json(['data' => $webhook->fresh()]);
    }

    public function destroy(Request $request, Webhook $webhook): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);
        $webhook->delete();

        return response()->json(['message' => 'Webhook deleted.']);
    }

    public function test(Request $request, Webhook $webhook, WebhookService $service): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        try {
            Http::timeout(5)->post($webhook->url, [
                'event' => 'test',
                'message' => 'NeTPulse webhook test',
                'timestamp' => now()->toIso8601String(),
            ]);

            return response()->json(['message' => 'Test payload sent.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed: '.$e->getMessage()], 422);
        }
    }
}
