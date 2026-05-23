<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AlertController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $alerts = Alert::with('device')
            ->when($request->unread, fn ($q) => $q->unread())
            ->orderByDesc('created_at')
            ->paginate(30);

        return response()->json($alerts);
    }

    public function markRead(Alert $alert): JsonResponse
    {
        $alert->update(['is_read' => true]);

        return response()->json(['data' => $alert]);
    }

    public function markAllRead(): JsonResponse
    {
        Alert::unread()->update(['is_read' => true]);

        return response()->json(['message' => 'All alerts marked as read.']);
    }

    public function acknowledge(Alert $alert): JsonResponse
    {
        $alert->update([
            'acknowledged_at' => now(),
            'acknowledged_by' => Auth::id(),
        ]);

        return response()->json(['data' => $alert]);
    }

    public function unacknowledge(Alert $alert): JsonResponse
    {
        $alert->update([
            'acknowledged_at' => null,
            'acknowledged_by' => null,
        ]);

        return response()->json(['data' => $alert]);
    }

    public function destroy(Alert $alert): JsonResponse
    {
        $alert->delete();

        return response()->json(['message' => 'Alert deleted.']);
    }
}
