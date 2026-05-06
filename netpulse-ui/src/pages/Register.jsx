import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import Spinner from '../components/ui/Spinner'

export default function Register() {
  const { register, loading } = useAuth()

  const [form,         setForm]         = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [error,        setError]        = useState('')
  const [submitted,    setSubmitted]    = useState(false)
  const [devVerifyUrl, setDevVerifyUrl] = useState(null)

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

    const result = await register(form.name, form.email, form.password, form.password_confirmation)

    if (result.success) {
      setDevVerifyUrl(result.devVerifyUrl ?? null)
      setSubmitted(true)
    } else {
      setError(result.message)
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

          {/* ── Success state ─────────────────────────────────────── */}
          {submitted ? (
            <div className="text-center space-y-4 py-2">
              <div className="text-5xl">📧</div>
              <div>
                <h2 className="text-white font-semibold text-lg mb-2">Check your email!</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  We sent a verification link to<br />
                  <span className="text-white font-medium">{form.email}</span>
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Click the link to activate your account. Expires in 60 minutes.
                </p>
              </div>

              {/* Dev mode helper — shows verify link if email failed */}
              {devVerifyUrl && (
                <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3 text-left">
                  <p className="text-amber-400 text-xs font-semibold mb-1">
                    🔧 Dev mode — email not sent
                  </p>
                  <p className="text-amber-300/70 text-xs mb-2">
                    Click this link to verify your account:
                  </p>
                  <a
                    href={devVerifyUrl}
                    className="text-blue-400 text-xs break-all hover:underline"
                  >
                    {devVerifyUrl}
                  </a>
                </div>
              )}

              <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-500 text-left">
                <p className="font-medium text-gray-400 mb-1">Didn't receive it?</p>
                <p>• Check your spam/junk folder</p>
                <p>• Make sure you entered the correct email</p>
                <p>• <Link to="/login" className="text-blue-400 hover:text-blue-300">Go to login</Link> to resend</p>
              </div>

              <Link
                to="/login"
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-all"
              >
                Go to Sign in
              </Link>
            </div>

          ) : (
            /* ── Registration form ──────────────────────────────── */
            <>
              <h2 className="text-white font-semibold text-lg mb-1">Create account</h2>
              <p className="text-gray-500 text-sm mb-6">
                You'll need to verify your email before logging in
              </p>

              {error && (
                <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
                  {error}
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

                {/* Password strength indicator */}
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
                      {form.password.length < 8 ? 'Too short' :
                       /[^a-zA-Z0-9]/.test(form.password) ? '✓ Strong password' :
                       /[0-9]/.test(form.password) ? 'Add symbols for stronger password' :
                       'Add numbers and symbols'}
                    </p>
                  </div>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-all"
                >
                  {loading && <Spinner size="sm" />}
                  Create account
                </button>
              </form>
            </>
          )}
        </div>

        {!submitted && (
          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  )
}