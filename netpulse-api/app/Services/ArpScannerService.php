<?php

namespace App\Services;

use App\Models\Device;
use App\Models\MonitoringLog;
use App\Models\Alert;
use App\Events\DeviceStatusUpdated;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class ArpScannerService
{
    /**
     * Run a full ARP scan:
     * 1. Parse the system ARP table
     * 2. Auto-create any new devices found
     * 3. Update online/offline status for all LAN devices
     * 4. Return summary of what was found
     */
    public function scan(): array
    {
        $arpEntries = $this->parseArpTable();

        if (empty($arpEntries)) {
            Log::warning('[ARP] No ARP entries found. Is the scanner running on the same machine as the router/LAN?');
            return ['found' => 0, 'new' => 0, 'entries' => []];
        }

        $newDevices = 0;

        foreach ($arpEntries as $entry) {
            $ip  = $entry['ip'];
            $mac = $entry['mac'];

            // Skip invalid/broadcast entries
            if ($this->shouldSkip($ip, $mac)) continue;

            // Auto-create device if not already tracked
            $isNew = !Device::where('ip_address', $ip)->exists();
            if ($isNew) {
                $this->autoCreateDevice($ip, $mac);
                $newDevices++;
            }

            // Update status for this device
            $device = Device::where('ip_address', $ip)->first();
            if ($device) {
                $this->updateDeviceOnline($device, $mac);
            }
        }

        // Mark LAN devices NOT in the ARP table as offline
        $this->markMissingDevicesOffline($arpEntries);

        Log::info("[ARP] Scan complete. Found: " . count($arpEntries) . " entries. New devices: {$newDevices}");

        return [
            'found'   => count($arpEntries),
            'new'     => $newDevices,
            'entries' => $arpEntries,
        ];
    }

    // ── ARP Table Parsing ─────────────────────────────────────────────────

    /**
     * Parse the system ARP table.
     * Works on Windows (arp -a) and Linux/Mac (arp -a or ip neigh).
     */
    private function parseArpTable(): array
    {
        $isWindows = PHP_OS_FAMILY === 'Windows';
        $output    = shell_exec($isWindows ? 'arp -a 2>&1' : 'arp -a 2>&1') ?? '';

        return $isWindows
            ? $this->parseWindowsArp($output)
            : $this->parseUnixArp($output);
    }

    /**
     * Parse Windows `arp -a` output:
     *
     * Interface: 192.168.1.100 --- 0x5
     *   Internet Address      Physical Address      Type
     *   192.168.1.1           aa-bb-cc-dd-ee-ff     dynamic
     *   192.168.1.50          11-22-33-44-55-66     dynamic
     */
    private function parseWindowsArp(string $output): array
    {
        $entries = [];
        $lines   = explode("\n", $output);

        foreach ($lines as $line) {
            $line = trim($line);

            // Match lines like: "  192.168.1.1    aa-bb-cc-dd-ee-ff    dynamic"
            if (preg_match('/^(\d{1,3}(?:\.\d{1,3}){3})\s+([\da-fA-F]{2}[-:][\da-fA-F]{2}[-:][\da-fA-F]{2}[-:][\da-fA-F]{2}[-:][\da-fA-F]{2}[-:][\da-fA-F]{2})\s+(\w+)/', $line, $m)) {
                $type = strtolower($m[3]);

                // Only include dynamic entries (actual connected devices)
                // Skip static entries which are usually system entries
                if ($type === 'dynamic') {
                    $entries[] = [
                        'ip'  => $m[1],
                        'mac' => strtolower(str_replace('-', ':', $m[2])),
                        'type' => $type,
                    ];
                }
            }
        }

        return $entries;
    }

    /**
     * Parse Unix `arp -a` output:
     *
     * router.local (192.168.1.1) at aa:bb:cc:dd:ee:ff [ether] on eth0
     * ? (192.168.1.50) at 11:22:33:44:55:66 [ether] on eth0
     */
    private function parseUnixArp(string $output): array
    {
        $entries = [];
        $lines   = explode("\n", $output);

        foreach ($lines as $line) {
            if (preg_match('/\((\d{1,3}(?:\.\d{1,3}){3})\)\s+at\s+([\da-fA-F:]{17})/', $line, $m)) {
                $mac = strtolower($m[2]);
                if ($mac !== '00:00:00:00:00:00' && $mac !== 'ff:ff:ff:ff:ff:ff') {
                    $entries[] = [
                        'ip'  => $m[1],
                        'mac' => $mac,
                        'type' => 'dynamic',
                    ];
                }
            }
        }

        return $entries;
    }

    // ── Device Management ─────────────────────────────────────────────────

    /**
     * Auto-create a new device when discovered by ARP scanner.
     * Looks up the manufacturer from the MAC address OUI.
     */
    private function autoCreateDevice(string $ip, string $mac): void
    {
        $manufacturer = $this->lookupManufacturer($mac);
        $type         = $this->guessDeviceType($manufacturer, $ip);
        $name         = $this->generateName($manufacturer, $ip, $type);

        Device::create([
            'name'        => $name,
            'ip_address'  => $ip,
            'type'        => $type,
            'location'    => 'Home Network',
            'description' => "Auto-discovered via ARP scan. MAC: {$mac}" .
                             ($manufacturer ? " | Manufacturer: {$manufacturer}" : ''),
            'status'      => 'online',
            'latency_ms'  => null,
            'created_by'  => 1, // admin user
        ]);

        Log::info("[ARP] New device discovered: {$ip} ({$mac}) — {$name}");
    }

    /**
     * Mark an ARP-discovered device as online.
     */
    private function updateDeviceOnline(Device $device, string $mac): void
    {
        $wasOffline = $device->status === 'offline';

        $log = MonitoringLog::create([
            'device_id'  => $device->id,
            'status'     => 'online',
            'latency_ms' => null, // ARP doesn't give latency — use ping separately
            'checked_at' => now(),
        ]);

        // Create recovery alert if it was offline
        if ($wasOffline) {
            Alert::create([
                'device_id'  => $device->id,
                'type'       => 'recovered',
                'message'    => "🟢 [{$device->name}] ({$device->ip_address}) reconnected to the network.",
                'created_at' => now(),
            ]);
        }

        $device->update([
            'status'          => 'online',
            'last_checked_at' => now(),
        ]);

        try {
            broadcast(new DeviceStatusUpdated($device->fresh(), $log));
        } catch (\Exception $e) {
            // Pusher not configured — ignore
        }
    }

    /**
     * Mark private-IP devices NOT found in ARP table as offline.
     * Skips public IPs (those are pinged separately by MonitoringService).
     */
    private function markMissingDevicesOffline(array $arpEntries): void
    {
        $foundIps = collect($arpEntries)->pluck('ip')->toArray();

        // Get all private-IP devices that are currently online
        Device::where('status', 'online')->get()->each(function (Device $device) use ($foundIps) {
            // Only process private IPs (LAN devices)
            $isPrivate = filter_var(
                $device->ip_address,
                FILTER_VALIDATE_IP,
                FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
            ) === false;

            if (!$isPrivate) return; // Skip public IPs

            if (!in_array($device->ip_address, $foundIps)) {
                $log = MonitoringLog::create([
                    'device_id'  => $device->id,
                    'status'     => 'offline',
                    'latency_ms' => null,
                    'checked_at' => now(),
                ]);

                Alert::create([
                    'device_id'  => $device->id,
                    'type'       => 'offline',
                    'message'    => "🔴 [{$device->name}] ({$device->ip_address}) left the network.",
                    'created_at' => now(),
                ]);

                $device->update([
                    'status'          => 'offline',
                    'last_checked_at' => now(),
                ]);

                try {
                    broadcast(new DeviceStatusUpdated($device->fresh(), $log));
                } catch (\Exception $e) {}

                Log::info("[ARP] Device offline: {$device->ip_address}");
            }
        });
    }

    // ── Manufacturer Lookup ───────────────────────────────────────────────

    /**
     * Look up device manufacturer from MAC address OUI.
     * Uses macvendors.com free API — falls back gracefully if unavailable.
     */
    private function lookupManufacturer(string $mac): ?string
    {
        try {
            // Rate limit: only look up once per MAC (cache in description)
            $existing = Device::where('description', 'like', "%{$mac}%")->first();
            if ($existing) {
                if (preg_match('/Manufacturer: ([^|]+)/', $existing->description, $m)) {
                    return trim($m[1]);
                }
            }

            // Query macvendors.com API (free, no API key needed)
            $oui      = substr(str_replace(':', '', $mac), 0, 6);
            $response = Http::timeout(3)->get("https://api.macvendors.com/{$oui}");

            if ($response->successful()) {
                return trim($response->body());
            }
        } catch (\Exception $e) {
            // API unavailable — continue without manufacturer
        }

        return null;
    }

    /**
     * Guess device type from manufacturer name and IP position.
     */
    private function guessDeviceType(string $manufacturer = null, string $ip = ''): string
    {
        if (!$manufacturer) return 'other';

        $m = strtolower($manufacturer);

        // Phones / tablets
        if (str_contains($m, 'apple'))                                      return 'other'; // iPhone/iPad
        if (str_contains($m, 'samsung') || str_contains($m, 'huawei'))     return 'other'; // Android phone
        if (str_contains($m, 'xiaomi') || str_contains($m, 'oppo'))        return 'other';

        // Network equipment
        if (str_contains($m, 'tp-link') || str_contains($m, 'netgear'))    return 'router';
        if (str_contains($m, 'cisco') || str_contains($m, 'ubiquiti'))     return 'switch';
        if (str_contains($m, 'ruckus') || str_contains($m, 'aruba'))       return 'ap';

        // Computers
        if (str_contains($m, 'intel') || str_contains($m, 'realtek'))      return 'server';
        if (str_contains($m, 'dell') || str_contains($m, 'lenovo'))        return 'server';
        if (str_contains($m, 'hp') || str_contains($m, 'asus'))            return 'server';

        // Smart home / TV
        if (str_contains($m, 'sony') || str_contains($m, 'lg electronics')) return 'other';
        if (str_contains($m, 'amazon') || str_contains($m, 'google'))       return 'other';

        return 'other';
    }

    /**
     * Generate a friendly device name.
     */
    private function generateName(string $manufacturer = null, string $ip = '', string $type = 'other'): string
    {
        $lastOctet = explode('.', $ip)[3] ?? '?';

        if ($manufacturer) {
            // Shorten long manufacturer names
            $short = explode(' ', $manufacturer)[0]; // e.g. "Apple Inc." → "Apple"
            return "{$short} Device ({$ip})";
        }

        $typeNames = [
            'router'   => 'Router',
            'switch'   => 'Switch',
            'server'   => 'Computer',
            'ap'       => 'Access Point',
            'firewall' => 'Firewall',
            'other'    => 'Device',
        ];

        return ($typeNames[$type] ?? 'Device') . " .{$lastOctet}";
    }

    /**
     * Skip broadcast, multicast, and invalid entries.
     */
    private function shouldSkip(string $ip, string $mac): bool
    {
        // Skip broadcast
        if (str_ends_with($ip, '.255')) return true;
        if ($ip === '255.255.255.255')  return true;

        // Skip multicast MAC range
        if (str_starts_with($mac, '01:') || str_starts_with($mac, 'ff:')) return true;

        // Skip invalid MACs
        if ($mac === '00:00:00:00:00:00') return true;

        // Skip non-private IPs (public IPs handled by MonitoringService)
        $isPrivate = filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) === false;

        return !$isPrivate;
    }
}