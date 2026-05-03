<?php

use App\Http\Controllers\AlertController;
use App\Http\Controllers\ArpScanController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\MonitoringLogController;
use Illuminate\Support\Facades\Route;

// ── Public ────────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// ── Protected ─────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
    });

    // Dashboard
    Route::prefix('dashboard')->group(function () {
        Route::get('/summary',       [DashboardController::class, 'summary']);
        Route::get('/latency-chart', [DashboardController::class, 'latencyChart']);
        Route::get('/uptime-chart',  [DashboardController::class, 'uptimeChart']);
    });

    // Devices
    Route::apiResource('devices', DeviceController::class);
    Route::post('/devices/{device}/ping', [DeviceController::class, 'ping']);

    // Logs
    Route::get('/devices/{device}/logs', [MonitoringLogController::class, 'index']);
    Route::get('/logs/export',           [MonitoringLogController::class, 'export']);

    // Alerts
    Route::get('/alerts',                [AlertController::class, 'index']);
    Route::patch('/alerts/{alert}/read', [AlertController::class, 'markRead']);
    Route::post('/alerts/read-all',      [AlertController::class, 'markAllRead']);
    Route::delete('/alerts/{alert}',     [AlertController::class, 'destroy']);

    // ARP Scanner — admin only
    Route::post('/arp/scan', [ArpScanController::class, 'scan']);
});