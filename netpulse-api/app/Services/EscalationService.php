<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\EscalationRule;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EscalationService
{
    public function run(): void
    {
        $rules = EscalationRule::where('enabled', true)->with('webhook')->get();

        if ($rules->isEmpty()) {
            return;
        }

        foreach ($rules as $rule) {
            if (! $rule->webhook || ! $rule->webhook->active) {
                continue;
            }

            // Find unacknowledged offline alerts older than the delay threshold
            $cutoff = now()->subMinutes($rule->delay_minutes);

            $alerts = Alert::where('type', 'offline')
                ->whereNull('acknowledged_at')
                ->where('created_at', '<=', $cutoff)
                ->with('device:id,name,ip_address,status')
                ->get();

            foreach ($alerts as $alert) {
                if (! $alert->device) {
                    continue;
                }

                // Only escalate if device is still offline
                if ($alert->device->status !== 'offline') {
                    continue;
                }

                $payload = [
                    'event'       => 'escalation',
                    'device_id'   => $alert->device->id,
                    'device_name' => $alert->device->name,
                    'ip_address'  => $alert->device->ip_address,
                    'status'      => 'offline',
                    'alert_id'    => $alert->id,
                    'offline_for' => now()->diffInMinutes($alert->created_at).' minutes',
                    'timestamp'   => now()->toIso8601String(),
                ];

                try {
                    Http::timeout(5)->post($rule->webhook->url, $payload);
                    Log::info("[Escalation] Fired rule {$rule->id} for alert {$alert->id}");
                } catch (\Exception $e) {
                    Log::warning("[Escalation] Webhook {$rule->webhook_id} failed: ".$e->getMessage());
                }
            }
        }
    }
}
