import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import api from '../lib/api'
import { useEcho } from '../hooks/useEcho'
//import { StatusDot, Badge, Spinner } from '../components/ui'

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }) {
  const colors = {
    blue:  'from-blue-50 to-blue-50/30 border-blue-200 text-blue-700 dark:from-blue-900/20 dark:to-transparent dark:border-blue-800 dark:text-blue-400',
    green: 'from-green-50 to-green-50/30 border-green-200 text-green-700 dark:from-green-900/20 dark:to-transparent dark:border-green-800 dark:text-green-400',
    red:   'from-red-50 to-red-50/30 border-red-200 text-red-700 dark:from-red-900/20 dark:to-transparent dark:border-red-800 dark:text-red-400',
    gray:  'from-gray-50 to-gray-50/30 border-gray-200 text-gray-600 dark:from-gray-800/40 dark:to-transparent dark:border-gray-700 dark:text-gray-400',
  }
  return (
    <div className={`bg-linear-to-br rounded-xl border p-5 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium opacity-70 uppercase tracking-wider">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-4xl font-bold">{value ?? '—'}</p>
    </div>
  )
}

const DEVICE_TYPE_ICON = { router: '⬡', switch: '⬢', server: '▣', firewall: '⬛', ap: '◎', other: '◈' }

// ── Dashboard page ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [summary,     setSummary]     = useState(null)
  const [devices,     setDevices]     = useState([])
  const [latency,     setLatency]     = useState([])
  const [uptime,      setUptime]      = useState([])
  const [lastRefresh, setLastRefresh] = useState(null)
  const [loading,     setLoading]     = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const [sum, devs, lat, upt] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/devices'),
        api.get('/dashboard/latency-chart'),
        api.get('/dashboard/uptime-chart'),
      ])
      setSummary(sum.data)
      setDevices(devs.data.data)
      setLatency(lat.data)
      setUptime(upt.data)
      setLastRefresh(new Date())
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 30_000)
    return () => clearInterval(id)
  }, [fetchAll])

  // Real-time WebSocket updates
  useEcho('network-monitoring', 'DeviceStatusUpdated', (event) => {
    setDevices(prev =>
      prev.map(d => d.id === event.device_id
        ? { ...d, status: event.status, latency_ms: event.latency_ms, last_checked_at: event.checked_at }
        : d
      )
    )
    api.get('/dashboard/summary').then(r => setSummary(r.data)).catch(() => {})
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Network overview · auto-refresh every 30s
          </p>
        </div>
        {lastRefresh && (
          <p className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
            Updated {lastRefresh.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total devices" value={summary?.total}   color="blue"  icon="⬡" />
        <StatCard label="Online"         value={summary?.online}  color="green" icon="🟢" />
        <StatCard label="Offline"        value={summary?.offline} color="red"   icon="🔴" />
        <StatCard label="Unread alerts"  value={summary?.unread_alerts} color="gray" icon="⚑" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Avg latency (ms) — last 24h</h2>
          {latency.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
            : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={latency}>
                  <defs>
                    <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="avg_latency" stroke="#3b82f6" fill="url(#lg)" strokeWidth={2} dot={false} name="Latency (ms)" />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Uptime % — last 7 days</h2>
          {uptime.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
            : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={uptime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${v}%`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="uptime" fill="#22c55e" radius={[4, 4, 0, 0]} name="Uptime %" />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* Device table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">All devices</h2>
          <span className="text-xs text-gray-400">{devices.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                {['Status', 'Name', 'IP Address', 'Type', 'Location', 'Latency', 'Last check'].map(h => (
                  <th key={h} className="py-3 px-4 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.map(d => (
                <tr key={d.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <StatusDot status={d.status} animate />
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-base" title={d.type}>{DEVICE_TYPE_ICON[d.type]}</span>
                      {d.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-300">{d.ip_address}</td>
                  <td className="py-3 px-4">
                    <Badge variant="default">{d.type}</Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{d.location || '—'}</td>
                  <td className="py-3 px-4 font-mono">
                    {d.latency_ms != null
                      ? <span className={d.latency_ms > 100 ? 'text-amber-500' : 'text-green-600 dark:text-green-400'}>{d.latency_ms}ms</span>
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {d.last_checked_at ? new Date(d.last_checked_at).toLocaleTimeString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}