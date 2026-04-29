<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alert extends Model
{
    public $timestamps = false;

    protected $fillable = ['device_id', 'type', 'message', 'is_read', 'resolved_at', 'created_at'];

    protected $casts = [
        'is_read'     => 'boolean',
        'resolved_at' => 'datetime',
        'created_at'  => 'datetime',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }
}