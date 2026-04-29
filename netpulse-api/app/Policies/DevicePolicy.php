<?php

namespace App\Policies;

use App\Models\Device;
use App\Models\User;

class DevicePolicy
{
    /**
     * Admins can do everything. Viewers can only read.
     */

    public function viewAny(User $user): bool  { return true; }
    public function view(User $user, Device $device): bool { return true; }

    public function create(User $user): bool  { return $user->isAdmin(); }
    public function update(User $user, Device $device): bool { return $user->isAdmin(); }
    public function delete(User $user, Device $device): bool { return $user->isAdmin(); }
}