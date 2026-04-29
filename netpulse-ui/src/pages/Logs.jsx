import { useEffect, useState } from 'react'
import api from '../lib/api'
import { Button, Badge, Spinner, EmptyState } from '../components/ui'

export default function Logs() {
  const [devices,    setDevices]    = useState([])
  const [logs,       setLogs]       = useState([])
  const [meta,       setMeta]       = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [filters,    setFilters]    = useState({ device_id: '', status: '', from: '', to: '' })
  const [page,       setPage]       = useState(1)
  const [exporting,  setExporting]  = useState(false)

  // Load device list for filter dropdown
  useEffect(() => {
    api.get('/devices').then(r => setDevices(r.data.data)).catch(() => {})
  }, [])

  const fetchLogs = async (p = 1) => {
    if (!filters.device_id) return
    setLoading(true)
    try {
      const { data } = await api.get(`/devices/${filters.device_id}/logs`, {
        params: { ...filters, page: p, per_page: 50 },
      })
      setLogs(data.data)
      setMeta(data.meta)
      setPage(p)
    } catch (_) {}
    finally { setLoading(false) }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await api.get('/logs/export', {
        params: filters,
        responseType: 'blob',
      })
      const url  = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `netpulse-logs-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (_) {}
    finally { setExporting(false) }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monitoring Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Per-device history with date filters</p>
        </div>
        <Button variant="secondary" onClick={handleExport} loading={exporting}>
          ↓ Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Device *</label>
            <select
              value={filters.device_id}
              onChange={e => setFilters(f => ({ ...f, device_id: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select device...</option>
              {devices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.ip_address})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
            <select
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">From</label>
            <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">To</label>
            <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        <div className="mt-3">
          <Button onClick={() => fetchLogs(1)} disabled={!filters.device_id}>
            Search logs
          </Button>
        </div>
      </div>

      {/* Log table */}
      {loading
        ? <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        : logs.length === 0 && !loading
          ? <EmptyState icon="≡" title="No logs" description="Select a device and click Search logs." />
          : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                      {['#', 'Status', 'Latency', 'Checked at'].map(h => (
                        <th key={h} className="py-3 px-4 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={log.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-2.5 px-4 text-gray-400 text-xs">{log.id}</td>
                        <td className="py-2.5 px-4">
                          <Badge variant={log.status}>{log.status}</Badge>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-sm">
                          {log.latency_ms != null
                            ? <span className={log.latency_ms > 100 ? 'text-amber-500' : 'text-green-600 dark:text-green-400'}>{log.latency_ms}ms</span>
                            : <span className="text-gray-400">—</span>
                          }
                        </td>
                        <td className="py-2.5 px-4 text-gray-500 text-xs font-mono">
                          {new Date(log.checked_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm text-gray-500">
                  <span>Page {meta.current_page} of {meta.last_page} · {meta.total} entries</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => fetchLogs(page - 1)}>← Prev</Button>
                    <Button size="sm" variant="secondary" disabled={page >= meta.last_page} onClick={() => fetchLogs(page + 1)}>Next →</Button>
                  </div>
                </div>
              )}
            </div>
          )
      }
    </div>
  )
}