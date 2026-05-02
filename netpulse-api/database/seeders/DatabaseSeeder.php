<?php

namespace Database\Seeders;

use App\Models\Alert;
use App\Models\Device;
use App\Models\MonitoringLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Users ─────────────────────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'admin@netpulse.dev'],
            [
                'name'     => 'Admin User',
                'password' => Hash::make('password'),
                'role'     => 'admin',
            ]
        );

        User::firstOrCreate(
            ['email' => 'viewer@netpulse.dev'],
            [
                'name'     => 'John Viewer',
                'password' => Hash::make('password'),
                'role'     => 'viewer',
            ]
        );

        $this->command->info('✅ Users created.');

        // ── Devices ───────────────────────────────────────────────────────
        $devices = [
            // Simulated home LAN devices (private IPs)
            ['name' => 'Home Router',        'ip_address' => '192.168.1.1',   'type' => 'router',   'location' => 'Living Room'],
            ['name' => 'Living Room Switch',  'ip_address' => '192.168.1.2',   'type' => 'switch',   'location' => 'Living Room'],
            ['name' => 'Desktop PC',          'ip_address' => '192.168.1.10',  'type' => 'server',   'location' => 'Study Room'],
            ['name' => 'NAS Storage',         'ip_address' => '192.168.1.15',  'type' => 'server',   'location' => 'Study Room'],
            ['name' => 'Wi-Fi AP Floor 1',    'ip_address' => '192.168.1.20',  'type' => 'ap',       'location' => 'Ground Floor'],
            ['name' => 'Wi-Fi AP Floor 2',    'ip_address' => '192.168.1.21',  'type' => 'ap',       'location' => 'Second Floor'],
            ['name' => 'Smart TV',            'ip_address' => '192.168.1.50',  'type' => 'other',    'location' => 'Living Room'],
            ['name' => 'Security Camera',     'ip_address' => '192.168.1.60',  'type' => 'other',    'location' => 'Front Door'],
            ['name' => 'Network Firewall',    'ip_address' => '192.168.1.254', 'type' => 'firewall', 'location' => 'Server Rack'],
            // Real public internet hosts
            ['name' => 'Google DNS',          'ip_address' => '8.8.8.8',         'type' => 'server', 'location' => 'Google — US'],
            ['name' => 'Cloudflare DNS',      'ip_address' => '1.1.1.1',         'type' => 'server', 'location' => 'Cloudflare — Global'],
            ['name' => 'OpenDNS',             'ip_address' => '208.67.222.222',   'type' => 'server', 'location' => 'Cisco — US'],
            ['name' => 'Google Secondary',    'ip_address' => '8.8.4.4',         'type' => 'server', 'location' => 'Google — US'],
            ['name' => 'Quad9 DNS',           'ip_address' => '9.9.9.9',         'type' => 'server', 'location' => 'Quad9 — Global'],
        ];

        $createdDevices = [];
        foreach ($devices as $d) {
            $device = Device::firstOrCreate(
                ['ip_address' => $d['ip_address']],
                [
                    'name'            => $d['name'],
                    'type'            => $d['type'],
                    'location'        => $d['location'],
                    'description'     => $d['name'] . ' — managed by NetPulse',
                    'status'          => 'unknown',
                    'latency_ms'      => null,
                    'last_checked_at' => null,
                    'created_by'      => $admin->id,
                ]
            );
            $createdDevices[] = $device;
            $this->command->line("  Device: {$device->name} ({$device->ip_address})");
        }

        $this->command->info('✅ ' . count($createdDevices) . ' devices created.');

        // ── Monitoring history — 3 days only to keep it fast ─────────────
        $this->command->info('Seeding monitoring history (3 days)...');

        foreach ($createdDevices as $device) {
            $this->seedHistory($device);
        }

        $this->command->info('✅ Monitoring history seeded.');
        $this->command->line('');
        $this->command->info('Admin:  admin@netpulse.dev  / password');
        $this->command->info('Viewer: viewer@netpulse.dev / password');
    }

    private function seedHistory(Device $device): void
    {
        $uptimeMap = [
            'router' => 99, 'switch' => 99, 'firewall' => 99,
            'server' => 97, 'ap' => 95, 'other' => 85,
        ];
        $latencyMap = [
            'router' => [1, 15], 'switch' => [1, 12], 'firewall' => [1, 10],
            'server' => [2, 35], 'ap' => [2, 25],     'other' => [5, 60],
        ];

        $uptime  = $uptimeMap[$device->type]  ?? 90;
        $range   = $latencyMap[$device->type] ?? [5, 50];

        // Public IPs get internet-style latency
        $isPublic = filter_var(
            $device->ip_address,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) !== false;

        if ($isPublic) {
            $range  = [8, 60];
            $uptime = 99;
        }

        $now     = Carbon::now();
        $start   = $now->copy()->subDays(3); // 3 days = ~864 logs per device
        $current = $start->copy();
        $prev    = 'online';
        $logs    = [];
        $alerts  = [];

        while ($current->lessThan($now)) {
            $isOnline  = rand(1, 100) <= $uptime;
            $isSpiking = rand(1, 100) <= 5;
            $status    = $isOnline ? 'online' : 'offline';
            $latencyMs = null;

            if ($isOnline) {
                $latencyMs = $isSpiking ? rand(120, 280) : rand($range[0], $range[1]);
            }

            $logs[] = [
                'device_id'  => $device->id,
                'status'     => $status,
                'latency_ms' => $latencyMs,
                'checked_at' => $current->toDateTimeString(),
            ];

            // Status change alert
            if ($status !== $prev && $current->greaterThan($start->copy()->addHours(1))) {
                $emoji    = $status === 'offline' ? '🔴' : '🟢';
                $alerts[] = [
                    'device_id'  => $device->id,
                    'type'       => $status === 'offline' ? 'offline' : 'recovered',
                    'message'    => "{$emoji} [{$device->name}] " . ($status === 'offline' ? 'went OFFLINE.' : 'recovered.'),
                    'is_read'    => (bool) ($current->lessThan($now->copy()->subHours(3))),
                    'created_at' => $current->toDateTimeString(),
                ];
            }

            $prev = $status;
            $current->addMinutes(5);
        }

        // Insert in small chunks to avoid memory issues
        foreach (array_chunk($logs, 200) as $chunk) {
            DB::table('monitoring_logs')->insert($chunk);
        }
        foreach (array_chunk($alerts, 50) as $chunk) {
            DB::table('alerts')->insert($chunk);
        }

        // Set final status on device
        $last = end($logs);
        $device->update([
            'status'          => $last['status'],
            'latency_ms'      => $last['latency_ms'],
            'last_checked_at' => now(),
        ]);
    }
}