<?php

use App\Services\ArpScannerService;
use App\Services\MonitoringService;
use Illuminate\Support\Facades\Schedule;

/**
 * ARP Scan — detects devices joining/leaving the network every 30 seconds.
 */
Schedule::call(function () {
    app(ArpScannerService::class)->scan();
})
->everyThirtySeconds()
->name('arp-scan')
->withoutOverlapping();

/**
 * Ping monitoring — checks latency for all devices every 30 seconds.
 */
Schedule::call(function () {
    app(MonitoringService::class)->checkAll();
})
->everyThirtySeconds()
->name('monitor-devices')
->withoutOverlapping();