import { useLocation } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import ThemeToggle from './ThemeToggle'
import AlertBadge from '../alerts/AlertBadge'
import { Badge } from '../ui'

const PAGE_TITLES = {
  '/':        { title: 'Dashboard',  subtitle: 'Network overview & real-time status' },
  '/devices': { title: 'Devices',    subtitle: 'Manage and monitor network devices'  },
  '/logs':    { title: 'Logs',       subtitle: 'Historical monitoring records'       },
  '/alerts':  { title: 'Alerts',     subtitle: 'Device status change events'         },
}

/**
 * TopBar — fixed top bar inside the main layout.
 * Shows current page title, user info, theme toggle, and alert bell.
 */
export default function TopBar() {
  const { user, isAdmin } = useAuth()
  const { pathname }      = useLocation()

  const page = PAGE_TITLES[pathname] ?? { title: 'NetPulse', subtitle: '' }

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-6 py-3">
      <div className="flex items-center justify-between gap-4">

        {/* Left — page title */}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-none">
            {page.title}
          </h2>
          {page.subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {page.subtitle}
            </p>
          )}
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Alert bell */}
          <AlertBadge />

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* User chip */}
          <div className="flex items-center gap-2 pl-1">
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-gray-900 dark:text-white leading-none">
                {user?.name}
              </p>
              <div className="mt-0.5">
                <Badge variant={user?.role === 'admin' ? 'admin' : 'viewer'}>
                  {user?.role}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}