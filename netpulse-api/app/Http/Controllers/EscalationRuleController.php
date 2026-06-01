<?php

namespace App\Http\Controllers;

use App\Models\EscalationRule;
use App\Models\Webhook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EscalationRuleController extends Controller
{
    public function index(): JsonResponse
    {
        $rules = EscalationRule::with('webhook:id,name,url')->orderBy('delay_minutes')->get();

        return response()->json(['data' => $rules]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $data = $request->validate([
            'webhook_id'     => ['required', 'exists:webhooks,id'],
            'delay_minutes'  => ['required', 'integer', 'min:1', 'max:1440'],
        ]);

        $rule = EscalationRule::create([...$data, 'enabled' => true]);

        return response()->json(['data' => $rule->load('webhook:id,name,url')], 201);
    }

    public function update(Request $request, EscalationRule $escalationRule): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $data = $request->validate([
            'delay_minutes' => ['sometimes', 'integer', 'min:1', 'max:1440'],
            'enabled'       => ['sometimes', 'boolean'],
        ]);

        $escalationRule->update($data);

        return response()->json(['data' => $escalationRule->load('webhook:id,name,url')]);
    }

    public function destroy(Request $request, EscalationRule $escalationRule): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $escalationRule->delete();

        return response()->json(['message' => 'Escalation rule deleted.']);
    }
}
