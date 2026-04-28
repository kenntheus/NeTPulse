import { useEffect, useState, useCallback } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../lib/api'
import { useEcho } from '../hooks/useEcho'

// Summary card component
function StatCard({ label, value, color }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    green:  'bg-green-50 text-green-700 border-green-200',
    red:    'bg-red-50 text-red-700 border-red-200',
    gray:   'bg-gray-50 text-gray-600 border-gray-200',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-70">{label}</p>
      <p className="text-4xl font-semibold mt-1">{value}</p>
    </div>
  )
}

// Device status row
function DeviceRow({ device }) {
  const statusDot = {
    online:  'bg-green-500',
    offline: 'bg-red-500',
    unknown: 'bg-gray-400',
  }
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="py-3 px-4">
        <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${statusDot[device.status]}`} />
        {device.name}
      </td>
      <td className="py-3 px-4 text-gray-500">{device.ip_address}</td>
      <td className="py-3 px-4 text-gray-500 capitalize">{device.type}</td>
      <td className="py-3 px-4 text-gray-500">{device.location}</td>
      <td className="py-3 px-4 font-mono">
        {device.latency_ms != null ? `${device.latency_ms} ms` : '—'}
      </td>
    </tr>
  )
}

export default function Dashboard() {
  const [summary, setSummary]           = useState({ total: 0, online: 0, offline: 0, unknown: 0 })
  const [devices, setDevices]           = useState([])
  const [latencyData, setLatencyData]   = useState([])
  const [uptimeData, setUptimeData]     = useState([])
  const [lastRefresh, setLastRefresh]   = useState(null)

  const fetchAll = useCallback(async () => {
    const [sum, devs, lat, upt] = await Promise.all([
      api.get('/dashboard/summary'),
      api.get('/devices'),
      api.get('/dashboard/latency-chart'),
      api.get('/dashboard/uptime-chart'),
    ])
    setSummary(sum.data)
    setDevices(devs.data.data)
    setLatencyData(lat.data)
    setUptimeData(upt.data)
    setLastRefresh(new Date())
  }, [])

  // Initial load + polling fallback (30s)
  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 30_000)
    return () => clearInterval(id)
  }, [fetchAll])

  // Real-time via WebSocket — update individual device row
  useEcho('network-monitoring', 'DeviceStatusUpdated', (event) => {
    setDevices(prev =>
      prev.map(d => d.id === event.device_id
        ? { ...d, status: event.status, latency_ms: event.latency_ms }
        : d
      )
    )
    // Re-fetch summary counts
    api.get('/dashboard/summary').then(r => setSummary(r.data))
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Network Overview</h1>
        {lastRefresh && (
          <p className="text-sm text-gray-400">
            Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total devices"   value={summary.total}   color="blue"  />
        <StatCard label="Online"          value={summary.online}  color="green" />
        <StatCard label="Offline"         value={summary.offline} color="red"   />
        <StatCard label="Unknown"         value={summary.unknown} color="gray"  />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-medium text-gray-500 mb-4">Avg latency — last 24h (ms)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={latencyData}>
              <defs>
                <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="avg_latency" stroke="#3b82f6" fill="url(#latGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-medium text-gray-500 mb-4">Uptime % — last 7 days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={uptimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="uptime" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Device table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-medium text-gray-700 dark:text-gray-300">Devices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">IP</th>
                <th className="py-3 px-4 text-left">Type</th>
                <th className="py-3 px-4 text-left">Location</th>
                <th className="py-3 px-4 text-left">Latency</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(d => <DeviceRow key={d.id} device={d} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}