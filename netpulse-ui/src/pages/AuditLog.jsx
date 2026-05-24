import { useEffect, useState, useCallback } from 'react'
import api from '../lib/api'
import { PageHeader, LoadingPage, EmptyState } from '../components/ui'

const ACTION_LABELS = {
  'auth.login':    { label: 'Login',          icon: '🔑', color: 'text-green-400' },
  'auth.logout':   { label: 'Logout',         icon: '🚪', color: 'text-gray-400' },
  'device.created': { label: 'Device added',  icon: '➕', color: 'text-blue-400' },
  'device.updated': { label: 'Device edited', icon: '✏️', color: 'text-amber-400' },
  'device.deleted': { label: 'Device deleted',icon: '🗑️', color: 'text-red-400' },
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function AuditLog() {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [meta,    setMeta]    = useState(null)

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get('/audit-logs', { params: { page: p } })
      setLogs(data.data)
      setMeta(data)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchLogs(page) }, [fetchLogs, page])

  return (
    <div className="p-6 max-w-screen-lg mx-auto space-y-6">
      <PageHeader
        title="Audit Log"
        subtitle="A record of all significant actions in NeTPulse"
      />

      {loading ? (
        <LoadingPage />
      ) : logs.length === 0 ? (
        <EmptyState icon="📋" title="No audit events yet" description="Actions like logins and device changes will appear here." />
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--muted-bg)' }}>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Target</th>
                <th className="px-4 py-3 text-left">IP</th>
                <th className="px-4 py-3 text-left">When</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
              {logs.map(log => {
                const meta = ACTION_LABELS[log.action] ?? { label: log.action, icon: '•', color: 'text-gray-300' }
                return (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`font-medium ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {log.user ? (
                        <div>
                          <p className="font-medium text-white text-xs">{log.user.name}</p>
                          <p className="text-gray-500 text-xs">{log.user.email}</p>
                        </div>
                      ) : <span className="text-gray-500">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {log.entity_label
                        ? <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">{log.entity_label}</span>
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{log.ip_address ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs" title={new Date(log.created_at).toLocaleString()}>
                      {timeAgo(log.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-gray-400" style={{ borderColor: 'var(--card-border)' }}>
              <span>{meta.total} events total</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-white/10 transition-colors"
                  style={{ borderColor: 'var(--card-border)' }}
                >
                  ← Prev
                </button>
                <span className="px-2 py-1">Page {page} of {meta.last_page}</span>
                <button
                  onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                  disabled={page === meta.last_page}
                  className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-white/10 transition-colors"
                  style={{ borderColor: 'var(--card-border)' }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
