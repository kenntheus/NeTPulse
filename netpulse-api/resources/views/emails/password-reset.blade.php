<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
  <style>
    body { margin: 0; padding: 0; background: #0f172a; font-family: 'Inter', -apple-system, sans-serif; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
    .header { background: #2563eb; padding: 32px; text-align: center; }
    .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 700; }
    .header p { margin: 4px 0 0; color: #bfdbfe; font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { color: #f1f5f9; font-size: 16px; margin: 0 0 12px; }
    .message { color: #94a3b8; font-size: 14px; line-height: 1.7; margin: 0 0 28px; }
    .btn-wrap { text-align: center; margin: 0 0 28px; }
    .btn { display: inline-block; background: #2563eb; color: #fff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 36px; border-radius: 10px; }
    .link-fallback { color: #64748b; font-size: 12px; word-break: break-all; margin: 0 0 24px; }
    .link-fallback a { color: #60a5fa; }
    .warning { background: #1c1917; border: 1px solid #44403c; border-radius: 10px; padding: 14px 16px; color: #a8a29e; font-size: 12px; line-height: 1.6; }
    .footer { background: #0f172a; padding: 20px 32px; text-align: center; }
    .footer p { margin: 0; color: #475569; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🌐 NeTPulse</h1>
      <p>Network Monitoring Dashboard</p>
    </div>
    <div class="body">
      <p class="greeting">Hi {{ $name }},</p>
      <p class="message">
        We received a request to reset the password for your NeTPulse account.
        Click the button below to choose a new password. This link expires in <strong>60 minutes</strong>.
      </p>

      <div class="btn-wrap">
        <a href="{{ $resetUrl }}" class="btn">Reset my password</a>
      </div>

      <p class="link-fallback">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="{{ $resetUrl }}">{{ $resetUrl }}</a>
      </p>

      <div class="warning">
        🔒 <strong>Didn't request this?</strong>
        If you didn't ask to reset your password you can safely ignore this email — your password won't change.
      </div>
    </div>
    <div class="footer">
      <p>© {{ date('Y') }} NeTPulse · Network Monitoring</p>
    </div>
  </div>
</body>
</html>
