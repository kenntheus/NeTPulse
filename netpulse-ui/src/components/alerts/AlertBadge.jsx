import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'

const TYPE_ICON = {
  offline:      '🔴',
  recovered:    '🟢',
  high_latency: '⚠️',
}

export default function AlertBadge() {
  const [count,    setCount]    = useState(0)
  const [alerts,   setAlerts]   = useState([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const panelRef = useRef(null)

  // Fetch unread count every 30s
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await api.get('/dashboard/summary')
        setCount(data.unread_alerts ?? 0)
      } catch (_) {}
    }
    fetchCount()
    const id = setInterval(fetchCount, 30_000)
    return () => clearInterval(id)
  }, [])

  // Fetch recent alerts when panel opens
  useEffect(() => {
    if (!open) return
    const fetchAlerts = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/alerts', { params: { per_page: 8 } })
        const items = Array.isArray(data) ? data : (data?.data ?? [])
        setAlerts(items)
      } catch (_) {}
      finally { setLoading(false) }
    }
    fetchAlerts()
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const markRead = async (alert) => {
    try {
      await api.patch(`/alerts/${alert.id}/read`)
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, is_read: true } : a))
      setCount(prev => Math.max(0, prev - 1))
    } catch (_) {}
  }

  const markAllRead = async () => {
    try {
      await api.post('/alerts/read-all')
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })))
      setCount(0)
    } catch (_) {}
  }

  return (
    <div className="relative" ref={panelRef}>

      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-all
          text-gray-500 hover:text-gray-700 hover:bg-gray-100
          dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
              {count > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </div>
            {count > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Alert list */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors
                    ${!alert.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {TYPE_ICON[alert.type] ?? '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!alert.is_read && (
                    <button
                      onClick={() => markRead(alert)}
                      title="Mark as read"
                      className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-green-500 hover:text-green-700 text-sm"
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <Link
              to="/alerts"
              onClick={() => setOpen(false)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View all alerts →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}