<?php

namespace App\Http\Controllers;

use App\Services\AI\AnomalyDetectionService;
use App\Services\AI\AlertGroupingService;
use App\Services\AI\DeviceFingerprintService;
use Illuminate\Http\JsonResponse;

class AiController extends Controller
{
    public function __construct(
        private AnomalyDetectionService  $anomaly,
        private AlertGroupingService     $grouping,
        private DeviceFingerprintService $fingerprint,
    ) {}

    public function insights(): JsonResponse
    {
        return response()->json([
            'anomalies'   => $this->anomaly->getAllBaselines(),
            'fingerprints' => $this->fingerprint->fingerprintAll(),
            'grouping'    => $this->grouping->getGroupingStats(),
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