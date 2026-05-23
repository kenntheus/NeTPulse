import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(() => {
    try {
      const stored = localStorage.getItem('netpulse_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [loading,     setLoading]     = useState(false)
  const [needsSetup,  setNeedsSetup]  = useState(null)

  useEffect(() => {
    api.get('/auth/setup-status')
      .then(r => setNeedsSetup(r.data.needs_setup))
      .catch(() => setNeedsSetup(false))
  }, [])

  const login = async (email, password, twoFactorCode = null) => {
    setLoading(true)
    try {
      const payload = { email, password }
      if (twoFactorCode) payload.two_factor_code = twoFactorCode

      const { data } = await api.post('/auth/login', payload)

      // 2FA required — return signal to show TOTP input
      if (data.requires_two_factor) {
        return { requires_two_factor: true }
      }

      // Successful login — token returned
      localStorage.setItem('netpulse_token', data.token)
      localStorage.setItem('netpulse_user',  JSON.stringify(data.user))
      setUser(data.user)
      return { success: true }

    } catch (err) {
      const data   = err.response?.data
      const status = err.response?.status

      // 403 = email not verified — backend sends requires_verification: true
      if (status === 403 && data?.requires_verification) {
        return {
          requires_verification: true,
          email: data.email,
        }
      }

      // Validation error (wrong password etc.)
      const msg = data?.errors?.email?.[0]
        ?? data?.message
        ?? 'Login failed. Please try again.'
      return { success: false, message: msg }

    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* noop */ }
    localStorage.removeItem('netpulse_token')
    localStorage.removeItem('netpulse_user')
    setUser(null)
  }

  const isAdmin = () => user?.role === 'admin'

  const completeSetup = () => setNeedsSetup(false)

  return (
    <AuthContext.Provider value={{ user, loading, needsSetup, login, logout, isAdmin, completeSetup }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}