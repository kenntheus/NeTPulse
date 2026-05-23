import { useState } from 'react'
import { useMaintenanceWindows } from '../../hooks/useMaintenanceWindows'
import { Modal, Button } from '../ui'

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function isActive(w) {
  const now = Date.now()
  return new Date(w.starts_at) <= now && new Date(w.ends_at) >= now
}

const QUICK_DURATIONS = [
  { label: '1 hour',   hours: 1 },
  { label: '4 hours',  hours: 4 },
  { label: '8 hours',  hours: 8 },
  { label: '24 hours', hours: 24 },
]

export default function MaintenanceWindowModal({ device, open, onClose }) {
  const { windows, loading, addWindow, removeWindow } = useMaintenanceWindows(open ? device.id : null)

  const [mode,     setMode]     = useState('quick')
  const [hours,    setHours]    = useState(1)
  const [startsAt, setStartsAt] = useState('')
  const [endsAt,   setEndsAt]   = useState('')
  const [reason,   setReason]   = useState('')
  const [saving,   setSaving]   = useState(false)

  const handleAdd = async () => {
    setSaving(true)
    try {
      let payload
      if (mode === 'quick') {
        const start = new Date()
        const end   = new Date(start.getTime() + hours * 3600 * 1000)
        payload = { starts_at: start.toISOString(), ends_at: end.toISOString(), reason: reason || null }
      } else {
        payload = { starts_at: new Date(startsAt).toISOString(), ends_at: new Date(endsAt).toISOString(), reason: reason || null }
      }
      await addWindow(payload)
      setReason('')
      setStartsAt('')
      setEndsAt('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Maintenance — ${device.name}`}>
      <div className="space-y-5">

        {/* Schedule new window */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Schedule window</p>

          <div className="flex gap-2">
            <button
              onClick={() => setMode('quick')}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${mode === 'quick' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--card-border)] text-gray-400'}`}
            >
              Quick
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${mode === 'custom' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--card-border)] text-gray-400'}`}
            >
              Custom
            </button>
          </div>

          {mode === 'quick' ? (
            <div className="flex flex-wrap gap-2">
              {QUICK_DURATIONS.map(d => (
                <button
                  key={d.hours}
                  onClick={() => setHours(d.hours)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${hours === d.hours ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--card-border)] text-gray-300 hover:border-[var(--accent)]'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Starts at</label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={e => setStartsAt(e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                  style={{ backgroundColor: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Ends at</label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={e => setEndsAt(e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                  style={{ backgroundColor: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}
                />
              </div>
            </div>
          )}

          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            style={{ backgroundColor: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}
          />

          <Button
            onClick={handleAdd}
            loading={saving}
            disabled={mode === 'custom' && (!startsAt || !endsAt)}
            className="w-full"
          >
            Schedule maintenance
          </Button>
        </div>

        {/* Existing windows */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Scheduled windows</p>
          {loading ? (
            <p className="text-xs text-gray-500 py-2">Loading…</p>
          ) : windows.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">No maintenance windows scheduled.</p>
          ) : (
            <ul className="space-y-2">
              {windows.map(w => (
                <li key={w.id} className="flex items-start justify-between gap-3 text-xs rounded-lg px-3 py-2.5 border"
                  style={{ backgroundColor: 'var(--muted-bg)', borderColor: isActive(w) ? 'var(--accent)' : 'var(--card-border)' }}>
                  <div className="min-w-0">
                    {isActive(w) && <span className="text-amber-400 font-semibold mr-1">● Active</span>}
                    <span className="text-gray-300">{fmt(w.starts_at)} → {fmt(w.ends_at)}</span>
                    {w.reason && <p className="text-gray-500 mt-0.5 truncate">{w.reason}</p>}
                  </div>
                  <button
                    onClick={() => removeWindow(w.id)}
                    className="text-red-400 hover:text-red-300 flex-shrink-0 mt-0.5"
                    title="Delete window"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
