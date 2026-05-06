<?php

namespace App\Http\Controllers;

use App\Mail\VerifyEmailMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ── Register ──────────────────────────────────────────────────────────

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name'              => $validated['name'],
            'email'             => $validated['email'],
            'password'          => Hash::make($validated['password']),
            'role'              => 'viewer',
            'email_verified_at' => null,
        ]);

        $this->sendVerificationEmail($user);

        return response()->json([
            'message'        => 'Account created! Please check your email to verify your account.',
            // Dev helper — shows verify URL in response so you can test without real email
            'dev_verify_url' => app()->isLocal() ? $this->buildVerificationUrl($user) : null,
        ], 201);
    }

    // ── Email Verification ────────────────────────────────────────────────

    public function verifyEmail(Request $request): JsonResponse
    {
        $user = User::find($request->id);

        if (!$user) {
            return response()->json(['message' => 'Invalid verification link.'], 400);
        }

        if (!URL::hasValidSignature($request)) {
            return response()->json(['message' => 'Verification link has expired. Please request a new one.'], 400);
        }

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email already verified. You can log in.']);
        }

        $user->update(['email_verified_at' => now()]);

        return response()->json(['message' => 'Email verified! You can now log in.']);
    }

    public function resendVerification(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $request->email)->first();

        if (!$user || $user->email_verified_at) {
            return response()->json(['message' => 'If that email is registered and unverified, a link has been sent.']);
        }

        $this->sendVerificationEmail($user);

        return response()->json([
            'message'        => 'Verification email resent. Check your inbox.',
            'dev_verify_url' => app()->isLocal() ? $this->buildVerificationUrl($user) : null,
        ]);
    }

    // ── Login (simple — no 2FA) ───────────────────────────────────────────

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt(['email' => $validated['email'], 'password' => $validated['password']])) {
            throw ValidationException::withMessages([
                'email' => ['The email or password is incorrect.'],
            ]);
        }

        $user = Auth::user();

        // Must verify email first
        if (!$user->email_verified_at) {
            Auth::logout();
            return response()->json([
                'message'               => 'Please verify your email before logging in.',
                'requires_verification' => true,
                'email'                 => $user->email,
                'dev_verify_url'        => app()->isLocal() ? $this->buildVerificationUrl($user) : null,
            ], 403);
        }

        // Issue token directly — no 2FA
        $token = $user->createToken('netpulse-token')->plainTextToken;

        return response()->json([
            'user'  => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    // ── Other ─────────────────────────────────────────────────────────────

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->formatUser($request->user())]);
    }

    // ── Private ───────────────────────────────────────────────────────────

    private function sendVerificationEmail(User $user): void
    {
        try {
            $url = $this->buildVerificationUrl($user);
            Mail::to($user->email)->send(new VerifyEmailMail($user->name, $url));
        } catch (\Exception $e) {
            \Log::warning("[Verify] Email failed for {$user->email}: " . $e->getMessage());
        }
    }

    private function buildVerificationUrl(User $user): string
    {
        $apiUrl = URL::temporarySignedRoute(
            'auth.verify-email',
            now()->addMinutes(60),
            ['id' => $user->id]
        );

        // Point link to frontend, not API
        $frontendBase = env('FRONTEND_URL', 'http://localhost:5173');
        $apiBase      = config('app.url');

        return str_replace($apiBase . '/api', $frontendBase, $apiUrl);
    }

    private function formatUser(User $user): array
    {
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->role,
            'verified'   => (bool) $user->email_verified_at,
            'created_at' => $user->created_at,
        ];
    }
}