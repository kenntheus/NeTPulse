import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import api from '../lib/api'
import { useEcho }            from '../hooks/useEcho'
import { useDevices }         from '../hooks/useDevices'
import { useDashboardLayout } from '../hooks/useDashboardLayout'
import { StatCard, Badge, StatusDot, LoadingPage } from '../components/ui'

const TYPE_ICON = { router: '🌐', switch: '🔀', server: '🗄️', firewall: '🛡️', ap: '📡', phone: '📱', tablet: '📟', laptop: '💻', pc: '🖥️', cctv: '📷', printer: '🖨️', smarttv: '📺', other: '◈' }

// ── Custom tooltip for charts ─────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 shadow-lg text-xs border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-semibold text-gray-900 dark:text-white">{payload[0].value}{payload[0].name.includes('uptime') ? '%' : ' ms'}</p>
    </div>
  )
}

export default function Dashboard() {
  const [summary,     setSummary]     = useState(null)
  const [latency,     setLatency]     = useState([])
  const [uptime,      setUptime]      = useState([])
  const [lastRefresh, setLastRefresh] = useState(null)
  const [chartLoading, setChartLoading] = useState(true)
  const [customizing,  setCustomizing]  = useState(false)

  const { layout, toggle, show } = useDashboardLayout()
  const { devices, loading: devicesLoading, applyRealtimeUpdate } = useDevices()

  const fetchStats = useCallback(async () => {
    try {
      const [sum, lat, upt] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/latency-chart'),
        api.get('/dashboard/uptime-chart'),
      ])
      setSummary(sum.data)
      setLatency(lat.data)
      setUptime(upt.data)
      setLastRefresh(new Date())
    } catch { /* noop */ }
    finally { setChartLoading(false) }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats()
    const id = setInterval(fetchStats, 30_000)
    return () => clearInterval(id)
  }, [fetchStats])

  // Real-time WebSocket updates
  useEcho('network-monitoring', 'DeviceStatusUpdated', (event) => {
    applyRealtimeUpdate(event)
    api.get('/dashboard/summary').then(r => setSummary(r.data)).catch(() => {})
  })

  if (devicesLoading && !summary) return <LoadingPage />

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">

      {/* ── Header row ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          {lastRefresh && <p className="text-xs text-gray-400 mt-0.5">Updated {lastRefresh.toLocaleTimeString()}</p>}
        </div>
        <button
          onClick={() => setCustomizing(c => !c)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border ${
            customizing
              ? 'text-white border-[var(--accent)] bg-[var(--accent)]'
              : 'text-gray-400 border-[var(--card-border)] hover:text-white hover:bg-white/10'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Customize
        </button>
      </div>

      {/* ── Widget toggle panel ────────────────────────────────────── */}
      {customizing && (
        <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Show / hide widgets</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(layout).map(([key, { label, visible }]) => (
              <button
                key={key}
                onClick={() => toggle(key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  visible
                    ? 'text-white bg-[var(--accent)]/20 border-[var(--accent)]/40'
                    : 'text-gray-500 bg-transparent border-[var(--card-border)] hover:border-gray-500'
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${visible ? 'bg-[var(--accent)]' : 'bg-gray-600'}`} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Summary cards ─────────────────────────────────────────── */}
      {show('summary') && <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total devices"  value={summary?.total}         icon="⬡" color="blue"  />
        <StatCard label="Online"          value={summary?.online}        icon="🟢" color="green" />
        <StatCard label="Offline"         value={summary?.offline}       icon="🔴" color="red"   />
        <StatCard label="Unread alerts"   value={summary?.unread_alerts} icon="⚑" color="amber" />
      </div>}

      {/* ── Charts ────────────────────────────────────────────────── */}
      {(show('latency') || show('uptime')) && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Latency area chart */}
        {show('latency') && <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Avg Latency</h3>
              <p className="text-xs text-gray-500">Last 24 hours (ms)</p>
            </div>
            <Badge variant="default">Live</Badge>
          </div>
          {chartLoading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading chart…</div>
          ) : latency.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet — waiting for first ping</div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={latency} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-800" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="avg_latency"
                  name="avg_latency"
                  stroke="#3b82f6"
                  fill="url(#latGrad)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Uptime bar chart */}
        {show('uptime') && <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Uptime %</h3>
              <p className="text-xs text-gray-500">Last 7 days</p>
            </div>
          </div>
          {chartLoading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading chart…</div>
          ) : uptime.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={uptime} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-800" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="uptime" name="uptime" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>}
      </div>}

      {/* ── Device table ──────────────────────────────────────────── */}
      {show('devices') && <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">All Devices</h3>
          <span className="text-xs text-gray-400 px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--muted-bg)' }}>{devices.length} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider" style={{ backgroundColor: 'var(--muted-bg)' }}>
                {['Status', 'Name', 'IP Address', 'Type', 'Location', 'Latency', 'Last Check'].map(h => (
                  <th key={h} className="py-3 px-4 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {devices.map(d => (
                <tr key={d.id} className="hover:bg-[var(--muted-bg)] transition-colors">
                  <td className="py-3 px-4">
                    <StatusDot status={d.status} animate />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base" title={d.type}>{TYPE_ICON[d.type] ?? '◈'}</span>
                      <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">{d.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-300 whitespace-nowrap">{d.ip_address}</td>
                  <td className="py-3 px-4">
                    <Badge variant="default" className="capitalize">{d.type}</Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">{d.location || '—'}</td>
                  <td className="py-3 px-4 font-mono whitespace-nowrap">
                    {d.latency_ms != null ? (
                      <span className={d.latency_ms > 100 ? 'text-amber-500' : 'text-green-600 dark:text-green-400'}>
                        {d.latency_ms} ms
                      </span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-3 px-4 text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">
                    {d.last_checked_at ? new Date(d.last_checked_at).toLocaleTimeString() : '—'}
                  </td>
                </tr>
              ))}
              {devices.length === 0 && !devicesLoading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    No devices found. Add your first device in the Devices page.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>}
    </div>
  )
}