<?php

namespace App\Http\Controllers;

use App\Mail\VerificationCodeMail;
use App\Models\User;
use App\Services\AuditService;
use App\Services\TotpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function setupStatus(): JsonResponse
    {
        return response()->json([
            'needs_setup' => ! User::where('role', 'admin')->exists(),
        ]);
    }

    public function setup(Request $request): JsonResponse
    {
        if (User::where('role', 'admin')->exists()) {
            return response()->json(['message' => 'Setup already complete.'], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        return response()->json(['message' => 'Admin account created. You can now log in.'], 201);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'viewer',
            'email_verified_at' => null,
        ]);

        $code = $user->generateVerificationCode();
        $this->sendVerificationCode($user, $code);

        return response()->json([
            'message' => 'Account created! Enter the 6-digit code sent to your email.',
            'email' => $user->email,
        ], 201);
    }

    public function verifyCode(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json(['message' => 'Invalid request.'], 400);
        }

        if ($user->isVerified()) {
            return response()->json(['message' => 'Account already verified. Please log in.']);
        }

        if (! $user->verification_code || $user->verification_code_expires_at < now()) {
            return response()->json([
                'message' => 'Code has expired. Please request a new one.',
                'expired' => true,
            ], 400);
        }

        if (! hash_equals((string) $user->verification_code, (string) $request->code)) {
            return response()->json([
                'message' => 'Incorrect code. Please check your email and try again.',
            ], 400);
        }

        $user->clearVerificationCode();

        return response()->json(['message' => 'Email verified! Your account is now active.']);
    }

    public function resendCode(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json(['message' => 'If that email is registered and unverified, a new code has been sent.']);
        }

        if ($user->isVerified()) {
            return response()->json(['message' => 'This account is already verified. Please log in.']);
        }

        $code = $user->generateVerificationCode();
        $this->sendVerificationCode($user, $code);

        return response()->json([
            'message' => 'A new 6-digit code has been sent to your email.',
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt(['email' => $validated['email'], 'password' => $validated['password']])) {
            Log::warning("[Auth] Failed login attempt for {$validated['email']} from {$request->ip()}");
            throw ValidationException::withMessages([
                'email' => ['The email or password is incorrect.'],
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        if (! $user->isVerified()) {
            Auth::logout();

            // Send a fresh code so they can verify immediately
            $code = $user->generateVerificationCode();
            $this->sendVerificationCode($user, $code);

            return response()->json([
                'message' => 'Your email is not verified. We sent a verification code to your email.',
                'requires_verification' => true,
                'email' => $user->email,
            ], 403);
        }

        // If 2FA is enabled, require a TOTP code
        if ($user->hasTwoFactor()) {
            $code = $request->input('two_factor_code');
            if (! $code) {
                return response()->json(['requires_two_factor' => true], 200);
            }
            if (! TotpService::verify($user->two_factor_secret, (string) $code)) {
                return response()->json(['message' => 'Invalid authenticator code.'], 422);
            }
        }

        $token = $user->createToken('netpulse-token')->plainTextToken;
        AuditService::log('auth.login', $request, $user, $user->name);

        return response()->json([
            'user' => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        AuditService::log('auth.logout', $request, $request->user(), $request->user()->name);
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->formatUser($request->user())]);
    }

    private function sendVerificationCode(User $user, string $code): void
    {
        try {
            Mail::to($user->email)->send(new VerificationCodeMail($user->name, $code));
            Log::info("[VerifyCode] Sent to {$user->email}");
        } catch (\Exception $e) {
            Log::error("[VerifyCode] Failed for {$user->email}: ".$e->getMessage());
        }
    }

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
