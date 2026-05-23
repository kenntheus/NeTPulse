<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alert extends Model
{
    public $timestamps = false;

    protected $fillable = ['device_id', 'type', 'message', 'is_read', 'resolved_at', 'acknowledged_at', 'acknowledged_by', 'created_at'];

    protected $casts = [
        'is_read' => 'boolean',
        'resolved_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    public function scopeUnread(Builder $query): Builder
    {
        return $query->where('is_read', false);
    }
}
