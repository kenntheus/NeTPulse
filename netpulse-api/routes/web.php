<?php

use Illuminate\Support\Facades\Route;

// Health check endpoint (used by Railway / Render deployment platforms)
Route::get('/', function () {
    return response()->json([
        'app'     => config('app.name'),
        'status'  => 'running',
        'version' => '1.0.0',
    ]);
});