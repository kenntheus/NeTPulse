<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'ip_address', 'type', 'location',
        'description', 'status', 'latency_ms',
        'last_checked_at', 'created_by',
    ];

    protected $casts = [
        'last_checked_at' => 'datetime',
    ];

    public function logs()
    {
        return $this->hasMany(MonitoringLog::class)->orderByDesc('checked_at');
    }

    public function alerts()
    {
        return $this->hasMany(Alert::class)->orderByDesc('created_at');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeOnline($query)
    {
        return $query->where('status', 'online');
    }

    public function scopeOffline($query)
    {
        return $query->where('status', 'offline');
    }
}
