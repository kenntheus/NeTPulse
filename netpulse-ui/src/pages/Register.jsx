import { useState } from 'react'
import { Link } from 'react-router-dom'
import Spinner from '../components/ui/Spinner'
import api from '../lib/api'

// ── Code verification step ────────────────────────────────────────────────────
function VerifyCodeStep({ email, onVerified, onBack }) {
  const [code,      setCode]      = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [resent,    setResent]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (code.length !== 6) { setError('Enter the 6-digit code.'); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/verify-code', { email, code })
      onVerified()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Invalid code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setResending(true)
    setResent(false)
    try {
      await api.post('/auth/resend-code', { email })
      setResent(true)
    } catch { setResent(true) }
    finally { setResending(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center py-2">
        <div className="text-4xl mb-3">📧</div>
        <p className="text-gray-400 text-sm">
          We sent a 6-digit code to<br />
          <span className="text-white font-medium">{email}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {resent && (
        <div className="bg-green-900/30 border border-green-800 text-green-400 text-sm px-4 py-3 rounded-lg">
          ✓ New code sent! Check your email.
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Verification code</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          autoFocus
          className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-3 text-2xl font-mono tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <p className="text-xs text-gray-500 mt-1 text-center">Code expires in 15 minutes</p>
      </div>

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-all"
      >
        {loading && <Spinner size="sm" />}
        Verify Email
      </button>

      <div className="flex items-center justify-between text-xs">
        <button type="button" onClick={onBack} className="text-gray-500 hover:text-gray-300 transition-colors">
          ← Back
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={resending}
          className="text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
        >
          {resending ? 'Sending…' : "Didn't receive it? Resend code"}
        </button>
      </div>
    </form>
  )
}

// ── Success step ──────────────────────────────────────────────────────────────
function SuccessStep() {
  return (
    <div className="text-center space-y-4 py-2">
      <div className="text-5xl">✅</div>
      <div>
        <h2 className="text-white font-semibold text-lg mb-2">Email verified!</h2>
        <p className="text-gray-400 text-sm">Your account is active. You can now sign in.</p>
      </div>
      <Link
        to="/login"
        className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-all"
      >
        Sign in to NetPulse
      </Link>
    </div>
  )
}

// ── Already registered — just needs verification ──────────────────────────────
function AlreadyRegisteredStep({ email, onContinue, onBack }) {
  const [sending, setSending] = useState(false)
  const [error,   setError]   = useState('')

  const sendCode = async () => {
    setSending(true)
    setError('')
    try {
      await api.post('/auth/resend-code', { email })
      onContinue()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to send code.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-white font-semibold mb-2">Email already registered</h3>
        <p className="text-gray-400 text-sm">
          <span className="text-white font-medium">{email}</span> is already registered but not yet verified.
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        onClick={sendCode}
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-all"
      >
        {sending && <Spinner size="sm" />}
        Send me the verification code
      </button>

      <button
        onClick={onBack}
        className="w-full text-center text-gray-500 hover:text-gray-300 text-sm transition-colors"
      >
        Use a different email
      </button>
    </div>
  )
}

// ── Main Register page ────────────────────────────────────────────────────────
export default function Register() {
  const [step,     setStep]     = useState('form')
  const [regEmail, setRegEmail] = useState('')
  const [form,     setForm]     = useState({
    name: '', email: '', password: '', password_confirmation: ''
  })
  const [error,      setError]      = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
      })
      setRegEmail(form.email)
      setStep('verify')
    } catch (err) {
      const errors  = err.response?.data?.errors
      const message = err.response?.data?.message ?? ''

      // Email already taken — check if it's an unverified account
      if (errors?.email || message.toLowerCase().includes('already')) {
        const emailVal = form.email

        // Check if it's unverified by trying to resend
        try {
          await api.post('/auth/resend-code', { email: emailVal })
          // If resend works, it's unverified — show the "already registered" step
          setRegEmail(emailVal)
          setStep('already-registered')
        } catch {
          // Fully registered and verified — just tell them to log in
          setError('This email is already registered. Please sign in instead.')
        }
        return
      }

      const first = errors ? Object.values(errors)[0]?.[0] : null
      setError(first ?? message ?? 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">N</div>
          <div>
            <h1 className="text-white font-bold text-xl leading-none">NetPulse</h1>
            <p className="text-gray-500 text-xs">Network Monitoring</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">

          {/* Step indicators — only for form and verify */}
          {(step === 'form' || step === 'verify') && (
            <div className="flex items-center gap-2 mb-5">
              {['form', 'verify'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step === s          ? 'bg-blue-600 text-white' :
                    step === 'verify' && s === 'form' ? 'bg-green-600 text-white' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {step === 'verify' && s === 'form' ? '✓' : i + 1}
                  </div>
                  {i === 0 && (
                    <div className={`h-px w-8 ${step === 'verify' ? 'bg-blue-500' : 'bg-gray-700'}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Registration form ── */}
          {step === 'form' && (
            <>
              <h2 className="text-white font-semibold text-lg mb-1">Create account</h2>
              <p className="text-gray-500 text-sm mb-6">A verification code will be sent to your email</p>

              {error && (
                <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
                  {error}
                  {error.includes('already registered') && (
                    <div className="mt-2">
                      <Link to="/login" className="text-blue-400 hover:text-blue-300 underline text-xs">
                        → Go to Sign in
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { key: 'name',                  label: 'Full name',        type: 'text',     placeholder: 'Juan dela Cruz' },
                  { key: 'email',                 label: 'Email address',    type: 'email',    placeholder: 'juan@example.com' },
                  { key: 'password',              label: 'Password',         type: 'password', placeholder: 'Min. 8 characters' },
                  { key: 'password_confirmation', label: 'Confirm password', type: 'password', placeholder: '••••••••' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
                    <input
                      type={type} required
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                ))}

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
                        <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${met ? 'bg-green-500' : 'bg-gray-700'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {form.password.length < 8          ? 'Too short' :
                       /[^a-zA-Z0-9]/.test(form.password) ? '✓ Strong password' :
                       /[0-9]/.test(form.password)         ? 'Add symbols for stronger password' :
                       'Add numbers and symbols'}
                    </p>
                  </div>
                )}

                <button
                  type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-all"
                >
                  {submitting && <Spinner size="sm" />}
                  Create account
                </button>
              </form>
            </>
          )}

          {/* ── Already registered but unverified ── */}
          {step === 'already-registered' && (
            <>
              <AlreadyRegisteredStep
                email={regEmail}
                onContinue={() => setStep('verify')}
                onBack={() => { setStep('form'); setError('') }}
              />
            </>
          )}

          {/* ── Enter verification code ── */}
          {step === 'verify' && (
            <>
              <h2 className="text-white font-semibold text-lg mb-1">Verify your email</h2>
              <p className="text-gray-500 text-sm mb-5">Enter the code we sent you</p>
              <VerifyCodeStep
                email={regEmail}
                onVerified={() => setStep('success')}
                onBack={() => setStep('form')}
              />
            </>
          )}

          {/* ── Success ── */}
          {step === 'success' && <SuccessStep />}
        </div>

        {step === 'form' && (
          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  )
}