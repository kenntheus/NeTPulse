import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { PageHeader, LoadingPage, EmptyState, ToastContainer } from '../components/ui'
import useToast from '../hooks/useToast'

const TYPE_ICON = {
  router: '🌐', switch: '🔀', server: '🗄️', firewall: '🛡️', ap: '📡',
  phone: '📱', tablet: '📟', laptop: '💻', pc: '🖥️', cctv: '📷',
  printer: '🖨️', smarttv: '📺', other: '◈',
}

function statusOf(w) {
  const now = new Date()
  if (new Date(w.ends_at) < now)   return 'past'
  if (new Date(w.starts_at) < now) return 'active'
  return 'upcoming'
}

const STATUS_STYLE = {
  active:   { badge: 'bg-blue-900/50 text-blue-300',   label: 'Active' },
  upcoming: { badge: 'bg-amber-900/50 text-amber-300', label: 'Upcoming' },
  past:     { badge: 'bg-gray-800 text-gray-500',      label: 'Past' },
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function MaintenanceWindows() {
  const { toasts, addToast, removeToast } = useToast()

  const [windows,  setWindows]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [deleting, setDeleting] = useState(null)
  const [confirm,  setConfirm]  = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      const { data } = await api.get('/maintenance-windows')
      setWindows(data.data)
    } catch {
      addToast('Failed to load maintenance windows.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchAll() }, [fetchAll])

  const handleDelete = async (w) => {
    setConfirm(null)
    setDeleting(w.id)
    try {
      await api.delete(`/maintenance-windows/${w.id}`)
      setWindows(prev => prev.filter(x => x.id !== w.id))
      addToast('Maintenance window deleted.', 'success')
    } catch (err) {
      addToast(err?.response?.data?.message ?? 'Failed to delete.', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const visible = filter === 'all'
    ? windows
    : windows.filter(w => statusOf(w) === filter)

  const counts = {
    active:   windows.filter(w => statusOf(w) === 'active').length,
    upcoming: windows.filter(w => statusOf(w) === 'upcoming').length,
    past:     windows.filter(w => statusOf(w) === 'past').length,
  }

  if (loading) return <LoadingPage />

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Maintenance Windows"
        subtitle="Scheduled downtime across all devices — alerts are suppressed during active windows"
      />

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--muted-bg)' }}>
        {[
          { key: 'all',      label: `All (${windows.length})` },
          { key: 'active',   label: `Active (${counts.active})` },
          { key: 'upcoming', label: `Upcoming (${counts.upcoming})` },
          { key: 'past',     label: `Past (${counts.past})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === key ? 'text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
            style={filter === key ? { backgroundColor: 'var(--card-bg)' } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon="🛠️"
          title="No maintenance windows"
          description={filter === 'all'
            ? 'Schedule a maintenance window from the Devices page to suppress alerts during planned downtime.'
            : `No ${filter} windows.`
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map(w => {
            const st = STATUS_STYLE[statusOf(w)]
            return (
              <div
                key={w.id}
                className="rounded-xl border p-4 flex items-start justify-between gap-4"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: 'var(--muted-bg)' }}>
                    {TYPE_ICON[w.device?.type] ?? '◈'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <Link
                        to="/devices"
                        className="font-semibold text-white text-sm hover:underline"
                      >
                        {w.device?.name ?? 'Unknown device'}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${st.badge}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-gray-400 mb-1">{w.device?.ip_address}</p>
                    <p className="text-xs text-gray-400">
                      {fmt(w.starts_at)} → {fmt(w.ends_at)}
                    </p>
                    {w.reason && (
                      <p className="text-xs text-gray-500 mt-1 italic">"{w.reason}"</p>
                    )}
                    {w.creator && (
                      <p className="text-xs text-gray-600 mt-0.5">by {w.creator.name}</p>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {confirm === w.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Delete?</span>
                      <button onClick={() => handleDelete(w)}
                        className="text-xs text-red-400 hover:text-red-300 font-medium">Yes</button>
                      <button onClick={() => setConfirm(null)}
                        className="text-xs text-gray-500 hover:text-gray-300">No</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirm(w.id)}
                      disabled={deleting === w.id}
                      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
