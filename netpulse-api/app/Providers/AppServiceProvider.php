<?php

namespace App\Providers;

use App\Models\Device;
use App\Models\MonitoringLog;
use App\Models\Alert;
use App\Events\DeviceStatusUpdated;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class ArpScannerService
{
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

            if ($this->shouldSkip($ip, $mac)) continue;

            $isNew = !Device::where('ip_address', $ip)->exists();
            if ($isNew) {
                $this->autoCreateDevice($ip, $mac);
                $newDevices++;
            }

            $device = Device::where('ip_address', $ip)->first();
            if ($device) {
                $this->updateDeviceOnline($device, $mac);
            }
        }

        $this->markMissingDevicesOffline($arpEntries);

        Log::info("[ARP] Scan complete. Found: " . count($arpEntries) . " entries. New devices: {$newDevices}");

        return [
            'found'   => count($arpEntries),
            'new'     => $newDevices,
            'entries' => $arpEntries,
        ];
    }

    private function parseArpTable(): array
    {
        $isWindows = PHP_OS_FAMILY === 'Windows';
        $output    = shell_exec($isWindows ? 'arp -a 2>&1' : 'arp -a 2>&1') ?? '';

        return $isWindows
            ? $this->parseWindowsArp($output)
            : $this->parseUnixArp($output);
    }

    private function parseWindowsArp(string $output): array
    {
        $entries = [];
        $lines   = explode("\n", $output);

        foreach ($lines as $line) {
            $line = trim($line);
            if (preg_match('/^(\d{1,3}(?:\.\d{1,3}){3})\s+([\da-fA-F]{2}[-:][\da-fA-F]{2}[-:][\da-fA-F]{2}[-:][\da-fA-F]{2}[-:][\da-fA-F]{2}[-:][\da-fA-F]{2})\s+(\w+)/', $line, $m)) {
                $type = strtolower($m[3]);

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
            'created_by'  => 1,
        ]);

        Log::info("[ARP] New device discovered: {$ip} ({$mac}) — {$name}");
    }

    private function updateDeviceOnline(Device $device, string $mac): void
    {
        $wasOffline = $device->status === 'offline';

        $log = MonitoringLog::create([
            'device_id'  => $device->id,
            'status'     => 'online',
            'latency_ms' => null,
            'checked_at' => now(),
        ]);

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
        }
    }

    private function markMissingDevicesOffline(array $arpEntries): void
    {
        $foundIps = collect($arpEntries)->pluck('ip')->toArray();

        Device::where('status', 'online')->get()->each(function (Device $device) use ($foundIps) {
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

    private function lookupManufacturer(string $mac): ?string
    {
        try {
            $existing = Device::where('description', 'like', "%{$mac}%")->first();
            if ($existing) {
                if (preg_match('/Manufacturer: ([^|]+)/', $existing->description, $m)) {
                    return trim($m[1]);
                }
            }

            $oui      = substr(str_replace(':', '', $mac), 0, 6);
            $response = Http::timeout(3)->get("https://api.macvendors.com/{$oui}");

            if ($response->successful()) {
                return trim($response->body());
            }
        } catch (\Exception $e) {

        }

        return null;
    }

    private function guessDeviceType(?string $manufacturer = null, string $ip = ''): string
    {
        $lastOctet = (int) (explode('.', $ip)[3] ?? 0);
        if ($lastOctet === 1 || $lastOctet === 254) {
            return 'router';
        }
        if (!$manufacturer) {
            return 'other';
        }

        $m = strtolower($manufacturer);
        if (str_contains($m, 'tp-link'))    return 'router';
        if (str_contains($m, 'netgear'))    return 'router';
        if (str_contains($m, 'd-link'))     return 'router';
        if (str_contains($m, 'linksys'))    return 'router';
        if (str_contains($m, 'mikrotik'))   return 'switch';
        if (str_contains($m, 'ubiquiti'))   return 'ap';
        if (str_contains($m, 'unifi'))      return 'ap';
        if (str_contains($m, 'ruckus'))     return 'ap';
        if (str_contains($m, 'aruba'))      return 'ap';
        if (str_contains($m, 'cisco') && $lastOctet < 10)  return 'switch'; 
        if (str_contains($m, 'cisco') && $lastOctet >= 10) return 'other';  
        if (str_contains($m, 'xiaomi'))     return 'phone';
        if (str_contains($m, 'oppo'))       return 'phone';
        if (str_contains($m, 'vivo'))       return 'phone';
        if (str_contains($m, 'realme'))     return 'phone';
        if (str_contains($m, 'oneplus'))    return 'phone';
        if (str_contains($m, 'motorola'))   return 'phone';
        if (str_contains($m, 'nokia'))      return 'phone';
        if (str_contains($m, 'apple')) {
            return $lastOctet >= 50 ? 'phone' : 'laptop';
        }
        if (str_contains($m, 'hikvision'))  return 'cctv';
        if (str_contains($m, 'dahua'))      return 'cctv';
        if (str_contains($m, 'axis'))       return 'cctv';
        if (str_contains($m, 'hanwha'))     return 'cctv';
        if (str_contains($m, 'uniview'))    return 'cctv';
        if (str_contains($m, 'reolink'))    return 'cctv';
        if (str_contains($m, 'epson'))      return 'printer';
        if (str_contains($m, 'canon'))      return 'printer';
        if (str_contains($m, 'brother'))    return 'printer';
        if (str_contains($m, 'xerox'))      return 'printer';
        if (str_contains($m, 'lexmark'))    return 'printer';
        if (str_contains($m, 'ricoh'))      return 'printer';
        if (str_contains($m, 'roku'))       return 'smarttv';
        if (str_contains($m, 'tcl'))        return 'smarttv';
        if (str_contains($m, 'hisense'))    return 'smarttv';
        if (str_contains($m, 'intel'))      return 'pc';
        if (str_contains($m, 'realtek'))    return 'pc';
        if (str_contains($m, 'lenovo'))     return 'laptop';
        if (str_contains($m, 'acer'))       return 'laptop';
        if (str_contains($m, 'toshiba'))    return 'laptop';
        if (str_contains($m, 'fujitsu'))    return 'laptop';

        return 'other';
    }

    private function generateName(?string $manufacturer = null, string $ip = '', string $type = 'other'): string
    {
        $lastOctet = explode('.', $ip)[3] ?? '?';

        $typeNames = [
            'router'  => 'Router',
            'switch'  => 'Switch',
            'server'  => 'Server',
            'ap'      => 'Access Point',
            'phone'   => 'Phone',
            'tablet'  => 'Tablet',
            'laptop'  => 'Laptop',
            'pc'      => 'Desktop PC',
            'cctv'    => 'Camera',
            'printer' => 'Printer',
            'smarttv' => 'Smart TV',
            'firewall'=> 'Firewall',
            'other'   => 'Device',
        ];

        $typeName = $typeNames[$type] ?? 'Device';

        if ($manufacturer) {
            $brand = explode(' ', trim($manufacturer))[0];
            return "{$brand} {$typeName} ({$ip})";
        }

        return "{$typeName} .{$lastOctet}";
    }

    private function shouldSkip(string $ip, string $mac): bool
    {
        if (str_ends_with($ip, '.255')) return true;
        if ($ip === '255.255.255.255')  return true;

        if (str_starts_with($mac, '01:') || str_starts_with($mac, 'ff:')) return true;

        if ($mac === '00:00:00:00:00:00') return true;

        $isPrivate = filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) === false;

        return !$isPrivate;
    }
}