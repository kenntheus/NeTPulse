<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $logs = AuditLog::with('user:id,name,email')
            ->when($request->action, fn ($q, $a) => $q->where('action', 'like', "%{$a}%"))
            ->when($request->user_id, fn ($q, $u) => $q->where('user_id', $u))
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json($logs);
    }
}
