import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { Button } from '../components/ui'

export default function Register() {
  const { register, loading } = useAuth()
  const navigate              = useNavigate()
  const [form,  setForm]      = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.')
      return
    }
    const result = await register(form.name, form.email, form.password, form.password_confirmation)
    if (result.success) navigate('/')
    else setError(result.message)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">N</div>
          <div>
            <h1 className="text-white font-bold text-xl leading-none">NetPulse</h1>
            <p className="text-gray-500 text-xs">Network Monitoring</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-semibold text-lg mb-1">Create account</h2>
          <p className="text-gray-500 text-sm mb-6">New accounts are created as Viewers</p>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'name',                  label: 'Full name',        type: 'text',     placeholder: 'Juan dela Cruz' },
              { key: 'email',                 label: 'Email',            type: 'email',    placeholder: 'juan@example.com' },
              { key: 'password',              label: 'Password',         type: 'password', placeholder: '8+ characters' },
              { key: 'password_confirmation', label: 'Confirm password', type: 'password', placeholder: '••••••••' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            ))}
            <Button type="submit" loading={loading} className="w-full justify-center">
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}