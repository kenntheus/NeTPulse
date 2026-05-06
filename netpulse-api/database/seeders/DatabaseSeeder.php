<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Creates ONE admin account — pre-verified so you can log in immediately.
        // Change this email/password before going to production!
        $admin = User::firstOrCreate(
            ['email' => 'admin@netpulse.dev'],
            [
                'name'              => 'Admin User',
                'password'          => Hash::make('Admin@12345!'),
                'role'              => 'admin',
                'email_verified_at' => now(), // pre-verified
            ]
        );

        $this->command->info('✅ Admin account ready.');
        $this->command->info('');
        $this->command->info('  Email:    admin@netpulse.dev');
        $this->command->info('  Password: Admin@12345!');
        $this->command->info('');
        $this->command->warn('  ⚠ Change this password after first login!');
        $this->command->info('');
        $this->command->info('  All other users must register and verify their email.');
    }
}