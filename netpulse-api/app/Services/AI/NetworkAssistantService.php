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
        $apiKey = config('services.gemini.key');

        if (! $apiKey) {
            return '⚠️ Gemini API key not configured. Add GEMINI_API_KEY to your .env file. Get a free key at aistudio.google.com.';
        }

        $systemPrompt = $this->buildSystemPrompt();
        $contents = $this->buildContents($history, $userMessage);

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->timeout(30)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={$apiKey}",
                [
                    'system_instruction' => [
                        'parts' => [['text' => $systemPrompt]],
                    ],
                    'contents' => $contents,
                    'generationConfig' => ['maxOutputTokens' => 1024],
                ]
            );

            if (! $response->successful()) {
                Log::error('[AI Assistant] Gemini API error: '.$response->body());
                $status = $response->status();
                if ($status === 429) {
                    return '⏳ Rate limit reached. The free tier allows a limited number of requests per minute — please wait a moment and try again.';
                }

                return "I'm having trouble connecting to Gemini right now (HTTP {$status}). Please try again.";
            }

            $data = $response->json();

            return $data['candidates'][0]['content']['parts'][0]['text'] ?? 'No response received.';

        } catch (\Exception $e) {
            Log::error('[AI Assistant] Exception: '.$e->getMessage());

            return 'Connection error. Please check your API key and try again.';
        }
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
You are NetPulse AI, an intelligent network monitoring assistant. You have access to real-time data about the user's network.

Current time: {$now}

NETWORK OVERVIEW:
- Total devices: {$totalCount}
- Online: {$onCount}
- Offline: {$offCount}

DEVICES:
{$deviceLines}

RECENT ALERTS (last 10):
{$alertLines}

LATENCY BASELINES (anomaly detection data):
{$anomalyLines}

YOUR ROLE:
- Answer questions about network health, device status, and performance
- Identify patterns and potential issues in the data above
- Give specific, actionable recommendations
- Keep answers concise and practical
- Reference actual device names and numbers from the data
- If asked about something outside the network data, be helpful but clarify you're an AI assistant

Always be specific — use real device names, IPs, and numbers from the data above.
PROMPT;
    }

    private function buildContents(array $history, string $userMessage): array
    {
        $contents = [];

        // Gemini uses "model" for assistant turns; map accordingly
        foreach (array_slice($history, -10) as $turn) {
            if (isset($turn['role'], $turn['content'])) {
                $role = $turn['role'] === 'assistant' ? 'model' : 'user';
                $contents[] = ['role' => $role, 'parts' => [['text' => $turn['content']]]];
            }
        }

        $contents[] = ['role' => 'user', 'parts' => [['text' => $userMessage]]];

        return $contents;
    }
}
