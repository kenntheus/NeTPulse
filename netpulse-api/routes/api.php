<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\ArpScanController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\MonitoringLogController;
use Illuminate\Support\Facades\Route;

// ── Public auth routes ────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register',            [AuthController::class, 'register']);
    Route::post('/login',               [AuthController::class, 'login']);
    Route::post('/resend-verification', [AuthController::class, 'resendVerification']);

    // Signed URL — called when user clicks link in email
    Route::get('/verify-email', [AuthController::class, 'verifyEmail'])
        ->name('auth.verify-email');
});

// ── Protected routes ──────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
    });

    Route::prefix('dashboard')->group(function () {
        Route::get('/summary',       [DashboardController::class, 'summary']);
        Route::get('/latency-chart', [DashboardController::class, 'latencyChart']);
        Route::get('/uptime-chart',  [DashboardController::class, 'uptimeChart']);
    });

    Route::apiResource('devices', DeviceController::class);
    Route::post('/devices/{device}/ping', [DeviceController::class, 'ping']);

    Route::get('/devices/{device}/logs', [MonitoringLogController::class, 'index']);
    Route::get('/logs/export',           [MonitoringLogController::class, 'export']);

    Route::get('/alerts',                [AlertController::class, 'index']);
    Route::patch('/alerts/{alert}/read', [AlertController::class, 'markRead']);
    Route::post('/alerts/read-all',      [AlertController::class, 'markAllRead']);
    Route::delete('/alerts/{alert}',     [AlertController::class, 'destroy']);

    Route::post('/arp/scan', [ArpScanController::class, 'scan']);

    Route::prefix('ai')->group(function () {
        Route::get('/insights',     [AiController::class, 'insights']);
        Route::get('/anomalies',    [AiController::class, 'anomalies']);
        Route::get('/fingerprints', [AiController::class, 'fingerprints']);
        Route::post('/chat',        [AiController::class, 'chat']);
    });
});