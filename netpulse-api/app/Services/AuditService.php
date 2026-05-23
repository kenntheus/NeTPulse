<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditService
{
    public static function log(
        string $action,
        ?Request $request = null,
        ?Model $entity = null,
        ?string $entityLabel = null,
        array $meta = []
    ): void {
        AuditLog::create([
            'user_id' => $request?->user()?->id,
            'action' => $action,
            'entity_type' => $entity ? class_basename($entity) : null,
            'entity_id' => $entity?->getKey(),
            'entity_label' => $entityLabel,
            'meta' => empty($meta) ? null : $meta,
            'ip_address' => $request?->ip(),
        ]);
    }
}
