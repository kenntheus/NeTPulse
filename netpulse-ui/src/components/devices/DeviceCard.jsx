import { useState } from 'react'
import { Badge, StatusDot, Button, IconButton } from '../ui'

const TYPE_ICON = {
  router:   '🌐',
  switch:   '🔀',
  server:   '🗄️',
  firewall: '🛡️',
  ap:       '📡',
  phone:    '📱',
  tablet:   '📟',
  laptop:   '💻',
  pc:       '🖥️',
  cctv:     '📷',
  printer:  '🖨️',
  smarttv:  '📺',
  other:    '◈',
}

const TYPE_LABEL = {
  router: 'Router', switch: 'Switch', server: 'Server', firewall: 'Firewall',
  ap: 'Access Point', phone: 'Phone', tablet: 'Tablet', laptop: 'Laptop',
  pc: 'Desktop PC', cctv: 'CCTV', printer: 'Printer', smarttv: 'Smart TV', other: 'Other',
}

export default function DeviceCard({ device, onEdit, onDelete, onPing, isAdmin = false }) {
  const [pinging, setPinging] = useState(false)

  const handlePing = async () => {
    setPinging(true)
    try { await onPing(device) } finally { setPinging(false) }
  }

  const latencyColor = device.latency_ms == null ? 'text-gray-400'
    : device.latency_ms > 150 ? 'text-red-500'
    : device.latency_ms > 80  ? 'text-amber-500'
    : 'text-green-600 dark:text-green-400'

  return (
    <div className="group rounded-xl border p-5 flex flex-col gap-4 hover:shadow-md transition-all duration-200" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: 'var(--muted-bg)' }}>
            {TYPE_ICON[device.type] ?? TYPE_ICON.other}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate" title={device.name}>
              {device.name}
            </h3>
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{device.ip_address}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusDot status={device.status} animate />
          <Badge variant={device.status} className="capitalize">{device.status}</Badge>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <p className="text-gray-400 dark:text-gray-500 mb-0.5">Type</p>
          <p className="font-medium text-gray-700 dark:text-gray-300">{TYPE_LABEL[device.type] ?? 'Other'}</p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500 mb-0.5">Location</p>
          <p className="font-medium text-gray-700 dark:text-gray-300 truncate">{device.location || '—'}</p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500 mb-0.5">Latency</p>
          <p className={`font-mono font-semibold ${latencyColor}`}>
            {device.latency_ms != null ? `${device.latency_ms} ms` : '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500 mb-0.5">Last check</p>
          <p className="font-medium text-gray-600 dark:text-gray-400">
            {device.last_checked_at
              ? new Date(device.last_checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '—'}
          </p>
        </div>
      </div>

      {(device.description || device.notes) && (
        <div className="border-t pt-3 -mt-1 space-y-1.5" style={{ borderColor: 'var(--card-border)' }}>
          {device.description && (
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{device.description}</p>
          )}
          {device.notes && (
            <div className="flex items-start gap-1.5">
              <span className="text-amber-500 text-xs mt-0.5 flex-shrink-0">📝</span>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed line-clamp-2">{device.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t mt-auto" style={{ borderColor: 'var(--card-border)' }}>
        <Button size="sm" variant="secondary" loading={pinging} onClick={handlePing} className="flex-1">
          {!pinging && (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          Ping
        </Button>
        {isAdmin && (
          <>
            <IconButton
              icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
              onClick={() => onEdit(device)}
              title="Edit device"
              variant="secondary"
            />
            <IconButton
              icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
              onClick={() => onDelete(device)}
              title="Delete device"
              variant="ghost"
              className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            />
          </>
        )}
      </div>
    </div>
  )
}