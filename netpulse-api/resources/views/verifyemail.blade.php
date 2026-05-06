<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
  <style>
    body { margin: 0; padding: 0; background: #0f172a; font-family: 'Inter', -apple-system, sans-serif; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
    .header { background: #2563eb; padding: 32px; text-align: center; }
    .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0; color: #bfdbfe; font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { color: #f1f5f9; font-size: 16px; margin: 0 0 16px; }
    .message { color: #94a3b8; font-size: 14px; line-height: 1.7; margin: 0 0 28px; }
    .btn { display: block; width: fit-content; margin: 0 auto 28px; background: #2563eb; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; text-align: center; }
    .note { color: #64748b; font-size: 12px; text-align: center; line-height: 1.6; margin: 0 0 8px; }
    .url { color: #3b82f6; font-size: 11px; word-break: break-all; text-align: center; display: block; }
    .footer { background: #0f172a; padding: 20px 32px; text-align: center; }
    .footer p { margin: 0; color: #475569; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🌐 NetPulse</h1>
      <p>Network Monitoring Dashboard</p>
    </div>
    <div class="body">
      <p class="greeting">Hi {{ $name }},</p>
      <p class="message">
        Welcome to NetPulse! Please verify your email address to activate your account
        and start monitoring your network.
      </p>
      <a href="{{ $verificationUrl }}" class="btn">✓ Verify Email Address</a>
      <p class="note">This link expires in <strong>60 minutes</strong>. If you did not create a NetPulse account, you can safely ignore this email.</p>
      <span class="url">{{ $verificationUrl }}</span>
    </div>
    <div class="footer">
      <p>© {{ date('Y') }} NetPulse · Network Monitoring</p>
    </div>
  </div>
</body>
</html>