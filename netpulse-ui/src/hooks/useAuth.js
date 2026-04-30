/**
 * useAuth — convenience re-export so components can import from hooks/useAuth
 * instead of store/AuthContext directly.
 *
 * Usage:
 *   import { useAuth } from '../hooks/useAuth'
 *   const { user, login, logout, isAdmin } = useAuth()
 */
export { useAuth } from '../store/AuthContext'