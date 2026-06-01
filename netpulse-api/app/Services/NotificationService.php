<?php

namespace App\Services;

use App\Mail\AlertNotificationMail;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public function sendAlertEmail(string $alertType, string $alertMessage, string $deviceName, string $deviceIp): void
    {
        $recipients = User::where('notify_on_alerts', true)
            ->whereNotNull('email_verified_at')
            ->get();

        if ($recipients->isEmpty()) {
            return;
        }

        $dashboardUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');

        foreach ($recipients as $user) {
            try {
                Mail::to($user->email)->send(new AlertNotificationMail(
                    recipientName: $user->name,
                    alertType:     $alertType,
                    alertMessage:  $alertMessage,
                    deviceName:    $deviceName,
                    deviceIp:      $deviceIp,
                    dashboardUrl:  $dashboardUrl,
                ));
            } catch (\Exception $e) {
                Log::error("[AlertNotification] Failed for {$user->email}: ".$e->getMessage());
            }
        }
    }
}
