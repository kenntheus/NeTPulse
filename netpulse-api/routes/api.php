<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\MonitoringLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AlertController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Devices (admin: full CRUD | viewer: read-only via policy)
    Route::apiResource('devices', DeviceController::class);
    Route::post('/devices/{device}/ping', [DeviceController::class, 'ping']);

    // Monitoring logs
    Route::get('/devices/{device}/logs',  [MonitoringLogController::class, 'index']);
    Route::get('/logs/export',            [MonitoringLogController::class, 'export']); // CSV

    // Dashboard stats
    Route::get('/dashboard/summary',      [DashboardController::class, 'summary']);
    Route::get('/dashboard/latency-chart',[DashboardController::class, 'latencyChart']);
    Route::get('/dashboard/uptime-chart', [DashboardController::class, 'uptimeChart']);

    // Alerts
    Route::get('/alerts',                 [AlertController::class, 'index']);
    Route::patch('/alerts/{alert}/read',  [AlertController::class, 'markRead']);
    Route::delete('/alerts/{alert}',      [AlertController::class, 'destroy']);
});