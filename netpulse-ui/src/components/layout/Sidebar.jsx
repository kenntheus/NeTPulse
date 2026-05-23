import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { useTheme, THEMES } from '../../hooks/useTheme'

const navItems = [
  { to: '/',        label: 'Dashboard',   icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { to: '/devices', label: 'Devices',     icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  )},
  { to: '/logs',    label: 'Logs',        icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )},
  { to: '/alerts',  label: 'Alerts',      icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )},
  { to: '/ai',      label: 'AI Insights', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.636-6.364l.707.707M12 21v-1M6.343 17.657l-.707.707M17.657 17.657l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  )},
  { to: '/ai/chat', label: 'AI Assistant', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )},
  { to: '/webhooks', label: 'Webhooks', adminOnly: true, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )},
  { to: '/audit-log', label: 'Audit Log', adminOnly: true, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )},
  { to: '/topology', label: 'Topology', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 100 4 2 2 0 000-4zm16 0a2 2 0 100 4 2 2 0 000-4zM4 14a2 2 0 100 4 2 2 0 000-4zm16 0a2 2 0 100 4 2 2 0 000-4zM4 8h.01M20 8h.01M4 16h.01M20 16h.01M4 10h16M4 14h16" />
    </svg>
  )},
]

function AppearancePanel() {
  const [theme, setTheme] = useTheme()
  const [open, setOpen]   = useState(false)
  const current = THEMES.find(t => t.id === theme) ?? THEMES[0]

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-gray-400 hover:text-white hover:bg-white/10"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <span className="flex-1 text-left">Appearance</span>
        {/* mini preview of current theme */}
        <span className="flex items-center gap-0.5 shrink-0">
          <span className="w-3 h-3 rounded-l-sm" style={{ backgroundColor: current.sidebarBg, border: '1px solid rgba(255,255,255,0.15)' }} />
          <span className="w-3 h-3 rounded-r-sm" style={{ backgroundColor: current.accent }} />
        </span>
      </button>

      {open && (
        <div className="mx-3 mb-1 p-3 rounded-lg space-y-3" style={{ backgroundColor: 'var(--sidebar-card)' }}>
          <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">Theme</p>

          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(t => (
              <button
                key={t.id}
                title={t.label}
                onClick={() => setTheme(t.id)}
                className="group flex flex-col items-center gap-1.5 focus:outline-none"
              >
                {/* Swatch — mini sidebar preview card */}
                <div
                  className="w-full h-10 rounded-lg overflow-hidden relative transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: t.sidebarBg,
                    outline: theme === t.id ? `2px solid ${t.accent}` : '2px solid transparent',
                    outlineOffset: '2px',
                  }}
                >
                  {/* Simulated nav lines */}
                  <div className="absolute left-2 top-2 space-y-1">
                    <div className="h-1 w-5 rounded-full opacity-30 bg-white" />
                    <div className="h-1 w-7 rounded-full" style={{ backgroundColor: t.accent }} />
                    <div className="h-1 w-4 rounded-full opacity-30 bg-white" />
                  </div>
                  {/* Accent dot */}
                  <div
                    className="absolute right-2 bottom-2 w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: t.accent }}
                  />
                </div>
                <span className={`text-xs transition-colors ${
                  theme === t.id ? 'text-white font-medium' : 'text-gray-500'
                }`}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate                  = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside
      className="w-60 min-h-screen flex flex-col border-r"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderColor:     'var(--sidebar-border)',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ backgroundColor: 'var(--accent)' }}
          >N</div>
          <div>
            <span className="text-white font-semibold tracking-tight text-sm">NeTPulse</span>
            <p className="text-gray-400 text-xs">Network Monitor</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.filter(item => !item.adminOnly || isAdmin()).map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`
            }
            style={({ isActive }) =>
              isActive ? { backgroundColor: 'var(--accent)' } : undefined
            }
          >
            {icon}
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t space-y-2" style={{ borderColor: 'var(--sidebar-border)' }}>

        <AppearancePanel />

        {/* User card */}
        <div className="px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--sidebar-card)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              isAdmin() ? 'bg-purple-900/60 text-purple-300' : 'bg-white/10 text-gray-300'
            }`}>
              {user?.role}
            </span>
            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
