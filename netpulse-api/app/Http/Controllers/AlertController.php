<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function destroy(Alert $alert): JsonResponse
    {
        $alert->delete();

        return response()->json(['message' => 'Alert deleted.']);
    }
}
