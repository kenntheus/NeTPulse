import { useEffect, useState, useRef, useCallback } from 'react'
import api from '../lib/api'
import { LoadingPage, EmptyState, StatusDot, Badge } from '../components/ui'

const TYPE_ICON = {
  router: '🌐', switch: '🔀', server: '🗄️', firewall: '🛡️', ap: '📡',
  phone: '📱', tablet: '📟', laptop: '💻', pc: '🖥️', cctv: '📷',
  printer: '🖨️', smarttv: '📺', other: '◈',
}

const GATEWAY_TYPES  = new Set(['router', 'switch', 'firewall'])
const STATUS_COLOR   = { online: '#22c55e', offline: '#ef4444', unknown: '#6b7280' }

// ── Derive topology layers ────────────────────────────────────────────────────
function buildLayers(devices) {
  const gateways  = devices.filter(d => GATEWAY_TYPES.has(d.type))
  const endpoints = devices.filter(d => !GATEWAY_TYPES.has(d.type))

  // Group endpoints by subnet (first 3 octets of IP) closest to a gateway
  const subnetOf = ip => ip.split('.').slice(0, 3).join('.')
  const gatewayBySubnet = {}
  gateways.forEach(g => { gatewayBySubnet[subnetOf(g.ip_address)] = g.id })

  const edges = []
  endpoints.forEach(ep => {
    const sub = subnetOf(ep.ip_address)
    const gwId = gatewayBySubnet[sub] ?? gateways[0]?.id
    if (gwId) edges.push({ from: gwId, to: ep.id })
  })
  // Gateways connect to first gateway (as "internet uplink" if multiple)
  gateways.slice(1).forEach(g => edges.push({ from: gateways[0].id, to: g.id }))

  return { gateways, endpoints, edges }
}

// ── Node component ────────────────────────────────────────────────────────────
function Node({ device, x, y, selected, onClick }) {
  const color = STATUS_COLOR[device.status] ?? STATUS_COLOR.unknown
  return (
    <g transform={`translate(${x},${y})`} onClick={() => onClick(device)} className="cursor-pointer">
      <circle r={28} fill="var(--card-bg)" stroke={selected ? 'var(--accent)' : color} strokeWidth={selected ? 3 : 2} />
      <circle r={6} cx={18} cy={-18} fill={color} />
      <text textAnchor="middle" dominantBaseline="middle" fontSize={18} y={1}>{TYPE_ICON[device.type] ?? '◈'}</text>
      <text
        textAnchor="middle"
        dominantBaseline="hanging"
        fontSize={10}
        y={32}
        fill="var(--text-muted, #9ca3af)"
        style={{ pointerEvents: 'none' }}
      >
        {device.name.length > 14 ? device.name.slice(0, 13) + '…' : device.name}
      </text>
    </g>
  )
}

// ── Positions ─────────────────────────────────────────────────────────────────
function layout(gateways, endpoints, W, H) {
  const positions = {}
  const cx = W / 2
  const cy = H / 2

  // Gateways: arranged in a horizontal band near vertical center, left-biased
  const gwY = cy - 60
  gateways.forEach((g, i) => {
    const spread = Math.max(gateways.length - 1, 1)
    positions[g.id] = {
      x: cx + (i - spread / 2) * (W / (gateways.length + 1)),
      y: gwY,
    }
  })

  // Endpoints: semi-circle below gateways
  const radius = Math.min(W, H) * 0.34
  endpoints.forEach((ep, i) => {
    const angle = Math.PI * (i / Math.max(endpoints.length - 1, 1))
    positions[ep.id] = {
      x: cx + radius * Math.cos(Math.PI + angle),
      y: gwY + 140 + radius * 0.5 * Math.sin(angle),
    }
  })

  return positions
}

export default function TopologyMap() {
  const [devices,  setDevices]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const svgRef = useRef(null)
  const [size, setSize] = useState({ w: 900, h: 520 })

  const fetchDevices = useCallback(async () => {
    try {
      const { data } = await api.get('/devices')
      setDevices(data.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDevices() }, [fetchDevices])

  // Observe SVG container size
  useEffect(() => {
    const el = svgRef.current?.parentElement
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: Math.max(480, e.contentRect.width * 0.55) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (loading) return <LoadingPage />

  if (devices.length === 0) {
    return (
      <div className="p-6">
        <EmptyState icon="🗺️" title="No devices" description="Add devices to see the topology map." />
      </div>
    )
  }

  const { gateways, endpoints, edges } = buildLayers(devices)
  const pos = layout(gateways, endpoints, size.w, size.h)

  return (
    <div className="p-6 space-y-4 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Network Topology</h1>
          <p className="text-xs text-gray-400 mt-0.5">{devices.length} device{devices.length !== 1 ? 's' : ''} — click a node for details</p>
        </div>
        <button onClick={fetchDevices} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
        {Object.entries(STATUS_COLOR).map(([s, c]) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c }} />
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        ))}
        <span className="flex items-center gap-1.5 ml-4">
          <span className="inline-block w-6 border-t-2 border-dashed border-gray-600" />
          Network link
        </span>
      </div>

      {/* SVG canvas */}
      <div
        className="rounded-xl border w-full relative"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <svg ref={svgRef} width="100%" height={size.h} className="block">
          {/* Edges */}
          {edges.map((e, i) => {
            const f = pos[e.from], t = pos[e.to]
            if (!f || !t) return null
            return (
              <line
                key={i}
                x1={f.x} y1={f.y}
                x2={t.x} y2={t.y}
                stroke="var(--card-border)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
            )
          })}

          {/* Internet cloud icon above first gateway */}
          {gateways[0] && pos[gateways[0].id] && (
            <>
              <text
                x={pos[gateways[0].id].x}
                y={pos[gateways[0].id].y - 65}
                textAnchor="middle"
                fontSize={28}
              >☁️</text>
              <line
                x1={pos[gateways[0].id].x} y1={pos[gateways[0].id].y - 38}
                x2={pos[gateways[0].id].x} y2={pos[gateways[0].id].y - 28}
                stroke="var(--card-border)" strokeWidth={1.5} strokeDasharray="4 3"
              />
            </>
          )}

          {/* Nodes */}
          {devices.map(d => {
            const p = pos[d.id]
            if (!p) return null
            return (
              <Node
                key={d.id}
                device={d}
                x={p.x}
                y={p.y}
                selected={selected?.id === d.id}
                onClick={setSelected}
              />
            )
          })}
        </svg>
      </div>

      {/* Device detail panel */}
      {selected && (
        <div
          className="rounded-xl border p-4 flex items-start gap-4"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: 'var(--muted-bg)' }}>
            {TYPE_ICON[selected.type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white text-sm">{selected.name}</h3>
              <StatusDot status={selected.status} animate />
              <Badge variant={selected.status} className="capitalize">{selected.status}</Badge>
              {selected.latency_ms != null && (
                <span className="text-xs font-mono text-gray-400">{selected.latency_ms} ms</span>
              )}
            </div>
            <p className="text-xs font-mono text-gray-400 mt-0.5">{selected.ip_address}</p>
            {selected.location && <p className="text-xs text-gray-500 mt-1">📍 {selected.location}</p>}
            {selected.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{selected.description}</p>}
          </div>
          <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-lg leading-none flex-shrink-0">×</button>
        </div>
      )}
    </div>
  )
}
