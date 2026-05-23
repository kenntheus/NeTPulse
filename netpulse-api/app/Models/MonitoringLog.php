<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonitoringLog extends Model
{
    public $timestamps = false; // we use checked_at manually

    protected $fillable = ['device_id', 'status', 'latency_ms', 'checked_at'];

    protected $casts = [
        'checked_at' => 'datetime',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
