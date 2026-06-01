<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AiController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\ArpScanController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\MaintenanceWindowController;
use App\Http\Controllers\MonitoringLogController;
use App\Http\Controllers\TwoFactorController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;

// ── Public auth routes ────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::get('/setup-status', [AuthController::class, 'setupStatus']);
    Route::post('/setup', [AuthController::class, 'setup'])->middleware('throttle:5,1');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/verify-code', [AuthController::class, 'verifyCode'])->middleware('throttle:10,1');
    Route::post('/resend-code', [AuthController::class, 'resendCode'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
});

// ── Protected routes ──────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('account')->group(function () {
        Route::patch('/name', [AccountController::class, 'updateName']);
        Route::patch('/email', [AccountController::class, 'requestEmailUpdate']);
        Route::post('/verify-email-change', [AccountController::class, 'verifyEmailChange']);
        Route::patch('/password', [AccountController::class, 'updatePassword']);
        Route::get('/agent-token', [AccountController::class, 'agentTokenStatus']);
        Route::post('/agent-token', [AccountController::class, 'generateAgentToken']);
        Route::delete('/agent-token', [AccountController::class, 'revokeAgentToken']);
        Route::get('/2fa', [TwoFactorController::class, 'status']);
        Route::post('/2fa/setup', [TwoFactorController::class, 'setup']);
        Route::post('/2fa/confirm', [TwoFactorController::class, 'confirm']);
        Route::delete('/2fa', [TwoFactorController::class, 'disable']);
    });

    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    Route::prefix('dashboard')->middleware('throttle:60,1')->group(function () {
        Route::get('/summary', [DashboardController::class, 'summary']);
        Route::get('/latency-chart', [DashboardController::class, 'latencyChart']);
        Route::get('/uptime-chart', [DashboardController::class, 'uptimeChart']);
    });

    Route::post('/devices/bulk-destroy', [DeviceController::class, 'bulkDestroy']);
    Route::post('/devices/import', [DeviceController::class, 'import']);
    Route::get('/devices/export', [DeviceController::class, 'export']);
    Route::apiResource('devices', DeviceController::class);
    Route::post('/devices/{device}/ping', [DeviceController::class, 'ping']);
    Route::get('/devices/{device}/uptime', [DeviceController::class, 'uptime']);
    Route::post('/devices/{device}/mute', [DeviceController::class, 'mute']);
    Route::post('/devices/{device}/unmute', [DeviceController::class, 'unmute']);
    Route::get('/devices/{device}/maintenance-windows', [MaintenanceWindowController::class, 'index']);
    Route::post('/devices/{device}/maintenance-windows', [MaintenanceWindowController::class, 'store']);
    Route::delete('/maintenance-windows/{maintenanceWindow}', [MaintenanceWindowController::class, 'destroy']);

    Route::get('/devices/{device}/logs', [MonitoringLogController::class, 'index']);
    Route::get('/logs/export', [MonitoringLogController::class, 'export']);

    Route::get('/alerts', [AlertController::class, 'index']);
    Route::patch('/alerts/{alert}/read', [AlertController::class, 'markRead']);
    Route::post('/alerts/read-all', [AlertController::class, 'markAllRead']);
    Route::patch('/alerts/{alert}/acknowledge', [AlertController::class, 'acknowledge']);
    Route::patch('/alerts/{alert}/unacknowledge', [AlertController::class, 'unacknowledge']);
    Route::delete('/alerts/{alert}', [AlertController::class, 'destroy'])->middleware('role:admin');

    Route::apiResource('webhooks', WebhookController::class)->except(['show']);
    Route::post('/webhooks/{webhook}/test', [WebhookController::class, 'test']);

    Route::get('/audit-logs', [AuditLogController::class, 'index']);

    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::patch('/users/{user}/role', [UserController::class, 'updateRole']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });

    Route::post('/arp/scan', [ArpScanController::class, 'scan']);
    Route::post('/agent/push', [ArpScanController::class, 'receivePush']);

    Route::prefix('ai')->group(function () {
        Route::middleware('throttle:10,1')->group(function () {
            Route::get('/insights', [AiController::class, 'insights']);
            Route::get('/anomalies', [AiController::class, 'anomalies']);
            Route::get('/fingerprints', [AiController::class, 'fingerprints']);
        });
        Route::post('/chat', [AiController::class, 'chat'])->middleware('throttle:20,1');
    });
});
