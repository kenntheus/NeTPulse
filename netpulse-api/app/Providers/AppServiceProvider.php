<?php

namespace App\Providers;

use App\Services\AI\AlertGroupingService;
use App\Services\AI\AnomalyDetectionService;
use App\Services\ArpScannerService;
use App\Services\MonitoringService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // After every HTTP response, run any monitoring tasks that are due.
        // This means `php artisan serve` is all you need — no separate scheduler process.
        $this->app->terminating(function () {
            if ($this->app->runningInConsole()) {
                return;
            }

            $now = time();

            // ARP scan every 30 s — discover devices, mark offline
            if ($now - (int) Cache::get('hb.arp', 0) >= 30) {
                Cache::put('hb.arp', $now, 300);
                try {
                    app(ArpScannerService::class)->scan();
                } catch (\Throwable) {
                }
            }

            // Ping monitoring every 30 s — latency + status
            if ($now - (int) Cache::get('hb.monitor', 0) >= 30) {
                Cache::put('hb.monitor', $now, 300);
                try {
                    app(MonitoringService::class)->checkAll();
                } catch (\Throwable) {
                }
            }

            // Anomaly detection every 60 s
            if ($now - (int) Cache::get('hb.anomaly', 0) >= 60) {
                Cache::put('hb.anomaly', $now, 300);
                try {
                    app(AnomalyDetectionService::class)->analyseAll();
                } catch (\Throwable) {
                }
            }

            // Alert grouping / cascade detection every 60 s
            if ($now - (int) Cache::get('hb.alerts', 0) >= 60) {
                Cache::put('hb.alerts', $now, 300);
                try {
                    app(AlertGroupingService::class)->detectCascade();
                } catch (\Throwable) {
                }
            }
        });
    }
}
