import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    const stored = localStorage.getItem('netpulse_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('netpulse_token', data.token)
      localStorage.setItem('netpulse_user',  JSON.stringify(data.user))
      setUser(data.user)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' }
    } finally {
      setLoading(false)
    }
  }

  const register = async (name, email, password, password_confirmation) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', { name, email, password, password_confirmation })
      localStorage.setItem('netpulse_token', data.token)
      localStorage.setItem('netpulse_user',  JSON.stringify(data.user))
      setUser(data.user)
      return { success: true }
    } catch (err) {
      const errors = err.response?.data?.errors
      const first  = errors ? Object.values(errors)[0]?.[0] : 'Registration failed'
      return { success: false, message: first }
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