import { useEffect, useState } from 'react'
import api from '../lib/api'
import { PageHeader, Badge, LoadingPage, StatCard } from '../components/ui'

const BEHAVIOUR_LABEL = {
  infrastructure:    { label: 'Infrastructure', color: 'blue',   icon: '🌐' },
  server:            { label: 'Server',          color: 'purple', icon: '🗄️' },
  personal_device:   { label: 'Personal Device', color: 'green',  icon: '📱' },
  smart_home:        { label: 'Smart Home',      color: 'amber',  icon: '📺' },
  unknown:           { label: 'Unknown',         color: 'gray',   icon: '❓' },
  insufficient_data: { label: 'Not enough data', color: 'gray',   icon: '⏳' },
}

const CONFIDENCE_COLOR = { high: 'success', medium: 'warning', low: 'offline', none: 'default' }

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AiInsights() {
  const [insights, setInsights] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('anomalies')

  useEffect(() => {
    api.get('/ai/insights')
      .then(r => setInsights(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingPage />

  const anomalies    = insights?.anomalies    ?? []
  const fingerprints = insights?.fingerprints ?? []
  const grouping     = insights?.grouping     ?? {}

  // Devices with high latency relative to their baseline
  const spiking = anomalies.filter(b =>
    b.current_ms && b.mean && b.stddev > 0 &&
    (b.current_ms - b.mean) / b.stddev > 1.5
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      <PageHeader
        title="AI Insights"
        subtitle="Anomaly detection · Device fingerprinting · Alert grouping"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Devices analysed" value={anomalies.length}    icon="🔬" color="blue" />
        <StatCard label="Anomalies now"     value={spiking.length}      icon="🔺" color={spiking.length > 0 ? 'red' : 'green'} />
        <StatCard label="Alert noise cut"   value={`${grouping.noise_reduced ?? 0}%`} icon="🔕" color="purple" />
        <StatCard label="Fingerprinted"     value={fingerprints.filter(f => f.behaviour !== 'insufficient_data').length} icon="🧬" color="amber" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--muted-bg)' }}>
        {[
          { id: 'anomalies',    label: '🔺 Anomalies' },
          { id: 'fingerprints', label: '🧬 Fingerprints' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
            style={tab === t.id ? { backgroundColor: 'var(--card-bg)' } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'anomalies' && (
        <div className="space-y-4">
          {anomalies.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🔬</p>
              <p className="font-medium">No baseline data yet</p>
              <p className="text-sm mt-1">Run the scheduler for a few minutes to build latency baselines</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {anomalies.map(b => {
                const z = b.current_ms && b.stddev > 0
                  ? ((b.current_ms - b.mean) / b.stddev).toFixed(1)
                  : null
                const isAnomalous = z && Math.abs(z) > 1.5
                return (
                  <div key={b.device_id}
                    className="rounded-xl border p-5"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: isAnomalous ? 'rgb(153 27 27)' : 'var(--card-border)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{b.device_name}</h3>
                        <p className="text-xs font-mono text-gray-500">{b.ip_address}</p>
                      </div>
                      {isAnomalous
                        ? <Badge variant="offline">⚠️ Anomaly Z={z}σ</Badge>
                        : <Badge variant="success">✓ Normal</Badge>
                      }
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      {[
                        { label: 'Avg latency', value: `${b.mean}ms` },
                        { label: 'Std dev',     value: `±${b.stddev}ms` },
                        { label: 'Samples',     value: b.count },
                        { label: 'Min',         value: `${b.min}ms` },
                        { label: 'Max',         value: `${b.max}ms` },
                        { label: 'Current',     value: b.current_ms ? `${b.current_ms}ms` : '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-lg p-2" style={{ backgroundColor: 'var(--muted-bg)' }}>
                          <p className="text-gray-400 mb-0.5">{label}</p>
                          <p className="font-mono font-semibold text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'fingerprints' && (
        <div className="space-y-4">
          {fingerprints.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🧬</p>
              <p className="font-medium">No fingerprint data yet</p>
              <p className="text-sm mt-1">Fingerprinting requires monitoring data from multiple devices</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {fingerprints.map(f => {
                const bh = BEHAVIOUR_LABEL[f.behaviour] ?? BEHAVIOUR_LABEL.unknown
                return (
                  <div key={f.device_id} className="rounded-xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{bh.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{f.device_name}</h3>
                          <p className="text-xs font-mono text-gray-500">{f.ip_address}</p>
                        </div>
                      </div>
                      <Badge variant={CONFIDENCE_COLOR[f.confidence] ?? 'default'}>
                        {f.confidence} confidence
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="default">{bh.label}</Badge>
                      {f.has_sleep_pattern && <Badge variant="viewer">💤 Sleeps at night</Badge>}
                      {f.suggested_type !== f.current_type && (
                        <Badge variant="warning">
                          Suggest: {f.suggested_type}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { label: 'Uptime',    value: f.uptime_pct != null ? `${f.uptime_pct}%` : '—' },
                        { label: 'Avg ms',    value: f.avg_latency_ms != null ? `${f.avg_latency_ms}ms` : '—' },
                        { label: 'Checks',    value: f.total_checks },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-lg p-2" style={{ backgroundColor: 'var(--muted-bg)' }}>
                          <p className="text-gray-400 mb-0.5">{label}</p>
                          <p className="font-mono font-semibold text-white">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Active hours mini chart */}
                    {f.active_hours && f.active_hours.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-1.5">Activity by hour (0–23)</p>
                        <div className="flex gap-px items-end h-8">
                          {f.active_hours.map((count, hour) => {
                            const max = Math.max(...f.active_hours, 1)
                            const h   = Math.round((count / max) * 100)
                            return (
                              <div key={hour} title={`${hour}:00 — ${count} checks online`}
                                className="flex-1 bg-blue-500 dark:bg-blue-600 rounded-sm opacity-80 hover:opacity-100 transition-opacity"
                                style={{ height: `${Math.max(h, 4)}%` }}
                              />
                            )
                          })}
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}