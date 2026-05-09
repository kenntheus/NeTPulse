<?php

namespace App\Http\Controllers;

use App\Mail\VerificationCodeMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
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

        $code      = $user->generateVerificationCode();
        $mailError = $this->sendVerificationCode($user, $code);

        return response()->json([
            'message'    => 'Account created! Enter the 6-digit code sent to your email.',
            'email'      => $user->email,
            'mail_error' => $mailError, // shows actual error in response
            'dev_code'   => app()->isLocal() ? $code : null, // always show in local
        ], 201);
    }

    public function verifyCode(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'code'  => ['required', 'string', 'size:6'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid request.'], 400);
        }

        if ($user->isVerified()) {
            return response()->json(['message' => 'Account already verified. Please log in.']);
        }

        if (!$user->verification_code || $user->verification_code_expires_at < now()) {
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

        $user->clearVerificationCode();

        return response()->json(['message' => 'Email verified! Your account is now active.']);
    }

    public function resendCode(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $request->email)->first();

        if (!$user || $user->isVerified()) {
            return response()->json(['message' => 'If that email is registered and unverified, a new code has been sent.']);
        }

        $code      = $user->generateVerificationCode();
        $mailError = $this->sendVerificationCode($user, $code);

        return response()->json([
            'message'    => 'A new code has been sent to your email.',
            'mail_error' => $mailError,
            'dev_code'   => app()->isLocal() ? $code : null,
        ]);
    }

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

        if (!$user->isVerified()) {
            Auth::logout();
            $code      = $user->generateVerificationCode();
            $mailError = $this->sendVerificationCode($user, $code);

            return response()->json([
                'message'               => 'Your email is not verified. We sent a new code.',
                'requires_verification' => true,
                'email'                 => $user->email,
                'mail_error'            => $mailError,
                'dev_code'              => app()->isLocal() ? $code : null,
            ], 403);
        }

        $token = $user->createToken('netpulse-token')->plainTextToken;

        return response()->json([
            'user'  => $this->formatUser($user),
            'token' => $token,
        ]);
    }

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

    /**
     * Returns null on success, error message string on failure.
     */
    private function sendVerificationCode(User $user, string $code): ?string
    {
        try {
            Mail::to($user->email)->send(new VerificationCodeMail($user->name, $code));
            \Log::info("[VerifyCode] Email sent to {$user->email}");
            return null; // success
        } catch (\Exception $e) {
            \Log::error("[VerifyCode] FAILED for {$user->email}: " . $e->getMessage());
            return $e->getMessage(); // return actual error
        }
    }

    private function formatUser(User $user): array
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