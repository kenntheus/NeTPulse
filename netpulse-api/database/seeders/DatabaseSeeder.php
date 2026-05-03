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

        // ── Real Public Internet Hosts only ───────────────────────────────
        // These are actually pinged every 30s — no simulation needed.
        // Add your own real home devices via the "Scan Network" button
        // or manually via the Devices page.
        $devices = [
            ['name' => 'Google DNS',       'ip_address' => '8.8.8.8',       'location' => 'Google — US'],
            ['name' => 'Cloudflare DNS',   'ip_address' => '1.1.1.1',       'location' => 'Cloudflare — Global'],
            ['name' => 'OpenDNS',          'ip_address' => '208.67.222.222', 'location' => 'Cisco — US'],
            ['name' => 'Google Secondary', 'ip_address' => '8.8.4.4',       'location' => 'Google — US'],
            ['name' => 'Quad9 DNS',        'ip_address' => '9.9.9.9',       'location' => 'Quad9 — Global'],
        ];

        $created = [];
        foreach ($devices as $d) {
            $device = Device::firstOrCreate(
                ['ip_address' => $d['ip_address']],
                [
                    'name'        => $d['name'],
                    'type'        => 'server',
                    'location'    => $d['location'],
                    'description' => 'Public DNS server — real ping',
                    'status'      => 'unknown',
                    'latency_ms'  => null,
                    'created_by'  => $admin->id,
                ]
            );
            $created[] = $device;
            $this->command->line("  ✓ {$device->name} ({$device->ip_address})");
        }

        $this->command->info('✅ ' . count($created) . ' public hosts ready.');
        $this->command->info('');
        $this->command->info('💡 To add your home devices:');
        $this->command->info('   → Log in as admin and click "Scan Network" on the Devices page.');
        $this->command->info('   → Or add them manually with their IP addresses.');
        $this->command->info('');
        $this->command->info('Admin:  admin@netpulse.dev  / password');
        $this->command->info('Viewer: viewer@netpulse.dev / password');
    }
}