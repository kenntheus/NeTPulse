<?php

namespace App\Http\Controllers;

use App\Mail\VerificationCodeMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AccountController extends Controller
{
    /**
     * Update the authenticated user's name.
     */
    public function updateName(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $user = $request->user();
        $user->update(['name' => $request->name]);

        return response()->json([
            'message' => 'Name updated successfully.',
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Request email change: update email to new email (unverified) and send verification code.
     */
    public function requestEmailUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'max:150', 'unique:users,email,'.$request->user()->id],
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        // Check current password
        if (! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The current password is incorrect.'],
            ]);
        }

        // Update email to new email (mark as unverified)
        $user->update([
            'email' => $request->email,
            'email_verified_at' => null,
        ]);

        // Generate and send verification code
        $code = $user->generateVerificationCode();
        $this->sendVerificationCode($user, $code);

        return response()->json([
            'message' => 'Verification code sent to new email address.',
            'email' => $user->email,
        ]);
    }

    /**
     * Verify email change code and mark email as verified.
     */
    public function verifyEmailChange(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();

        if (! $user->verification_code || $user->verification_code_expires_at < now()) {
            return response()->json([
                'message' => 'Code has expired. Please request a new one.',
                'expired' => true,
            ], 400);
        }

        if ($user->verification_code !== $request->code) {
            return response()->json([
                'message' => 'Incorrect code. Please check your email and try again.',
            ], 400);
        }

        // Clear verification code and mark email as verified
        $user->clearVerificationCode();

        return response()->json([
            'message' => 'Email updated successfully!',
            'user' => $this->formatUser($user),
        ]);
    }

    public function agentTokenStatus(Request $request): JsonResponse
    {
        $hasToken = $request->user()->tokens()->where('name', 'agent-token')->exists();

        return response()->json(['has_token' => $hasToken]);
    }

    public function generateAgentToken(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->tokens()->where('name', 'agent-token')->delete();
        $token = $user->createToken('agent-token');

        return response()->json([
            'token' => $token->plainTextToken,
            'message' => 'Agent token generated.',
        ]);
    }

    public function revokeAgentToken(Request $request): JsonResponse
    {
        $request->user()->tokens()->where('name', 'agent-token')->delete();

        return response()->json(['message' => 'Agent token revoked.']);
    }

    /**
     * Update the authenticated user's password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        // Check current password
        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }

    /**
     * Send verification code via mail.
     */
    private function sendVerificationCode(User $user, string $code): void
    {
        try {
            \Mail::to($user->email)->send(new VerificationCodeMail($user->name, $code));
            \Log::info("[VerifyCode] Sent to {$user->email}");
        } catch (\Exception $e) {
            \Log::error("[VerifyCode] Failed for {$user->email}: ".$e->getMessage());
        }
    }

    /**
     * Format user for JSON response.
     */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'verified' => $user->isVerified(),
            'created_at' => $user->created_at,
        ];
    }
}
