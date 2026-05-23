import { Badge, EmptyState } from '../ui'

const TYPE_CONFIG = {
  offline:      { badge: 'offline',  icon: '🔴', label: 'Offline'       },
  recovered:    { badge: 'success',  icon: '🟢', label: 'Recovered'     },
  high_latency: { badge: 'warning',  icon: '⚠️', label: 'High Latency'  },
}

/**
 * AlertList — renders a list of alert objects.
 *
 * Props:
 *   alerts      Alert[]   array of alert objects
 *   onMarkRead  fn(alert) called when user clicks "mark read"
 *   onDelete    fn(id)    called when user clicks delete
 *   compact     bool      smaller padding, no device name (for widgets)
 */
export default function AlertList({ alerts = [], onMarkRead, onDelete, onAcknowledge, onUnacknowledge, compact = false }) {
  if (!alerts.length) {
    return (
      <EmptyState
        icon="🔔"
        title="No alerts"
        description="All clear — no device alerts to display."
      />
    )
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert) => {
        const cfg = TYPE_CONFIG[alert.type] ?? TYPE_CONFIG.offline

        return (
          <li
            key={alert.id}
            className={[
              'flex items-start gap-3 rounded-xl border transition-all',
              compact ? 'px-4 py-3' : 'px-5 py-4',
              alert.acknowledged_at ? 'opacity-50' : !alert.is_read ? 'border-blue-800 bg-blue-900/10' : 'opacity-60',
            ].join(' ')}
            style={alert.is_read || alert.acknowledged_at ? { backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' } : undefined}
          >
            {/* Icon */}
            <span className="text-lg flex-shrink-0 mt-0.5" role="img" aria-label={cfg.label}>
              {cfg.icon}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <Badge variant={cfg.badge}>{cfg.label}</Badge>

                {/* Unread dot */}
                {!alert.is_read && !alert.acknowledged_at && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                )}

                {/* Acknowledged badge */}
                {alert.acknowledged_at && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ✓ Acknowledged
                  </span>
                )}

                {/* Device name — shown when not compact */}
                {!compact && alert.device && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                    {alert.device.name}
                    <span className="font-mono text-gray-400 ml-1">({alert.device.ip_address})</span>
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                {alert.message}
              </p>

              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {new Date(alert.created_at).toLocaleString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {!alert.is_read && onMarkRead && (
                <button
                  onClick={() => onMarkRead(alert)}
                  title="Mark as read"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all text-sm"
                >
                  ✓
                </button>
              )}
              {!alert.acknowledged_at && onAcknowledge && (
                <button
                  onClick={() => onAcknowledge(alert)}
                  title="Acknowledge — I've seen and actioned this"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-sm font-bold"
                >
                  ✔
                </button>
              )}
              {alert.acknowledged_at && onUnacknowledge && (
                <button
                  onClick={() => onUnacknowledge(alert)}
                  title="Unacknowledge"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all text-sm"
                >
                  ↩
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(alert.id)}
                  title="Delete alert"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-base leading-none"
                >
                  ×
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}