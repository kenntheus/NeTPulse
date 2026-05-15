import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  const { user, isAdmin, logout } = useAuth()
  const { pathname }              = useLocation()
  const navigate                  = useNavigate()
  const [open, setOpen]           = useState(false)
  const dropdownRef               = useRef(null)

  const page = PAGE_TITLES[pathname] ?? { title: 'NetPulse', subtitle: '' }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleAccountSettings = () => {
    setOpen(false)
    navigate('/account')
  }

  const handleSignOut = async () => {
    setOpen(false)
    await logout()
    navigate('/login')
  }

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

          {/* User chip with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(prev => !prev)}
              className="flex items-center gap-2 pl-1 rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-gray-900 dark:text-white leading-none">
                  {user?.name}
                </p>
                <div className="mt-0.5">
                  <Badge variant={user?.role === 'admin' ? 'admin' : 'viewer'}>
                    {user?.role}
                  </Badge>
                </div>
              </div>
              {/* Chevron */}
              <svg
                className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {open && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg py-1 z-50">
                <button
                  onClick={handleAccountSettings}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Account Settings
                </button>
                <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}