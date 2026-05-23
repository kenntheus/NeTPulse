<?php

namespace App\Http\Controllers;

use App\Services\TotpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TwoFactorController extends Controller
{
    /** GET /account/2fa — return current 2FA status */
    public function status(Request $request): JsonResponse
    {
        return response()->json([
            'enabled' => $request->user()->two_factor_confirmed_at !== null,
        ]);
    }

    /** POST /account/2fa/setup — generate secret + QR URL (unconfirmed) */
    public function setup(Request $request): JsonResponse
    {
        $user = $request->user();
        $secret = TotpService::generateSecret();
        $uri = TotpService::otpauthUri($secret, $user->email);

        $user->update(['two_factor_secret' => $secret, 'two_factor_confirmed_at' => null]);

        return response()->json([
            'secret' => $secret,
            'qr_url' => TotpService::qrUrl($uri),
        ]);
    }

    /** POST /account/2fa/confirm — verify TOTP code and activate */
    public function confirm(Request $request): JsonResponse
    {
        $request->validate(['code' => ['required', 'string']]);

        $user = $request->user();

        if (! $user->two_factor_secret) {
            return response()->json(['message' => 'Call /setup first.'], 422);
        }

        if (! TotpService::verify($user->two_factor_secret, $request->code)) {
            return response()->json(['message' => 'Invalid code. Check your authenticator app.'], 422);
        }

        $user->update(['two_factor_confirmed_at' => now()]);

        return response()->json(['message' => 'Two-factor authentication enabled.']);
    }

    /** DELETE /account/2fa — disable 2FA (requires current TOTP code) */
    public function disable(Request $request): JsonResponse
    {
        $request->validate(['code' => ['required', 'string']]);

        $user = $request->user();

        if (! $user->two_factor_confirmed_at) {
            return response()->json(['message' => '2FA is not enabled.'], 422);
        }

        if (! TotpService::verify($user->two_factor_secret, $request->code)) {
            return response()->json(['message' => 'Invalid code.'], 422);
        }

        $user->update(['two_factor_secret' => null, 'two_factor_confirmed_at' => null]);

        return response()->json(['message' => 'Two-factor authentication disabled.']);
    }
}
