import { useState, useEffect } from 'react'
import { useAuth } from '../store/AuthContext'
import api from '../lib/api'
import { PageHeader, ToastContainer } from '../components/ui'
import useToast from '../hooks/useToast'
import Spinner from '../components/ui/Spinner'

// ── Section card wrapper ──────────────────────────────────────────────────────
function Section({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

// ── Input field ───────────────────────────────────────────────────────────────
function Field({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>}
      <input
        className={`w-full border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-(--accent)/30 transition-colors
          ${error
            ? 'border-red-400'
            : 'border-(--card-border) focus:border-(--accent)'
          } ${className}`}
        style={{ backgroundColor: 'var(--muted-bg)' }}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Edit Name ─────────────────────────────────────────────────────────────────
function EditName({ user, onUpdated, addToast }) {
  const [name,    setName]    = useState(user?.name ?? '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    setError('')
    setLoading(true)
    try {
      const { data } = await api.patch('/account/name', { name })
      onUpdated(data.user)
      addToast('Name updated successfully!', 'success')
    } catch (err) {
      setError(err.response?.data?.errors?.name?.[0] ?? err.response?.data?.message ?? 'Failed to update name.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label="Display name"
        type="text"
        value={name}
        onChange={e => { setName(e.target.value); setError('') }}
        placeholder="Your full name"
        error={error}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || name === user?.name}
          className="flex items-center gap-2 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-all" style={{ backgroundColor: 'var(--accent)' }}
        >
          {loading && <Spinner size="sm" />}
          Save name
        </button>
      </div>
    </form>
  )
}

// ── Edit Email ────────────────────────────────────────────────────────────────
function EditEmail({ user, onUpdated, addToast }) {
  const [step,     setStep]     = useState('form')  // form | verify
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [code,     setCode]     = useState('')
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)

  const handleRequest = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await api.patch('/account/email', { email, password })
      setStep('verify')
      addToast(`Verification code sent to ${email}`, 'success')
    } catch (err) {
      const laravelErrors = err.response?.data?.errors
      if (laravelErrors) {
        const mapped = {}
        Object.entries(laravelErrors).forEach(([k, v]) => { mapped[k] = v[0] })
        setErrors(mapped)
      } else {
        setErrors({ email: err.response?.data?.message ?? 'Failed to request email change.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (code.length !== 6) { setErrors({ code: 'Enter the 6-digit code.' }); return }
    setErrors({})
    setLoading(true)
    try {
      const { data } = await api.post('/account/verify-email-change', { code })
      onUpdated(data.user)
      setStep('form')
      setEmail('')
      setPassword('')
      setCode('')
      addToast('Email updated successfully!', 'success')
    } catch (err) {
      setErrors({ code: err.response?.data?.message ?? 'Invalid code.' })
    } finally {
      setLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          📧 We sent a 6-digit verification code to <strong>{email}</strong>. Enter it below to confirm.
        </div>
        <Field
          label="Verification code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors({}) }}
          placeholder="000000"
          className="font-mono tracking-[0.5em] text-center text-xl"
          error={errors.code}
          autoFocus
        />
        <div className="flex justify-between items-center">
          <button type="button" onClick={() => setStep('form')}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            ← Cancel
          </button>
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="flex items-center gap-2 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-all" style={{ backgroundColor: 'var(--accent)' }}
          >
            {loading && <Spinner size="sm" />}
            Confirm new email
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleRequest} className="space-y-4">
      <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--muted-bg)' }}>
        <span className="text-gray-500 dark:text-gray-400">Current email: </span>
        <span className="font-medium text-gray-900 dark:text-white">{user?.email}</span>
      </div>
      <Field
        label="New email address"
        type="email"
        value={email}
        onChange={e => { setEmail(e.target.value); setErrors({}) }}
        placeholder="newemail@example.com"
        error={errors.email}
      />
      <Field
        label="Current password (to confirm)"
        type="password"
        value={password}
        onChange={e => { setPassword(e.target.value); setErrors({}) }}
        placeholder="••••••••"
        error={errors.password}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="flex items-center gap-2 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-all" style={{ backgroundColor: 'var(--accent)' }}
        >
          {loading && <Spinner size="sm" />}
          Send verification code
        </button>
      </div>
    </form>
  )
}

// ── Change Password ───────────────────────────────────────────────────────────
function ChangePassword({ addToast }) {
  const [form,    setForm]    = useState({ current_password: '', password: '', password_confirmation: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: 'Passwords do not match.' })
      return
    }
    if (form.password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters.' })
      return
    }

    setLoading(true)
    try {
      const { data } = await api.patch('/account/password', form)
      setForm({ current_password: '', password: '', password_confirmation: '' })
      addToast(data.message, 'success')
    } catch (err) {
      const laravelErrors = err.response?.data?.errors
      if (laravelErrors) {
        const mapped = {}
        Object.entries(laravelErrors).forEach(([k, v]) => { mapped[k] = v[0] })
        setErrors(mapped)
      } else {
        setErrors({ current_password: err.response?.data?.message ?? 'Failed to change password.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label="Current password"
        type="password"
        value={form.current_password}
        onChange={set('current_password')}
        placeholder="••••••••"
        error={errors.current_password}
      />
      <Field
        label="New password"
        type="password"
        value={form.password}
        onChange={set('password')}
        placeholder="Min. 8 characters"
        error={errors.password}
      />

      {/* Password strength */}
      {form.password.length > 0 && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[
              form.password.length >= 8,
              /[A-Z]/.test(form.password),
              /[0-9]/.test(form.password),
              /[^a-zA-Z0-9]/.test(form.password),
            ].map((met, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${met ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`} />
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {form.password.length < 8 ? 'Too short' :
             /[^a-zA-Z0-9]/.test(form.password) ? '✓ Strong password' :
             /[0-9]/.test(form.password) ? 'Add symbols for stronger password' :
             'Add numbers and symbols'}
          </p>
        </div>
      )}

      <Field
        label="Confirm new password"
        type="password"
        value={form.password_confirmation}
        onChange={set('password_confirmation')}
        placeholder="••••••••"
        error={errors.password_confirmation}
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !form.current_password || !form.password || !form.password_confirmation}
          className="flex items-center gap-2 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-all" style={{ backgroundColor: 'var(--accent)' }}
        >
          {loading && <Spinner size="sm" />}
          Change password
        </button>
      </div>
    </form>
  )
}

// ── Code block with copy button ───────────────────────────────────────────────
function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false)
  const doCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative group rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--muted-bg)' }}>
      <pre className="px-4 py-3 text-xs font-mono text-gray-200 overflow-x-auto whitespace-pre leading-relaxed">{code}</pre>
      <button
        onClick={doCopy}
        className="absolute top-2 right-2 px-2 py-1 text-xs rounded-md text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        style={{ backgroundColor: 'var(--card-border)' }}
      >
        {copied ? '✓' : 'Copy'}
      </button>
    </div>
  )
}

// ── Setup guide ───────────────────────────────────────────────────────────────
const API_URL = 'https://netpulse-1.onrender.com'
const REPO    = 'https://github.com/Kenntheus/NeTPulse.git'

function SetupGuide({ token }) {
  const [tab, setTab] = useState('windows')
  const t = token ?? '<YOUR_TOKEN>'

  const envContent = `API_URL=${API_URL}\nAPI_TOKEN=${t}\nINTERVAL=30`

  const steps = {
    windows: [
      {
        label: 'Install Node.js (if not already installed)',
        code: '# Download from: https://nodejs.org  (LTS version)',
        note: 'Open a new PowerShell window after installing.',
      },
      {
        label: 'Clone the repository and enter the agent folder',
        code: `git clone ${REPO}\ncd NeTPulse\\netpulse-agent`,
      },
      {
        label: 'Create the .env config file — paste this content into a new file named .env',
        code: envContent,
        note: 'Save it as .env (no extension) inside the netpulse-agent folder.',
      },
      {
        label: 'Install dependencies and start the agent',
        code: 'npm install\nnode agent.js',
      },
    ],
    unix: [
      {
        label: 'Install Node.js (if not already installed)',
        code: '# Download from: https://nodejs.org  (LTS version)',
        note: 'Or use nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash',
      },
      {
        label: 'Clone the repository and enter the agent folder',
        code: `git clone ${REPO}\ncd NeTPulse/netpulse-agent`,
      },
      {
        label: "Create the .env config file",
        code: `cat > .env << 'EOF'\n${envContent}\nEOF`,
      },
      {
        label: 'Install dependencies and start the agent',
        code: 'npm install && node agent.js',
      },
    ],
  }

  const current = steps[tab]

  return (
    <div className="space-y-4 pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">Setup Guide</p>
        {!token && (
          <span className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800/40 px-2 py-0.5 rounded-md">
            Regenerate token to pre-fill commands
          </span>
        )}
      </div>

      {/* OS tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ backgroundColor: 'var(--muted-bg)' }}>
        {[{ id: 'windows', label: '🪟 Windows' }, { id: 'unix', label: '🍎 macOS / Linux' }].map(os => (
          <button
            key={os.id}
            onClick={() => setTab(os.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === os.id ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
            style={tab === os.id ? { backgroundColor: 'var(--card-bg)' } : undefined}
          >
            {os.label}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {current.map((step, i) => (
          <div key={i} className="space-y-1.5">
            <p className="text-xs font-medium text-gray-300">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs mr-1.5 font-bold" style={{ backgroundColor: 'var(--accent)' }}>
                {i + 1}
              </span>
              {step.label}
            </p>
            <CodeBlock code={step.code} />
            {step.note && (
              <p className="text-xs text-gray-500 pl-1">{step.note}</p>
            )}
          </div>
        ))}
      </div>

      {/* PM2 tip */}
      <div className="rounded-lg px-4 py-3 text-xs text-gray-400 border" style={{ backgroundColor: 'rgba(217,119,6,0.08)', borderColor: 'rgba(217,119,6,0.25)' }}>
        <p className="font-medium text-amber-400 mb-1">💡 Keep it running 24/7</p>
        <p className="mb-2">Install PM2 to run the agent as a background service that survives reboots:</p>
        <CodeBlock code={'npm install -g pm2\npm2 start agent.js --name netpulse-agent\npm2 startup   # auto-start on reboot\npm2 save'} />
      </div>
    </div>
  )
}

// ── Notification Preferences ─────────────────────────────────────────────────
function NotificationPreferences({ user, onUpdated, addToast }) {
  const [enabled,  setEnabled]  = useState(user?.notify_on_alerts ?? true)
  const [loading,  setLoading]  = useState(false)

  const handleToggle = async () => {
    const next = !enabled
    setEnabled(next)
    setLoading(true)
    try {
      await api.patch('/account/notifications', { notify_on_alerts: next })
      onUpdated({ ...user, notify_on_alerts: next })
      addToast(next ? 'Email alerts enabled.' : 'Email alerts disabled.', 'success')
    } catch {
      setEnabled(!next)
      addToast('Failed to update preferences.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-white">Email alert notifications</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Receive an email when a device goes offline, recovers, or has high latency
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          enabled ? 'bg-blue-600' : 'bg-gray-600'
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  )
}

// ── Agent Token ───────────────────────────────────────────────────────────────
function AgentToken({ addToast }) {
  const [hasToken, setHasToken] = useState(null)
  const [newToken, setNewToken] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [copied,   setCopied]   = useState(false)

  useEffect(() => {
    api.get('/account/agent-token')
      .then(r => setHasToken(r.data.has_token))
      .catch(() => {})
  }, [])

  const generate = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/account/agent-token')
      setNewToken(data.token)
      setHasToken(true)
      addToast('Agent token generated — copy it now!', 'success')
    } catch {
      addToast('Failed to generate token.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const revoke = async () => {
    setLoading(true)
    try {
      await api.delete('/account/agent-token')
      setHasToken(false)
      setNewToken(null)
      addToast('Agent token revoked.', 'success')
    } catch {
      addToast('Failed to revoke token.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(newToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Generate a persistent token for the local agent that monitors your network.
        It never expires and is separate from your login session.
      </p>

      {/* Token display — shown only when freshly generated */}
      {newToken && (
        <div className="space-y-2">
          <div className="rounded-lg px-4 py-3 text-sm text-amber-300 border" style={{ backgroundColor: 'rgba(217,119,6,0.12)', borderColor: 'rgba(217,119,6,0.35)' }}>
            ⚠️ Copy this token now — it will not be shown again.
          </div>
          <div className="flex gap-2 items-start">
            <code className="flex-1 rounded-lg px-3 py-2.5 text-xs font-mono text-gray-200 break-all leading-relaxed" style={{ backgroundColor: 'var(--muted-bg)' }}>
              {newToken}
            </code>
            <button
              onClick={copy}
              className="shrink-0 px-3 py-2.5 text-sm font-medium rounded-lg border text-gray-300 transition-colors hover:bg-(--muted-bg)"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Status badge when no fresh token */}
      {!newToken && hasToken !== null && (
        <div className={`text-sm px-4 py-3 rounded-lg border ${
          hasToken ? 'border-green-800 text-green-300' : 'text-gray-400'
        }`} style={{
          backgroundColor: hasToken ? 'rgba(21,128,61,0.2)' : 'var(--muted-bg)',
          borderColor: hasToken ? undefined : 'var(--card-border)',
        }}>
          {hasToken ? '✓ An agent token is active.' : 'No agent token generated yet.'}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-all"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {loading && <Spinner size="sm" />}
          {hasToken ? 'Regenerate token' : 'Generate token'}
        </button>
        {hasToken && (
          <button
            onClick={revoke}
            disabled={loading}
            className="flex items-center gap-2 border border-red-800 text-red-400 hover:bg-red-900/20 disabled:opacity-50 font-medium rounded-lg px-4 py-2 text-sm transition-all"
          >
            Revoke
          </button>
        )}
      </div>

      {/* Setup guide — always visible once token exists */}
      {hasToken && <SetupGuide token={newToken} />}
    </div>
  )
}

// ── Two-Factor Authentication ─────────────────────────────────────────────────
function TwoFactorSettings({ addToast }) {
  const [enabled,    setEnabled]    = useState(null)   // null = loading
  const [step,       setStep]       = useState('idle') // idle | setup | confirm | disable
  const [qrUrl,      setQrUrl]      = useState('')
  const [secret,     setSecret]     = useState('')
  const [code,       setCode]       = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    api.get('/account/2fa').then(r => setEnabled(r.data.enabled)).catch(() => {})
  }, [])

  const startSetup = async () => {
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/account/2fa/setup')
      setQrUrl(data.qr_url); setSecret(data.secret); setStep('confirm')
    } catch { setError('Failed to start setup.') }
    finally { setLoading(false) }
  }

  const confirmEnable = async () => {
    setLoading(true); setError('')
    try {
      await api.post('/account/2fa/confirm', { code })
      setEnabled(true); setStep('idle'); setCode('')
      addToast('Two-factor authentication enabled!', 'success')
    } catch (err) { setError(err.response?.data?.message ?? 'Invalid code.') }
    finally { setLoading(false) }
  }

  const confirmDisable = async () => {
    setLoading(true); setError('')
    try {
      await api.delete('/account/2fa', { data: { code } })
      setEnabled(false); setStep('idle'); setCode('')
      addToast('Two-factor authentication disabled.', 'success')
    } catch (err) { setError(err.response?.data?.message ?? 'Invalid code.') }
    finally { setLoading(false) }
  }

  if (enabled === null) return <p className="text-xs text-gray-500">Loading…</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">
            {enabled ? '🔐 Two-factor authentication is ON' : '🔓 Two-factor authentication is OFF'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {enabled ? 'Your account is protected with TOTP.' : 'Add an extra layer of security to your account.'}
          </p>
        </div>
        {step === 'idle' && (
          enabled
            ? <button onClick={() => { setStep('disable'); setCode(''); setError('') }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors border border-red-800 px-3 py-1.5 rounded-lg">
                Disable
              </button>
            : <button onClick={startSetup} disabled={loading}
                className="text-sm text-white font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}>
                {loading ? 'Setting up…' : 'Enable 2FA'}
              </button>
        )}
      </div>

      {/* QR code setup step */}
      {step === 'confirm' && (
        <div className="space-y-4 pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <p className="text-xs text-gray-400">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to confirm.</p>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <img src={qrUrl} alt="TOTP QR code" className="w-36 h-36 rounded-lg border" style={{ borderColor: 'var(--card-border)' }} />
            <div className="flex-1 space-y-2">
              <p className="text-xs text-gray-400">Or enter the secret manually:</p>
              <code className="block text-xs font-mono bg-(--muted-bg) px-3 py-2 rounded-lg text-(--accent) tracking-widest break-all">{secret}</code>
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <input type="text" inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="flex-1 border rounded-lg px-3 py-2 text-sm text-white font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-(--accent)/30"
              style={{ backgroundColor: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}
            />
            <button onClick={confirmEnable} disabled={loading || code.length < 6}
              className="px-4 py-2 text-sm text-white font-medium rounded-lg disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}>
              {loading ? 'Verifying…' : 'Verify & Enable'}
            </button>
            <button onClick={() => { setStep('idle'); setCode(''); setError('') }}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg border transition-colors"
              style={{ borderColor: 'var(--card-border)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Disable confirmation step */}
      {step === 'disable' && (
        <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <p className="text-xs text-gray-400">Enter your current authenticator code to disable 2FA.</p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <input type="text" inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="flex-1 border rounded-lg px-3 py-2 text-sm text-white font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-(--accent)/30"
              style={{ backgroundColor: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}
            />
            <button onClick={confirmDisable} disabled={loading || code.length < 6}
              className="px-4 py-2 text-sm text-white font-medium rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50">
              {loading ? 'Disabling…' : 'Confirm disable'}
            </button>
            <button onClick={() => { setStep('idle'); setCode(''); setError('') }}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg border transition-colors"
              style={{ borderColor: 'var(--card-border)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Account Settings page ────────────────────────────────────────────────
export default function Account() {
  const { user, logout, isAdmin }   = useAuth()
  const { toasts, addToast, removeToast } = useToast()
  const [currentUser, setCurrentUser] = useState(user)

  const handleUpdated = (updatedUser) => {
    setCurrentUser(updatedUser)
    // Update localStorage so the sidebar reflects the new name/email
    localStorage.setItem('netpulse_user', JSON.stringify(updatedUser))
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      <PageHeader
        title="Account Settings"
        subtitle="Manage your profile, email and password"
      />

      {/* Profile summary */}
      <div className="rounded-xl border p-5 flex items-center gap-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0" style={{ backgroundColor: 'var(--accent)' }}>
          {currentUser?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-lg">{currentUser?.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isAdmin()
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
            }`}>
              {currentUser?.role}
            </span>
            <span className="text-xs text-green-600 dark:text-green-400">✓ Verified</span>
          </div>
        </div>
      </div>

      {/* Edit name */}
      <Section title="Display Name" subtitle="Update how your name appears in the app">
        <EditName user={currentUser} onUpdated={handleUpdated} addToast={addToast} />
      </Section>

      {/* Edit email */}
      <Section
        title="Email Address"
        subtitle="Changing your email requires verification of the new address"
      >
        <EditEmail user={currentUser} onUpdated={handleUpdated} addToast={addToast} />
      </Section>

      {/* Change password */}
      <Section
        title="Change Password"
        subtitle="Use a strong password with at least 8 characters"
      >
        <ChangePassword addToast={addToast} />
      </Section>

      {/* Two-Factor Authentication */}
      <Section title="Two-Factor Authentication" subtitle="Require a TOTP code from an authenticator app on every login">
        <TwoFactorSettings addToast={addToast} />
      </Section>

      {/* Agent token */}
      <Section title="Agent Token" subtitle="Generate a token and follow the setup guide to monitor your local network">
        <AgentToken addToast={addToast} />
      </Section>

      {/* Notification preferences */}
      <Section title="Notifications" subtitle="Control when NeTPulse sends you email alerts">
        <NotificationPreferences user={currentUser} onUpdated={handleUpdated} addToast={addToast} />
      </Section>

      {/* Danger zone */}
      <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 p-5">
        <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Sign out everywhere</h3>
        <p className="text-xs text-red-600/70 dark:text-red-400/70 mb-3">
          This will log you out on all devices and invalidate all active sessions.
        </p>
        <button
          onClick={logout}
          className="text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-2 transition-all"
        >
          Sign out
        </button>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}