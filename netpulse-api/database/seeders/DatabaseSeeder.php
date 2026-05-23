<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (User::where('role', 'admin')->exists()) {
            $this->command->info('✅ Admin already exists — skipping seed.');

            return;
        }

        $this->command->info('ℹ No admin found. Use the /setup page to create your admin account.');
    }
}
