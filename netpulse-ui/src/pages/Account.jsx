import { useState, useEffect } from 'react'
import { useAuth } from '../store/AuthContext'
import api from '../lib/api'
import { PageHeader, ToastContainer } from '../components/ui'
import useToast from '../hooks/useToast'
import Spinner from '../components/ui/Spinner'

// ── Section card wrapper ──────────────────────────────────────────────────────
function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
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
        className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800
          text-gray-900 dark:text-white placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors
          ${error
            ? 'border-red-400 dark:border-red-600'
            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
          } ${className}`}
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
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-all"
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
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-all"
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
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
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
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-all"
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
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-all"
        >
          {loading && <Spinner size="sm" />}
          Change password
        </button>
      </div>
    </form>
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
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Use this token in your local agent's <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">.env</code> as <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">API_TOKEN</code>.
        It never expires and is independent of your login session.
      </p>

      {newToken && (
        <div className="space-y-2">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            Copy this token now — it won't be shown again.
          </div>
          <div className="flex gap-2 items-start">
            <code className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2.5 text-xs font-mono text-gray-800 dark:text-gray-200 break-all leading-relaxed">
              {newToken}
            </code>
            <button
              onClick={copy}
              className="shrink-0 px-3 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {!newToken && hasToken !== null && (
        <div className={`text-sm px-4 py-3 rounded-lg border ${
          hasToken
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
        }`}>
          {hasToken ? '✓ An agent token is active.' : 'No agent token generated yet.'}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-all"
        >
          {loading && <Spinner size="sm" />}
          {hasToken ? 'Regenerate token' : 'Generate token'}
        </button>
        {hasToken && (
          <button
            onClick={revoke}
            disabled={loading}
            className="flex items-center gap-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 font-medium rounded-lg px-4 py-2 text-sm transition-all"
          >
            Revoke
          </button>
        )}
      </div>
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
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0" style={{ backgroundColor: 'var(--accent)' }}>
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

      {/* Agent token */}
      <Section title="Agent Token" subtitle="Generate a persistent token for the NetPulse local agent">
        <AgentToken addToast={addToast} />
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