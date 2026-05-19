import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/ui/Spinner'

/**
 * VerifyEmail page
 *
 * This page is opened when the user clicks the verification link in their email.
 * The URL looks like: /verify-email?id=1&token=xxx&expires=xxx&signature=xxx
 *
 * It calls the backend to verify, then shows success/error.
 */
export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading | success | error | already-verified
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verify = async () => {
      try {
        // Pass all query params to the backend
        const params = Object.fromEntries(searchParams.entries())
        const { data } = await api.get('/auth/verify-email', { params })

        if (data.message?.includes('already')) {
          setStatus('already-verified')
        } else {
          setStatus('success')
        }
        setMessage(data.message)
      } catch (err) {
        setStatus('error')
        setMessage(err.response?.data?.message ?? 'Verification failed. The link may have expired.')
      }
    }

    verify()
  }, [searchParams])

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

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 text-center">

          {status === 'loading' && (
            <div className="py-8 flex flex-col items-center gap-3">
              <Spinner size="lg" />
              <p className="text-gray-400 text-sm">Verifying your email…</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 py-2">
              <div className="text-5xl">✅</div>
              <div>
                <h2 className="text-white font-semibold text-lg mb-2">Email verified!</h2>
                <p className="text-gray-400 text-sm">
                  Your account is now active. You can log in to NetPulse.
                </p>
              </div>
              <Link
                to="/login"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-all"
              >
                Sign in to NetPulse
              </Link>
            </div>
          )}

          {status === 'already-verified' && (
            <div className="space-y-4 py-2">
              <div className="text-5xl">✓</div>
              <div>
                <h2 className="text-white font-semibold text-lg mb-2">Already verified</h2>
                <p className="text-gray-400 text-sm">Your email is already verified. Go ahead and log in.</p>
              </div>
              <Link
                to="/login"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-all"
              >
                Sign in
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 py-2">
              <div className="text-5xl">❌</div>
              <div>
                <h2 className="text-white font-semibold text-lg mb-2">Verification failed</h2>
                <p className="text-gray-400 text-sm">{message}</p>
              </div>
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-all"
                >
                  Back to login
                </Link>
                <Link
                  to="/register"
                  className="block w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg px-4 py-2.5 text-sm transition-all"
                >
                  Register again
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}