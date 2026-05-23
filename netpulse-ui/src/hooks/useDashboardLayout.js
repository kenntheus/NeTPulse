import { useState, useCallback } from 'react'

const STORAGE_KEY = 'netpulse_dashboard_layout'

const DEFAULTS = {
  summary:  { label: 'Summary cards',   visible: true },
  latency:  { label: 'Latency chart',   visible: true },
  uptime:   { label: 'Uptime chart',    visible: true },
  devices:  { label: 'Devices table',   visible: true },
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const saved = JSON.parse(raw)
    // Merge saved with defaults so new widgets appear visible by default
    return Object.fromEntries(
      Object.entries(DEFAULTS).map(([k, def]) => [k, { ...def, ...(saved[k] ?? {}) }])
    )
  } catch {
    return DEFAULTS
  }
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState(load)

  const toggle = useCallback((key) => {
    setLayout(prev => {
      const next = { ...prev, [key]: { ...prev[key], visible: !prev[key].visible } }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const show = (key) => layout[key]?.visible ?? true

  return { layout, toggle, show }
}
