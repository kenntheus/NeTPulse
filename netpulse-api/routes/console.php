<?php

use App\Services\AI\AlertGroupingService;
use App\Services\AI\AnomalyDetectionService;
use App\Services\ArpScannerService;
use App\Services\MonitoringService;
use Illuminate\Support\Facades\Schedule;

// ARP Scan every 30s — discovers new devices, marks offline
Schedule::call(function () {
    app(ArpScannerService::class)->scan();
})->everyThirtySeconds()->name('arp-scan')->withoutOverlapping();

// Ping monitoring every 30s — latency + status for all devices
Schedule::call(function () {
    app(MonitoringService::class)->checkAll();
})->everyThirtySeconds()->name('monitor-devices')->withoutOverlapping();

// Anomaly detection every minute — Z-score latency analysis
Schedule::call(function () {
    app(AnomalyDetectionService::class)->analyseAll();
})->everyMinute()->name('anomaly-detection')->withoutOverlapping();

// Alert grouping every minute — cascade/storm detection
Schedule::call(function () {
    app(AlertGroupingService::class)->detectCascade();
})->everyMinute()->name('alert-grouping')->withoutOverlapping();
