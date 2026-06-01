<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::orderBy('created_at')->get()->map(fn (User $u) => $this->format($u));

        return response()->json(['data' => $users]);
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot change your own role.'], 422);
        }

        $data = $request->validate([
            'role' => ['required', 'in:admin,viewer'],
        ]);

        $user->update(['role' => $data['role']]);

        return response()->json(['data' => $this->format($user->fresh())]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account here.'], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    private function format(User $user): array
    {
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->role,
            'verified'   => $user->isVerified(),
            'created_at' => $user->created_at,
        ];
    }
}
