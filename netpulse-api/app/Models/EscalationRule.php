<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EscalationRule extends Model
{
    protected $fillable = ['webhook_id', 'delay_minutes', 'enabled'];

    protected $casts = ['enabled' => 'boolean'];

    public function webhook(): BelongsTo
    {
        return $this->belongsTo(Webhook::class);
    }
}
