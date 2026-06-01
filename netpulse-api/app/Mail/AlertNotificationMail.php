<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AlertNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $recipientName,
        public string $alertType,
        public string $alertMessage,
        public string $deviceName,
        public string $deviceIp,
        public string $dashboardUrl
    ) {}

    public function envelope(): Envelope
    {
        $subject = match ($this->alertType) {
            'offline'      => "🔴 Alert: {$this->deviceName} is offline",
            'recovered'    => "🟢 Resolved: {$this->deviceName} has recovered",
            'high_latency' => "⚠️ Warning: High latency on {$this->deviceName}",
            default        => "NeTPulse Alert: {$this->deviceName}",
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.alert-notification');
    }
}
