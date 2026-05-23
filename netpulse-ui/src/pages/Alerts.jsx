import { useEffect, useState } from 'react'
import api from '../lib/api'
import AlertList from '../components/alerts/AlertList'
import useToast from '../hooks/useToast'
import {
  Button, PageHeader, LoadingPage, ToastContainer,
} from '../components/ui'

export default function Alerts() {
  const [alerts,     setAlerts]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page,       setPage]       = useState(1)
  const [meta,       setMeta]       = useState(null)
  const { toasts, addToast, removeToast } = useToast()

  const fetchAlerts = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get('/alerts', {
        params: { ...(unreadOnly ? { unread: 1 } : {}), page: p, per_page: 20 },
      })

      // Handle both paginated {data:[]} and plain [] responses safely
      const items = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
      setAlerts(items)
      setMeta(data?.meta ?? null)
      setPage(p)
    } catch {
      addToast('Failed to load alerts.', 'error')
      setAlerts([]) // prevent map crash
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchAlerts(1) }, [unreadOnly])

  const handleMarkRead = async (alert) => {
    try {
      await api.patch(`/alerts/${alert.id}/read`)
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, is_read: true } : a))
    } catch {
      addToast('Failed to mark as read.', 'error')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.post('/alerts/read-all')
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })))
      addToast('All alerts marked as read.', 'success')
    } catch {
      addToast('Failed.', 'error')
    }
  }

  const handleAcknowledge = async (alert) => {
    try {
      await api.patch(`/alerts/${alert.id}/acknowledge`)
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, acknowledged_at: new Date().toISOString() } : a))
    } catch {
      addToast('Failed to acknowledge.', 'error')
    }
  }

  const handleUnacknowledge = async (alert) => {
    try {
      await api.patch(`/alerts/${alert.id}/unacknowledge`)
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, acknowledged_at: null } : a))
    } catch {
      addToast('Failed to unacknowledge.', 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/alerts/${id}`)
      setAlerts(prev => prev.filter(a => a.id !== id))
      addToast('Alert deleted.', 'success')
    } catch {
      addToast('Failed to delete.', 'error')
    }
  }

  const unreadCount = alerts.filter(a => !a.is_read).length

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Alerts
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </span>
        }
        subtitle="Device status change events and notifications"
        action={
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={e => setUnreadOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600"
              />
              Unread only
            </label>
            {unreadCount > 0 && (
              <Button size="sm" variant="secondary" onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            )}
          </div>
        }
      />

      {loading
        ? <LoadingPage />
        : <AlertList
            alerts={alerts}
            onMarkRead={handleMarkRead}
            onAcknowledge={handleAcknowledge}
            onUnacknowledge={handleUnacknowledge}
            onDelete={handleDelete}
          />
      }

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between pt-2 text-sm text-gray-500">
          <span>Page {meta.current_page} of {meta.last_page} · {meta.total} total</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => fetchAlerts(page - 1)}>
              ← Prev
            </Button>
            <Button size="sm" variant="secondary" disabled={page >= meta.last_page} onClick={() => fetchAlerts(page + 1)}>
              Next →
            </Button>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}