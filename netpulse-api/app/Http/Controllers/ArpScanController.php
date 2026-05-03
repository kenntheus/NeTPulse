<?php

namespace App\Http\Controllers;

use App\Services\ArpScannerService;
use Illuminate\Http\JsonResponse;

class ArpScanController extends Controller
{
    public function __construct(private ArpScannerService $scanner) {}

    /**
     * POST /api/arp/scan
     * Trigger a manual ARP scan immediately.
     */
    public function scan(): JsonResponse
    {
        $result = $this->scanner->scan();

        return response()->json([
            'message'  => "Scan complete. Found {$result['found']} devices on the network. {$result['new']} new device(s) added.",
            'found'    => $result['found'],
            'new'      => $result['new'],
            'entries'  => $result['entries'],
        ]);
    }
}