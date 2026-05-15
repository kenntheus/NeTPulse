import { useEffect, useState, useRef } from 'react'
import api from '../lib/api'
import { PageHeader, Card, Badge, LoadingPage, StatCard } from '../components/ui'

const BEHAVIOUR_LABEL = {
  infrastructure:    { label: 'Infrastructure', color: 'blue',   icon: '🌐' },
  server:            { label: 'Server',          color: 'purple', icon: '🗄️' },
  personal_device:   { label: 'Personal Device', color: 'green',  icon: '📱' },
  smart_home:        { label: 'Smart Home',      color: 'amber',  icon: '📺' },
  unknown:           { label: 'Unknown',         color: 'gray',   icon: '❓' },
  insufficient_data: { label: 'Not enough data', color: 'gray',   icon: '⏳' },
}

const CONFIDENCE_COLOR = { high: 'success', medium: 'warning', low: 'offline', none: 'default' }

// ── Chat widget ───────────────────────────────────────────────────────────────
function AiChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "👋 Hi! I'm NetPulse AI. Ask me anything about your network — device health, latency trends, anomalies, or recommendations." }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const history = messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0)
      const { data } = await api.post('/ai/chat', { message: userMsg, history })
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (_) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Failed to get a response. Check your API key in .env.' }])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    "Which device has the worst uptime?",
    "Is my network healthy?",
    "Any anomalies detected?",
    "What devices are offline?",
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col h-[500px]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
          AI
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">NetPulse AI Assistant</h3>
          <p className="text-xs text-gray-500">Powered by Gemini 2.0 Flash Lite · Real network context</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live data
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-0.5">
                AI
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">
              AI
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {suggestions.map(s => (
            <button key={s} onClick={() => setInput(s)}
              className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1.5 rounded-full transition-colors border border-gray-200 dark:border-gray-700">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about your network…"
          disabled={loading}
          className="flex-1 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AiInsights() {
  const [insights, setInsights] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('chat')

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
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">

      <PageHeader
        title="AI Insights"
        subtitle="Anomaly detection · Device fingerprinting · Alert grouping · AI assistant"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Devices analysed" value={anomalies.length}    icon="🔬" color="blue" />
        <StatCard label="Anomalies now"     value={spiking.length}      icon="🔺" color={spiking.length > 0 ? 'red' : 'green'} />
        <StatCard label="Alert noise cut"   value={`${grouping.noise_reduced ?? 0}%`} icon="🔕" color="purple" />
        <StatCard label="Fingerprinted"     value={fingerprints.filter(f => f.behaviour !== 'insufficient_data').length} icon="🧬" color="amber" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {[
          { id: 'chat',         label: '💬 AI Assistant' },
          { id: 'anomalies',    label: '🔺 Anomalies' },
          { id: 'fingerprints', label: '🧬 Fingerprints' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'chat' && <AiChat />}

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
                    className={`bg-white dark:bg-gray-900 rounded-xl border p-5 ${
                      isAnomalous
                        ? 'border-red-300 dark:border-red-800'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}>
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
                        <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                          <p className="text-gray-400 mb-0.5">{label}</p>
                          <p className="font-mono font-semibold text-gray-900 dark:text-white">{value}</p>
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
                  <div key={f.device_id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
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
                        <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                          <p className="text-gray-400 mb-0.5">{label}</p>
                          <p className="font-mono font-semibold text-gray-900 dark:text-white">{value}</p>
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