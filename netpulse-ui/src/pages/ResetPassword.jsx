import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/ui/Spinner'

export default function ResetPassword() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()

  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [form,    setForm]    = useState({ password: '', password_confirmation: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [done,    setDone]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, email, ...form })
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-4xl">🔗</p>
          <p className="text-white font-semibold">Invalid reset link</p>
          <p className="text-gray-400 text-sm">This link is missing required parameters.</p>
          <Link to="/forgot-password" className="block text-blue-400 hover:text-blue-300 text-sm mt-2">
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">N</div>
          <div>
            <h1 className="text-white font-bold text-xl leading-none">NeTPulse</h1>
            <p className="text-gray-500 text-xs">Network Monitoring</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          {done ? (
            <div className="text-center space-y-3 py-2">
              <div className="text-4xl">✅</div>
              <h2 className="text-white font-semibold text-lg">Password reset!</h2>
              <p className="text-gray-400 text-sm">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <h2 className="text-white font-semibold text-lg mb-1">Set new password</h2>
              <p className="text-gray-500 text-sm mb-6">
                Resetting for <span className="text-gray-300">{email}</span>
              </p>

              {error && (
                <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
                  {error}{' '}
                  {error.includes('expired') && (
                    <Link to="/forgot-password" className="underline hover:text-red-300">Request a new link.</Link>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">New password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoFocus
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="At least 8 characters"
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm new password</label>
                  <input
                    type="password"
                    required
                    value={form.password_confirmation}
                    onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
                    placeholder="Repeat the password"
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-all"
                >
                  {loading && <Spinner size="sm" />}
                  Reset password
                </button>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
