import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { Button } from '../components/ui'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate           = useNavigate()
  const [form,    setForm]  = useState({ email: '', password: '' })
  const [error,   setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(form.email, form.password)
    if (result.success) navigate('/')
    else setError(result.message)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">N</div>
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
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@netpulse.dev"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
            <Button type="submit" loading={loading} className="w-full justify-center">
              Sign in
            </Button>
          </form>

          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-500">
            <p className="font-medium text-gray-400 mb-1">Demo accounts</p>
            <p>Admin: admin@netpulse.dev / password</p>
            <p>Viewer: viewer@netpulse.dev / password</p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 transition-colors">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}