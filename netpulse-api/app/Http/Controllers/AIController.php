<?php

namespace App\Http\Controllers;

use App\Services\AI\AnomalyDetectionService;
use App\Services\AI\AlertGroupingService;
use App\Services\AI\DeviceFingerprintService;
use App\Services\AI\NetworkAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function __construct(
        private AnomalyDetectionService  $anomaly,
        private AlertGroupingService     $grouping,
        private DeviceFingerprintService $fingerprint,
        private NetworkAssistantService  $assistant,
    ) {}

    /** GET /api/ai/insights — all AI data in one call */
    public function insights(): JsonResponse
    {
        return response()->json([
            'anomalies'   => $this->anomaly->getAllBaselines(),
            'fingerprints' => $this->fingerprint->fingerprintAll(),
            'grouping'    => $this->grouping->getGroupingStats(),
        ]);
    }

    /** GET /api/ai/anomalies */
    public function anomalies(): JsonResponse
    {
        return response()->json($this->anomaly->getAllBaselines());
    }

    /** GET /api/ai/fingerprints */
    public function fingerprints(): JsonResponse
    {
        return response()->json($this->fingerprint->fingerprintAll());
    }

    /** POST /api/ai/chat */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => ['required', 'string', 'max:1000'],
            'history' => ['nullable', 'array'],
        ]);

        $reply = $this->assistant->chat(
            $request->message,
            $request->history ?? []
        );

        return response()->json(['reply' => $reply]);
    }
}