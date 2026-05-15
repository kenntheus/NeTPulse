import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../store/AuthContext'
import Spinner from '../components/ui/Spinner'

export default function Setup() {
  const { completeSetup } = useAuth()
  const navigate = useNavigate()

  const [form,    setForm]    = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

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

    setLoading(true)
    try {
      await api.post('/auth/setup', form)
      completeSetup()
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      const laravelErrors = err.response?.data?.errors
      if (laravelErrors) {
        const mapped = {}
        Object.entries(laravelErrors).forEach(([k, v]) => { mapped[k] = v[0] })
        setErrors(mapped)
      } else {
        setErrors({ email: err.response?.data?.message ?? 'Setup failed.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo / header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white text-2xl font-bold mb-4">N</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to NetPulse</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create your admin account to get started. Only one admin account is allowed.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">

          {done ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">✅</div>
              <p className="font-semibold text-gray-900 dark:text-white">Admin account created!</p>
              <p className="text-sm text-gray-500">Redirecting to login…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field
                label="Full name"
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Your name"
                error={errors.name}
                autoFocus
              />
              <Field
                label="Email address"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="admin@example.com"
                error={errors.email}
              />
              <Field
                label="Password"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 8 characters"
                error={errors.password}
              />
              <Field
                label="Confirm password"
                type="password"
                value={form.password_confirmation}
                onChange={set('password_confirmation')}
                placeholder="Re-enter password"
                error={errors.password_confirmation}
              />

              <button
                type="submit"
                disabled={loading || !form.name || !form.email || !form.password || !form.password_confirmation}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-3 text-sm transition-all mt-2"
              >
                {loading && <Spinner size="sm" />}
                Create admin account
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          This page is only visible until an admin account exists.
        </p>
      </div>
    </div>
  )
}

function Field({ label, error, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
      <input
        className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800
          text-gray-900 dark:text-white placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors
          ${error
            ? 'border-red-400 dark:border-red-600'
            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
          }`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
