<?php

namespace App\Http\Controllers;

use App\Services\AI\AlertGroupingService;
use App\Services\AI\AnomalyDetectionService;
use App\Services\AI\DeviceFingerprintService;
use Illuminate\Http\JsonResponse;

class AiController extends Controller
{
    public function __construct(
        private AnomalyDetectionService $anomaly,
        private AlertGroupingService $grouping,
        private DeviceFingerprintService $fingerprint,
    ) {}

    public function insights(): JsonResponse
    {
        $errors = [];

        try {
            $anomalies = $this->anomaly->getAllBaselines();
        } catch (\Throwable $e) {
            $anomalies = [];
            $errors['anomalies'] = 'Anomaly service unavailable.';
            \Log::error('[AI] Anomaly service error: '.$e->getMessage());
        }

        try {
            $fingerprints = $this->fingerprint->fingerprintAll();
        } catch (\Throwable $e) {
            $fingerprints = [];
            $errors['fingerprints'] = 'Fingerprint service unavailable.';
            \Log::error('[AI] Fingerprint service error: '.$e->getMessage());
        }

        try {
            $grouping = $this->grouping->getGroupingStats();
        } catch (\Throwable $e) {
            $grouping = [];
            $errors['grouping'] = 'Grouping service unavailable.';
            \Log::error('[AI] Grouping service error: '.$e->getMessage());
        }

        return response()->json([
            'anomalies' => $anomalies,
            'fingerprints' => $fingerprints,
            'grouping' => $grouping,
            'errors' => $errors ?: null,
        ]);
    }

    public function anomalies(): JsonResponse
    {
        return response()->json($this->anomaly->getAllBaselines());
    }

    public function fingerprints(): JsonResponse
    {
        return response()->json($this->fingerprint->fingerprintAll());
    }
}
