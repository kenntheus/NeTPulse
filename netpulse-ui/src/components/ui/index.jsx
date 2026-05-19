import { useEffect } from 'react'

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <svg className={`animate-spin ${sizes[size] ?? sizes.md} text-current`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ variant = 'default', children, className = '' }) {
  const variants = {
    online:  'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    offline: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    unknown: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    admin:   'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    viewer:  'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    danger:  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variants[variant] ?? variants.default} ${className}`}>
      {children}
    </span>
  )
}

// ── StatusDot ─────────────────────────────────────────────────────────────────
export function StatusDot({ status, animate = false }) {
  const colors = { online: 'bg-green-500', offline: 'bg-red-500', unknown: 'bg-gray-400' }
  const col = colors[status] ?? colors.unknown
  return (
    <span className="relative inline-flex items-center justify-center w-4 h-4 flex-shrink-0">
      <span className={`w-2.5 h-2.5 rounded-full ${col}`} />
      {animate && status === 'online' && (
        <span className={`absolute inset-0 rounded-full ${col} animate-ping opacity-50`} />
      )}
    </span>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ variant = 'primary', size = 'md', loading = false, disabled = false, children, className = '', type = 'button', onClick, title, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none'
  const sizes = { xs: 'px-2.5 py-1 text-xs', sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' }
  const variants = {
    primary:   'text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] focus:ring-[var(--accent)]',
    secondary: 'text-gray-200 border border-[var(--card-border)] bg-[var(--card-bg)] hover:bg-[var(--muted-bg)] focus:ring-gray-400',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost:     'text-gray-300 hover:bg-[var(--muted-bg)] focus:ring-gray-400',
    success:   'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning:   'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400',
  }
  return (
    <button type={type} disabled={disabled || loading} onClick={onClick} title={title}
      className={`${base} ${sizes[size] ?? sizes.md} ${variants[variant] ?? variants.primary} ${className}`} {...props}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}

// ── IconButton ────────────────────────────────────────────────────────────────
export function IconButton({ icon, onClick, title, variant = 'ghost', size = 'sm', loading = false, disabled = false, className = '' }) {
  return (
    <Button variant={variant} size={size} onClick={onClick} title={title} loading={loading} disabled={disabled}
      className={`aspect-square !px-0 w-8 h-8 ${className}`}>
      {!loading && <span className="text-sm leading-none">{icon}</span>}
    </Button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, className = '', type = 'text', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>}
      <input type={type}
        className={`w-full border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-colors ${error ? 'border-red-400' : 'border-[var(--card-border)] focus:border-[var(--accent)]'} ${className}`}
        style={{ backgroundColor: 'var(--muted-bg)' }}
        {...props} />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>}
      <select
        className={`w-full border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-colors ${error ? 'border-red-400' : 'border-[var(--card-border)] focus:border-[var(--accent)]'} ${className}`}
        style={{ backgroundColor: 'var(--muted-bg)' }}
        {...props}>
        {children}
      </select>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({ label, error, className = '', rows = 3, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>}
      <textarea rows={rows}
        className={`w-full border rounded-lg px-3 py-2 text-sm resize-none text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-colors ${error ? 'border-red-400' : 'border-[var(--card-border)]'} ${className}`}
        style={{ backgroundColor: 'var(--muted-bg)' }}
        {...props} />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, size = 'md', children }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative rounded-2xl shadow-2xl w-full ${sizes[size] ?? sizes.md} border`} style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[var(--muted-bg)] transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmVariant = 'danger', loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 3500)
    return () => clearTimeout(id)
  }, [onClose])

  const styles = { success: 'bg-green-600', error: 'bg-red-600', warning: 'bg-amber-500', info: 'bg-blue-600' }
  const icons  = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white min-w-[240px] ${styles[type] ?? styles.info}`}>
      <span className="flex-shrink-0">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-1 opacity-75 hover:opacity-100 text-xl leading-none">×</button>
    </div>
  )
}

export function ToastContainer({ toasts, removeToast }) {
  if (!toasts?.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', padding = true, style }) {
  return (
    <div
      className={`rounded-xl border ${padding ? 'p-5' : ''} ${className}`}
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', ...style }}
    >
      {children}
    </div>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4 opacity-60">{icon}</div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null
  const { current_page, last_page, total, from, to } = meta
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-gray-400" style={{ borderColor: 'var(--card-border)' }}>
      <span className="text-xs">Showing {from}–{to} of {total}</span>
      <div className="flex gap-1.5 items-center">
        <Button size="sm" variant="secondary" disabled={current_page <= 1} onClick={() => onPageChange(current_page - 1)}>← Prev</Button>
        <span className="px-3 py-1.5 text-xs rounded-lg font-mono" style={{ backgroundColor: 'var(--muted-bg)' }}>{current_page} / {last_page}</span>
        <Button size="sm" variant="secondary" disabled={current_page >= last_page} onClick={() => onPageChange(current_page + 1)}>Next →</Button>
      </div>
    </div>
  )
}

// ── LoadingPage ───────────────────────────────────────────────────────────────
export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = 'blue', trend }) {
  const colors = {
    blue:   { text: 'text-blue-400',   bg: 'rgba(37,99,235,0.15)',   border: 'rgba(37,99,235,0.35)'   },
    green:  { text: 'text-green-400',  bg: 'rgba(22,163,74,0.15)',   border: 'rgba(22,163,74,0.35)'   },
    red:    { text: 'text-red-400',    bg: 'rgba(220,38,38,0.15)',   border: 'rgba(220,38,38,0.35)'   },
    amber:  { text: 'text-amber-400',  bg: 'rgba(217,119,6,0.15)',   border: 'rgba(217,119,6,0.35)'   },
    purple: { text: 'text-purple-400', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.35)'  },
    gray:   { text: 'text-gray-400',   bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)' },
  }
  const c = colors[color] ?? colors.blue
  return (
    <div className={`rounded-xl border p-5 ${c.text}`} style={{ backgroundColor: c.bg, borderColor: c.border }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
        {icon && <span className="text-xl opacity-80">{icon}</span>}
      </div>
      <p className="text-4xl font-bold">{value ?? '—'}</p>
      {trend && <p className="text-xs mt-2 opacity-60">{trend}</p>}
    </div>
  )
}