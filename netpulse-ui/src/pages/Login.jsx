import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import Spinner from '../components/ui/Spinner'
import api from '../lib/api'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  // Needs verification state
  const [needsVerification, setNeedsVerification] = useState(false)
  const [verifyEmail,       setVerifyEmail]        = useState('')
  const [resending,         setResending]           = useState(false)
  const [resent,            setResent]              = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(form.email, form.password)

      if (result.success) {
        navigate('/')
        return
      }

      if (result.requires_verification) {
        setVerifyEmail(form.email)
        setNeedsVerification(true)
        return
      }

      setError(result.message ?? 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  const resendVerification = async () => {
    setResending(true)
    try {
      await api.post('/auth/resend-verification', { email: verifyEmail })
      setResent(true)
    } catch (_) {
      setResent(true) // show sent regardless
    } finally {
      setResending(false)
    }
  }

  // ── Needs verification screen ─────────────────────────────────────────
  if (needsVerification) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">N</div>
            <div>
              <h1 className="text-white font-bold text-xl leading-none">NetPulse</h1>
              <p className="text-gray-500 text-xs">Network Monitoring</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 text-center space-y-4">
            <div className="text-5xl">✉️</div>
            <div>
              <h2 className="text-white font-semibold text-lg mb-1">Verify your email</h2>
              <p className="text-gray-400 text-sm">
                Your account isn't verified yet. We sent a link to<br />
                <span className="text-white font-medium">{verifyEmail}</span>
              </p>
            </div>

            {resent && (
              <div className="bg-green-900/30 border border-green-800 text-green-400 text-sm px-4 py-3 rounded-lg">
                ✓ Verification email resent! Check your inbox.
              </div>
            )}

            <button
              onClick={resendVerification}
              disabled={resending || resent}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-all"
            >
              {resending && <Spinner size="sm" />}
              {resent ? '✓ Email sent' : 'Resend verification email'}
            </button>

            <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-500 text-left">
              <p className="font-medium text-gray-400 mb-1">Didn't receive it?</p>
              <p>• Check your spam/junk folder</p>
              <p>• Make sure the email address is correct</p>
            </div>

            <button
              onClick={() => { setNeedsVerification(false); setResent(false) }}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Use a different account
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Normal login screen ───────────────────────────────────────────────
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

        {/* Card */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-semibold text-lg mb-1">Sign in</h2>
          <p className="text-gray-500 text-sm mb-6">Monitor your network infrastructure</p>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password" required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-all"
            >
              {loading && <Spinner size="sm" />}
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}