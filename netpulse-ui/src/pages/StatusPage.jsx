import { useEffect, useState } from 'react'
import api from '../lib/api'

const TYPE_ICON = {
  router: '🌐', switch: '🔀', server: '🗄️', firewall: '🛡️', ap: '📡',
  phone: '📱', tablet: '📟', laptop: '💻', pc: '🖥️', cctv: '📷',
  printer: '🖨️', smarttv: '📺', other: '◈',
}

const OVERALL = {
  operational:   { icon: '✅', label: 'All systems operational',  bg: 'bg-green-950',  border: 'border-green-800',  text: 'text-green-400' },
  partial_outage:{ icon: '⚠️', label: 'Partial outage detected',  bg: 'bg-amber-950',  border: 'border-amber-800',  text: 'text-amber-400' },
  major_outage:  { icon: '🔴', label: 'Major outage in progress', bg: 'bg-red-950',    border: 'border-red-800',    text: 'text-red-400' },
}

const STATUS_DOT = {
  online:  'bg-green-500',
  offline: 'bg-red-500',
  unknown: 'bg-gray-500',
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function StatusPage() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    const load = () => {
      api.get('/status')
        .then(r => { setData(r.data); setError(false) })
        .catch(() => setError(true))
        .finally(() => setLoading(false))
    }
    load()
    const timer = setInterval(load, 30_000)
    return () => clearInterval(timer)
  }, [])

  const overall = data ? (OVERALL[data.overall] ?? OVERALL.operational) : null

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">N</div>
            <div>
              <span className="font-semibold tracking-tight text-sm">NeTPulse</span>
              <p className="text-gray-500 text-xs leading-none">Status Page</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live · refreshes every 30s
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Overall status banner */}
        {loading ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-gray-400 text-sm animate-pulse">
            Loading status…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-900 bg-red-950/30 p-6 text-center text-red-400 text-sm">
            Unable to load status. The monitoring service may be unreachable.
          </div>
        ) : (
          <>
            <div className={`rounded-xl border p-6 ${overall.bg} ${overall.border}`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{overall.icon}</span>
                <div>
                  <p className={`text-lg font-bold ${overall.text}`}>{overall.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Updated {timeAgo(data.generated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Online',  value: data.summary.online,  color: 'text-green-400' },
                { label: 'Offline', value: data.summary.offline, color: 'text-red-400' },
                { label: 'Unknown', value: data.summary.unknown, color: 'text-gray-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Device list */}
            {data.devices.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                No devices are being monitored yet.
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Devices ({data.devices.length})
                </h2>
                {data.devices.map(device => (
                  <div
                    key={device.id}
                    className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg shrink-0">{TYPE_ICON[device.type] ?? '◈'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{device.name}</p>
                        <p className="text-xs font-mono text-gray-500">{device.ip_address}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {device.latency_ms != null && (
                        <span className="text-xs font-mono text-gray-400">
                          {device.latency_ms} ms
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {timeAgo(device.last_checked_at)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[device.status] ?? STATUS_DOT.unknown}`} />
                        <span className="text-xs font-medium capitalize text-gray-300">
                          {device.status ?? 'unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-gray-800/60 py-6 px-6 text-center text-xs text-gray-600">
        Powered by NeTPulse
      </footer>
    </div>
  )
}
