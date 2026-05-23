<?php

namespace App\Services\AI;

use App\Models\Alert;
use App\Models\Device;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NetworkAssistantService
{
    public function __construct(
        private AnomalyDetectionService $anomaly,
        private DeviceFingerprintService $fingerprint,
    ) {}

    public function chat(string $userMessage, array $history = []): string
    {
        $apiKey = config('services.groq.key');

        if (! $apiKey) {
            return '⚠️ Groq API key not configured. Add GROQ_API_KEY to your .env file. Get a free key at console.groq.com.';
        }

        $messages = $this->buildMessages($history, $userMessage);

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
            ])->timeout(30)->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'llama-3.3-70b-versatile',
                'messages' => $messages,
                'max_tokens' => 1024,
            ]);

            if (! $response->successful()) {
                Log::error('[AI Assistant] Groq API error: '.$response->body());
                $status = $response->status();
                if ($status === 429) {
                    return '⏳ Rate limit reached. Please wait a moment and try again.';
                }

                return "I'm having trouble connecting right now (HTTP {$status}). Please try again.";
            }

            return $response->json('choices.0.message.content') ?? 'No response received.';

        } catch (\Exception $e) {
            Log::error('[AI Assistant] Exception: '.$e->getMessage());

            return 'Connection error. Please check your API key and try again.';
        }
    }

    private function buildMessages(array $history, string $userMessage): array
    {
        $messages = [
            ['role' => 'system', 'content' => $this->buildSystemPrompt()],
        ];

        foreach (array_slice($history, -10) as $turn) {
            if (isset($turn['role'], $turn['content'])) {
                $messages[] = ['role' => $turn['role'], 'content' => (string) $turn['content']];
            }
        }

        $messages[] = ['role' => 'user', 'content' => $userMessage];

        return $messages;
    }

    private function buildSystemPrompt(): string
    {
        $devices = Device::all();
        $online = $devices->where('status', 'online');
        $offline = $devices->where('status', 'offline');
        $recentAlerts = Alert::with('device')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();
        $anomalies = $this->anomaly->getAllBaselines();

        $deviceLines = $devices->map(fn ($d) => "  - {$d->name} ({$d->ip_address}) | Type: {$d->type} | Status: {$d->status}".
            ($d->latency_ms ? " | Latency: {$d->latency_ms}ms" : '').
            ($d->location ? " | Location: {$d->location}" : '')
        )->join("\n");

        $alertLines = $recentAlerts->map(fn ($a) => "  - [{$a->created_at->diffForHumans()}] {$a->message}"
        )->join("\n");

        $anomalyLines = collect($anomalies)->map(fn ($b) => "  - {$b['device_name']}: avg={$b['mean']}ms, stddev={$b['stddev']}ms, samples={$b['count']}"
        )->join("\n");

        $now = now()->format('Y-m-d H:i');
        $totalCount = $devices->count();
        $onCount = $online->count();
        $offCount = $offline->count();

        return <<<PROMPT
You are NeTPulse AI, an intelligent network monitoring assistant. You have real-time access to the user's network data.

Current time: {$now}

NETWORK OVERVIEW:
- Total devices: {$totalCount}
- Online: {$onCount}
- Offline: {$offCount}

DEVICES:
{$deviceLines}

RECENT ALERTS (last 10):
{$alertLines}

LATENCY BASELINES:
{$anomalyLines}

YOUR ROLE:
- Answer questions about network health, device status, and performance
- Identify patterns and potential issues using the data above
- Give specific, actionable recommendations
- Keep answers concise and practical
- Reference actual device names, IPs, and numbers from the data
- Format responses clearly — use bullet points or short paragraphs

Always be specific — use real device names and numbers from the data.
PROMPT;
    }
}
