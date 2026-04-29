<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Device;
use App\Models\MonitoringLog;
use App\Models\Alert;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Admin user ───────────────────────────────────────────────────
        $admin = User::create([
            'name'     => 'Admin User',
            'email'    => 'admin@netpulse.dev',
            'password' => Hash::make('password'),
            'role'     => 'admin',
        ]);

        // ─── Viewer user ──────────────────────────────────────────────────
        User::create([
            'name'     => 'John Viewer',
            'email'    => 'viewer@netpulse.dev',
            'password' => Hash::make('password'),
            'role'     => 'viewer',
        ]);

        // ─── Sample devices ───────────────────────────────────────────────
        $devices = [
            ['name' => 'Core Router 01',     'ip_address' => '192.168.1.1',   'type' => 'router',   'location' => 'Server Room A', 'status' => 'online'],
            ['name' => 'Core Router 02',     'ip_address' => '192.168.1.2',   'type' => 'router',   'location' => 'Server Room A', 'status' => 'online'],
            ['name' => 'Distribution SW-01', 'ip_address' => '192.168.1.10',  'type' => 'switch',   'location' => 'Server Room A', 'status' => 'online'],
            ['name' => 'Distribution SW-02', 'ip_address' => '192.168.1.11',  'type' => 'switch',   'location' => 'Server Room B', 'status' => 'offline'],
            ['name' => 'Web Server 01',       'ip_address' => '192.168.2.10',  'type' => 'server',   'location' => 'DC Rack 1',     'status' => 'online'],
            ['name' => 'Web Server 02',       'ip_address' => '192.168.2.11',  'type' => 'server',   'location' => 'DC Rack 1',     'status' => 'online'],
            ['name' => 'DB Server Primary',   'ip_address' => '192.168.2.20',  'type' => 'server',   'location' => 'DC Rack 2',     'status' => 'online'],
            ['name' => 'DB Server Replica',   'ip_address' => '192.168.2.21',  'type' => 'server',   'location' => 'DC Rack 2',     'status' => 'online'],
            ['name' => 'Firewall Primary',    'ip_address' => '10.0.0.1',      'type' => 'firewall', 'location' => 'DMZ',           'status' => 'online'],
            ['name' => 'Access Point Floor1', 'ip_address' => '192.168.3.10',  'type' => 'ap',       'location' => 'Floor 1',       'status' => 'online'],
            ['name' => 'Access Point Floor2', 'ip_address' => '192.168.3.11',  'type' => 'ap',       'location' => 'Floor 2',       'status' => 'offline'],
            ['name' => 'NAS Storage',         'ip_address' => '192.168.2.50',  'type' => 'server',   'location' => 'DC Rack 3',     'status' => 'online'],
        ];

        foreach ($devices as $deviceData) {
            $device = Device::create(array_merge($deviceData, [
                'created_by'      => $admin->id,
                'last_checked_at' => now()->subSeconds(rand(10, 60)),
                'latency_ms'      => $deviceData['status'] === 'online' ? rand(1, 45) : null,
                'description'     => "Managed network device at {$deviceData['location']}",
            ]));

            // ─── Generate 7 days of monitoring history ─────────────────
            $this->seedLogs($device);
        }

        // ─── Seed sample alerts ───────────────────────────────────────────
        $offlineDevices = Device::where('status', 'offline')->get();
        foreach ($offlineDevices as $device) {
            Alert::create([
                'device_id'  => $device->id,
                'type'       => 'offline',
                'message'    => "Device {$device->name} ({$device->ip_address}) went OFFLINE.",
                'is_read'    => false,
                'created_at' => now()->subMinutes(rand(5, 60)),
            ]);
        }
    }

    private function seedLogs(Device $device): void
    {
        $now        = Carbon::now();
        $start      = $now->copy()->subDays(7);
        $current    = $start->copy();
        $prevStatus = 'online';

        // One check every 30 seconds for 7 days = ~20160 logs
        // We seed every 5 minutes to keep it manageable (~2016 logs)
        while ($current->lessThan($now)) {
            // Devices that are offline now were mostly online in the past
            $isOnline = $device->status === 'online'
                ? (rand(1, 100) <= 97)   // 97% uptime
                : (rand(1, 100) <= 80);  // 80% uptime (flapping device)

            $status = $isOnline ? 'online' : 'offline';

            // Create alert on status change
            if ($status !== $prevStatus && $current->greaterThan($start->copy()->addHours(1))) {
                Alert::create([
                    'device_id'  => $device->id,
                    'type'       => $status === 'offline' ? 'offline' : 'recovered',
                    'message'    => $status === 'offline'
                        ? "Device {$device->name} went OFFLINE."
                        : "Device {$device->name} recovered.",
                    'is_read'    => true,
                    'created_at' => $current->copy(),
                ]);
            }

            MonitoringLog::create([
                'device_id'  => $device->id,
                'status'     => $status,
                'latency_ms' => $isOnline ? rand(1, 80) : null,
                'checked_at' => $current->copy(),
            ]);

            $prevStatus = $status;
            $current->addMinutes(5);
        }
    }
}