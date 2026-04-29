<?php
 
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
 
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('ip_address', 45);
            $table->enum('type', ['router', 'switch', 'server', 'firewall', 'ap', 'other'])->default('other');
            $table->string('location', 150)->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['online', 'offline', 'unknown'])->default('unknown');
            $table->integer('latency_ms')->unsigned()->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
 
            $table->index('status');
            $table->index('ip_address');
        });
    }
 
    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};