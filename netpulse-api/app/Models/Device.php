<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Device extends Model
{
    use HasFactory;

    protected $appends = ['is_under_maintenance'];

    protected $fillable = [
        'name', 'ip_address', 'type', 'location',
        'description', 'notes', 'tags', 'status', 'latency_ms',
        'latency_threshold_ms', 'last_checked_at', 'muted_until', 'created_by',
    ];

    protected $casts = [
        'last_checked_at' => 'datetime',
        'muted_until' => 'datetime',
        'tags' => 'array',
    ];

    public function isMuted(): bool
    {
        return $this->muted_until !== null && $this->muted_until->isFuture();
    }

    public function getIsUnderMaintenanceAttribute(): bool
    {
        return $this->maintenanceWindows()
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->exists();
    }

    public function isUnderMaintenance(): bool
    {
        return $this->getIsUnderMaintenanceAttribute();
    }

    public function maintenanceWindows(): HasMany
    {
        return $this->hasMany(MaintenanceWindow::class)->orderBy('starts_at');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(MonitoringLog::class)->orderByDesc('checked_at');
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class)->orderByDesc('created_at');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeOnline(Builder $query): Builder
    {
        return $query->where('status', 'online');
    }

    public function scopeOffline(Builder $query): Builder
    {
        return $query->where('status', 'offline');
    }
}
