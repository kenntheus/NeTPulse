<?php

namespace App\Events;

use App\Models\Device;
use App\Models\MonitoringLog;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeviceStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Device $device,
        public MonitoringLog $log,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('network-monitoring');
    }

    public function broadcastAs(): string
    {
        return 'DeviceStatusUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'device_id' => $this->device->id,
            'name' => $this->device->name,
            'ip_address' => $this->device->ip_address,
            'type' => $this->device->type,
            'location' => $this->device->location,
            'status' => $this->device->status,
            'latency_ms' => $this->log->latency_ms,
            'checked_at' => $this->log->checked_at?->toISOString(),
        ];
    }
}
