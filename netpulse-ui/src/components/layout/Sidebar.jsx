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
]

function AppearancePanel() {
  const [theme, setTheme] = useTheme()
  const [open, setOpen]   = useState(false)
  const current = THEMES.find(t => t.id === theme) ?? THEMES[0]

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-gray-400 hover:text-white hover:bg-gray-800"
      >
        {/* Palette icon */}
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <span className="flex-1 text-left">Appearance</span>
        {/* Current color dot */}
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: current.accent }} />
      </button>

      {open && (
        <div className="mx-3 mb-1 p-3 rounded-lg bg-gray-800 space-y-2.5">
          <p className="text-xs text-gray-400 font-medium">Accent color</p>
          <div className="flex gap-2 flex-wrap">
            {THEMES.map(t => (
              <button
                key={t.id}
                title={t.label}
                onClick={() => setTheme(t.id)}
                className="w-7 h-7 rounded-full transition-all hover:scale-110 focus:outline-none"
                style={{
                  backgroundColor: t.accent,
                  boxShadow: theme === t.id
                    ? `0 0 0 2px #1f2937, 0 0 0 4px ${t.accent}`
                    : 'none',
                }}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500">{current.label}</p>
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth()
  const [theme]                   = useTheme()
  const navigate                  = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 min-h-screen flex flex-col border-r bg-gray-900 border-gray-800">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: 'var(--accent)' }}
          >N</div>
          <div>
            <span className="text-white font-semibold tracking-tight text-sm">NetPulse</span>
            <p className="text-gray-500 text-xs">Network Monitor</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
      <div className="px-3 py-4 border-t border-gray-800 space-y-2">

        <AppearancePanel />

        <div className="px-3 py-2.5 rounded-lg bg-gray-800">
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              isAdmin() ? 'bg-purple-900/60 text-purple-300' : 'bg-gray-700 text-gray-300'
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
