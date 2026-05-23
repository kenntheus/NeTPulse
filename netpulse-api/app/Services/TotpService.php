<?php

namespace App\Services;

/**
 * RFC 6238 TOTP implementation — no external dependencies.
 */
class TotpService
{
    private const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /** Generate a random 16-character base32 secret. */
    public static function generateSecret(): string
    {
        $secret = '';
        for ($i = 0; $i < 16; $i++) {
            $secret .= self::BASE32_CHARS[random_int(0, 31)];
        }

        return $secret;
    }

    /** Build an otpauth URI suitable for QR encoding. */
    public static function otpauthUri(string $secret, string $email, string $issuer = 'NeTPulse'): string
    {
        return sprintf(
            'otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30',
            rawurlencode($issuer),
            rawurlencode($email),
            $secret,
            rawurlencode($issuer)
        );
    }

    /** Build a Google-Charts QR code image URL. */
    public static function qrUrl(string $otpauthUri): string
    {
        return 'https://chart.googleapis.com/chart?cht=qr&chs=220x220&chld=M|0&chl='.rawurlencode($otpauthUri);
    }

    /**
     * Verify a 6-digit TOTP code against a base32 secret.
     * Allows ±1 window (30 s) for clock drift.
     */
    public static function verify(string $secret, string $code): bool
    {
        $code = preg_replace('/\s/', '', $code);
        if (! preg_match('/^\d{6}$/', $code)) {
            return false;
        }

        $key = self::base32Decode($secret);
        $time = (int) floor(time() / 30);

        foreach ([-1, 0, 1] as $offset) {
            if (self::hotp($key, $time + $offset) === $code) {
                return true;
            }
        }

        return false;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static function hotp(string $key, int $counter): string
    {
        $msg = pack('J', $counter);               // 8-byte big-endian
        $hash = hash_hmac('sha1', $msg, $key, true);
        $off = ord($hash[19]) & 0x0F;
        $code = (
            ((ord($hash[$off]) & 0x7F) << 24) |
            ((ord($hash[$off + 1]) & 0xFF) << 16) |
            ((ord($hash[$off + 2]) & 0xFF) << 8) |
             (ord($hash[$off + 3]) & 0xFF)
        ) % 1_000_000;

        return str_pad((string) $code, 6, '0', STR_PAD_LEFT);
    }

    private static function base32Decode(string $input): string
    {
        $input = strtoupper($input);
        $lookup = array_flip(str_split(self::BASE32_CHARS));
        $bits = '';

        foreach (str_split($input) as $char) {
            if ($char === '=') {
                break;
            }
            if (! isset($lookup[$char])) {
                continue;
            }
            $bits .= str_pad(decbin($lookup[$char]), 5, '0', STR_PAD_LEFT);
        }

        $bytes = '';
        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) === 8) {
                $bytes .= chr(bindec($byte));
            }
        }

        return $bytes;
    }
}
