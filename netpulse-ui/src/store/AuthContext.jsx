import { createContext, useContext, useState } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try {
      const stored = localStorage.getItem('netpulse_user')
      return stored ? JSON.parse(stored) : null
    } catch (_) { return null }
  })
  const [loading, setLoading] = useState(false)

  /**
   * Login — returns:
   *   { success: true }                      → logged in, navigate to /
   *   { requires_verification: true, email } → show verify notice
   *   { success: false, message }            → show error
   */
  const login = async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })

      // Needs email verification
      if (data.requires_verification) {
        return { requires_verification: true, email: data.email }
      }

      // Success — token returned directly
      localStorage.setItem('netpulse_token', data.token)
      localStorage.setItem('netpulse_user',  JSON.stringify(data.user))
      setUser(data.user)
      return { success: true }

    } catch (err) {
      const msg = err.response?.data?.errors?.email?.[0]
        ?? err.response?.data?.message
        ?? 'Login failed. Please try again.'
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Register — backend sends verification email.
   * Returns { success: true } so Register page shows the "check email" screen.
   */
  const register = async (name, email, password, password_confirmation) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', {
        name, email, password, password_confirmation,
      })
      return { success: true, devVerifyUrl: data.dev_verify_url }
    } catch (err) {
      const errors = err.response?.data?.errors
      const first  = errors ? Object.values(errors)[0]?.[0] : null
      return {
        success: false,
        message: first ?? err.response?.data?.message ?? 'Registration failed.',
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch (_) {}
    localStorage.removeItem('netpulse_token')
    localStorage.removeItem('netpulse_user')
    setUser(null)
  }

  const isAdmin = () => user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}