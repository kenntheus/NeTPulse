<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monitoring_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['online', 'offline']);
            $table->integer('latency_ms')->unsigned()->nullable(); // null when offline
            $table->timestamp('checked_at')->useCurrent();

            // Composite index for fast per-device time-range queries
            $table->index(['device_id', 'checked_at']);
            $table->index('checked_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monitoring_logs');
    }
};