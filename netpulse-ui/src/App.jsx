import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/AuthContext'
import AppLayout  from './components/layout/AppLayout'
import Landing        from './pages/Landing'
import Login          from './pages/Login'
import Register       from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword  from './pages/ResetPassword'
import Setup      from './pages/Setup'
import Dashboard  from './pages/Dashboard'
import Devices    from './pages/Devices'
import Logs       from './pages/Logs'
import Alerts     from './pages/Alerts'
import AiInsights from './pages/AIInsights'
import AiChat     from './pages/AiChat'
import Account    from './pages/Account'
import Webhooks    from './pages/Webhooks'
import AuditLog    from './pages/AuditLog'
import TopologyMap from './pages/TopologyMap'
import NotFound    from './pages/NotFound'

function HomeRoute() {
  const { user, needsSetup } = useAuth()
  if (needsSetup === null) return null
  if (needsSetup) return <Navigate to="/setup" replace />
  if (user) return <Navigate to="/dashboard" replace />
  return <Landing />
}

function ProtectedRoute({ children }) {
  const { user, needsSetup } = useAuth()
  if (needsSetup) return <Navigate to="/setup" replace />
  return user ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { user, needsSetup } = useAuth()
  if (needsSetup) return <Navigate to="/setup" replace />
  return !user ? children : <Navigate to="/dashboard" replace />
}

function SetupRoute({ children }) {
  const { needsSetup } = useAuth()
  if (needsSetup === null) return null
  return needsSetup ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"         element={<HomeRoute />} />
      <Route path="/setup"    element={<SetupRoute><Setup /></SetupRoute>} />
      <Route path="/login"           element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register"        element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/devices"   element={<Devices />} />
        <Route path="/logs"    element={<Logs />} />
        <Route path="/alerts"  element={<Alerts />} />
        <Route path="/ai"      element={<AiInsights />} />
        <Route path="/ai/chat" element={<AiChat />} />
        <Route path="/account"  element={<Account />} />
        <Route path="/webhooks"  element={<Webhooks />} />
        <Route path="/audit-log" element={<AuditLog />} />
        <Route path="/topology"  element={<TopologyMap />} />
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