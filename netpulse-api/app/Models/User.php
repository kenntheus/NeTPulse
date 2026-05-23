<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'role',
        'email_verified_at',
        'two_factor_code',
        'two_factor_expires_at',
        'verification_code',
        'verification_code_expires_at',
    ];

    protected $hidden = [
        'password', 'remember_token',
        'two_factor_code', 'verification_code',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'two_factor_expires_at' => 'datetime',
        'verification_code_expires_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isVerified(): bool
    {
        return $this->email_verified_at !== null;
    }

    /** Generate a 6-digit email verification code valid for 15 minutes */
    public function generateVerificationCode(): string
    {
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->update([
            'verification_code' => $code,
            'verification_code_expires_at' => now()->addMinutes(15),
        ]);

        return $code;
    }

    /** Clear verification code after successful verification */
    public function clearVerificationCode(): void
    {
        $this->update([
            'verification_code' => null,
            'verification_code_expires_at' => null,
            'email_verified_at' => now(),
        ]);
    }

    public function devices()
    {
        return $this->hasMany(Device::class, 'created_by');
    }
}
