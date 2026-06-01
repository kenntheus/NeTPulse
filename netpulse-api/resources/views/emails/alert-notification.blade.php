<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NeTPulse Alert</title>
  <style>
    body { margin: 0; padding: 0; background: #0f172a; font-family: 'Inter', -apple-system, sans-serif; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
    .header-offline   { background: #7f1d1d; padding: 28px 32px; }
    .header-recovered { background: #14532d; padding: 28px 32px; }
    .header-latency   { background: #78350f; padding: 28px 32px; }
    .header-default   { background: #1e3a5f; padding: 28px 32px; }
    .header h1 { margin: 0; color: #fff; font-size: 20px; font-weight: 700; }
    .header p  { margin: 4px 0 0; color: rgba(255,255,255,0.7); font-size: 13px; }
    .body { padding: 32px; }
    .greeting { color: #f1f5f9; font-size: 15px; margin: 0 0 16px; }
    .alert-box { background: #0f172a; border-radius: 12px; padding: 20px; margin: 0 0 24px; border-left: 4px solid #3b82f6; }
    .alert-box p { margin: 0; color: #e2e8f0; font-size: 15px; font-weight: 500; }
    .meta { color: #64748b; font-size: 12px; margin: 8px 0 0; }
    .btn-wrap { text-align: center; margin: 0 0 24px; }
    .btn { display: inline-block; background: #2563eb; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px; }
    .footer { background: #0f172a; padding: 20px 32px; text-align: center; }
    .footer p { margin: 0; color: #475569; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    @php
      $headerClass = match($alertType) {
        'offline'      => 'header-offline',
        'recovered'    => 'header-recovered',
        'high_latency' => 'header-latency',
        default        => 'header-default',
      };
      $icon = match($alertType) {
        'offline'      => '🔴',
        'recovered'    => '🟢',
        'high_latency' => '⚠️',
        default        => '🔔',
      };
    @endphp
    <div class="{{ $headerClass }} header">
      <h1>{{ $icon }} NeTPulse Alert</h1>
      <p>{{ $deviceName }} · {{ $deviceIp }}</p>
    </div>

    <div class="body">
      <p class="greeting">Hi {{ $recipientName }},</p>

      <div class="alert-box">
        <p>{{ $alertMessage }}</p>
        <p class="meta">{{ now()->format('M j, Y \a\t g:i A T') }}</p>
      </div>

      <div class="btn-wrap">
        <a href="{{ $dashboardUrl }}" class="btn">View in dashboard →</a>
      </div>

      <p style="color: #64748b; font-size: 12px; text-align: center;">
        You're receiving this because alert notifications are enabled for your account.<br>
        You can turn them off in <a href="{{ $dashboardUrl }}/account" style="color: #60a5fa;">Account Settings</a>.
      </p>
    </div>

    <div class="footer">
      <p>© {{ date('Y') }} NeTPulse · Network Monitoring</p>
    </div>
  </div>
</body>
</html>
