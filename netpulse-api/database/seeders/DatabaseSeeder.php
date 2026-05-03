<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Users only — no sample devices ───────────────────────────────
        // Add your real devices via:
        //   • "Scan Network" button on the Devices page (auto-discovers via ARP)
        //   • "Add device" button to add manually

        User::firstOrCreate(
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
        $this->command->info('');
        $this->command->info('Admin:  admin@netpulse.dev  / password');
        $this->command->info('Viewer: viewer@netpulse.dev / password');
        $this->command->info('');
        $this->command->info('💡 Log in as admin and click "Scan Network" to discover devices.');
    }
}