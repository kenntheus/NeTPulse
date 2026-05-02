import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { useDarkMode } from '../../hooks/useDarkMode'

const navItems = [
  { to: '/',        label: 'Dashboard', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { to: '/devices', label: 'Devices', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  )},
  { to: '/logs',    label: 'Logs', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )},
  { to: '/alerts',  label: 'Alerts', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )},
]

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth()
  const [dark, setDark]           = useDarkMode()
  const navigate                  = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 min-h-screen flex flex-col border-r
      bg-gray-900 border-gray-800
      dark:bg-gray-950 dark:border-gray-800">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            N
          </div>
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
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-2">

        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
            text-gray-400 hover:text-white hover:bg-gray-800"
        >
          {dark ? (
            // Sun icon — click to go light
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            // Moon icon — click to go dark
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          <span>{dark ? 'Light mode' : 'Dark mode'}</span>
        </button>

        {/* User card */}
        <div className="px-3 py-2.5 rounded-lg bg-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              isAdmin()
                ? 'bg-purple-900/60 text-purple-300'
                : 'bg-blue-900/60 text-blue-300'
            }`}>
              {user?.role}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}