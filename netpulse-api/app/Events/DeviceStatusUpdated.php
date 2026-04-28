<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Device;
use App\Models\MonitoringLog;

class DeviceStatusUpdated implements ShouldBroadcast
{
    public function __construct(
        public Device $device,
        public MonitoringLog $log
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('network-monitoring');
    }

    public function broadcastWith(): array
    {
        return [
            'device_id'  => $this->device->id,
            'name'       => $this->device->name,
            'status'     => $this->device->status,
            'latency_ms' => $this->log->latency_ms,
            'checked_at' => $this->log->checked_at,
        ];
    }
}