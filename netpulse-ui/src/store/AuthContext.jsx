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
   *   { success: true }
   *   { requires_verification: true, email, dev_code }
   *   { success: false, message }
   */
  const login = async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })

      if (data.requires_verification) {
        return {
          requires_verification: true,
          email:    data.email,
          dev_code: data.dev_code ?? null,
        }
      }

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

  const logout = async () => {
    try { await api.post('/auth/logout') } catch (_) {}
    localStorage.removeItem('netpulse_token')
    localStorage.removeItem('netpulse_user')
    setUser(null)
  }

  const isAdmin = () => user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}