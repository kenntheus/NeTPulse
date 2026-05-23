<?php

namespace App\Services;

use App\Models\Device;
use App\Models\Webhook;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookService
{
    public function dispatch(string $event, Device $device, array $extra = []): void
    {
        $webhooks = Webhook::where('active', true)->get();

        foreach ($webhooks as $webhook) {
            if (! in_array($event, $webhook->events ?? [])) {
                continue;
            }

            $payload = array_merge([
                'event' => $event,
                'device_id' => $device->id,
                'device_name' => $device->name,
                'ip_address' => $device->ip_address,
                'status' => $device->status,
                'timestamp' => now()->toIso8601String(),
            ], $extra);

            try {
                Http::timeout(5)->post($webhook->url, $payload);
            } catch (\Exception $e) {
                Log::warning("Webhook {$webhook->id} failed: ".$e->getMessage());
            }
        }
    }
}
