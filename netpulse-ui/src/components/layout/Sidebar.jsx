import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { useDarkMode } from '../../hooks/useDarkMode'

const navItems = [
  { to: '/',        label: 'Dashboard',  icon: '◈' },
  { to: '/devices', label: 'Devices',    icon: '⬡' },
  { to: '/logs',    label: 'Logs',       icon: '≡' },
  { to: '/alerts',  label: 'Alerts',     icon: '⚑' },
]

export default function Sidebar({ alertCount = 0 }) {
  const { user, logout, isAdmin } = useAuth()
  const [dark, setDark]           = useDarkMode()
  const navigate                  = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 min-h-screen bg-gray-950 dark:bg-gray-950 flex flex-col border-r border-gray-800">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">N</div>
          <span className="text-white font-semibold tracking-tight">NetPulse</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 ml-10">Network Monitor</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <span className="text-base leading-none">{icon}</span>
            <span>{label}</span>
            {label === 'Alerts' && alertCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-2">

        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
        >
          <span>{dark ? '☀' : '◐'}</span>
          <span>{dark ? 'Light mode' : 'Dark mode'}</span>
        </button>

        {/* User info */}
        <div className="px-3 py-2 rounded-lg bg-gray-900">
          <p className="text-xs font-medium text-white truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              isAdmin() ? 'bg-purple-900/50 text-purple-400' : 'bg-blue-900/50 text-blue-400'
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