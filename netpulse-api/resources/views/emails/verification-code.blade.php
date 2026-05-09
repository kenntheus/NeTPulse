<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your verification code</title>
  <style>
    body { margin: 0; padding: 0; background: #0f172a; font-family: 'Inter', -apple-system, sans-serif; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
    .header { background: #2563eb; padding: 32px; text-align: center; }
    .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 700; }
    .header p { margin: 4px 0 0; color: #bfdbfe; font-size: 14px; }
    .body { padding: 36px 32px; text-align: center; }
    .greeting { color: #f1f5f9; font-size: 16px; margin: 0 0 12px; text-align: left; }
    .message { color: #94a3b8; font-size: 14px; line-height: 1.7; margin: 0 0 28px; text-align: left; }
    .code-box { background: #0f172a; border: 2px solid #2563eb; border-radius: 16px; padding: 28px; margin: 0 0 24px; }
    .code { font-size: 52px; font-weight: 800; letter-spacing: 14px; color: #60a5fa; font-family: 'Courier New', monospace; }
    .expiry { color: #64748b; font-size: 13px; margin: 10px 0 0; }
    .warning { background: #1c1917; border: 1px solid #44403c; border-radius: 10px; padding: 14px 16px; text-align: left; color: #a8a29e; font-size: 12px; line-height: 1.6; }
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
        Use the verification code below to confirm your email address and activate your NetPulse account.
      </p>

      <div class="code-box">
        <div class="code">{{ $code }}</div>
        <p class="expiry">⏱ Expires in <strong>15 minutes</strong></p>
      </div>

      <div class="warning">
        🔒 <strong>Never share this code.</strong>
        If you didn't create a NetPulse account, you can safely ignore this email.
      </div>
    </div>
    <div class="footer">
      <p>© {{ date('Y') }} NetPulse · Network Monitoring</p>
    </div>
  </div>
</body>
</html>