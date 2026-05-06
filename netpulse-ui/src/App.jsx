import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/AuthContext'
import AppLayout   from './components/layout/AppLayout'
import Login       from './pages/Login'
import Register    from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard   from './pages/Dashboard'
import Devices     from './pages/Devices'
import Logs        from './pages/Logs'
import Alerts      from './pages/Alerts'
import AiInsights  from './pages/AiInsights'
import NotFound    from './pages/NotFound'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { user } = useAuth()
  return !user ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Guest only */}
      <Route path="/login"        element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register"     element={<GuestRoute><Register /></GuestRoute>} />

      {/* Public — email verification link */}
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/"        element={<Dashboard />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/logs"    element={<Logs />} />
        <Route path="/alerts"  element={<Alerts />} />
        <Route path="/ai"      element={<AiInsights />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}