<?php

use App\Services\MonitoringService;
use Illuminate\Support\Facades\Schedule;

/**
 * Ping all devices every 30 seconds.
 * withoutOverlapping() ensures the job won't run if a previous check is still in progress.
 */
Schedule::call(function () {
    app(MonitoringService::class)->checkAll();
})
->everyThirtySeconds()
->name('monitor-all-devices')
->withoutOverlapping();