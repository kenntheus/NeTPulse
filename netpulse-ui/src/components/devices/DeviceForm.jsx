import { useState, useEffect } from 'react'
import { Button, Input, Textarea } from '../ui'

const DEVICE_TYPES = [
  // Network
  { value: 'router',   label: '🌐  Router',        group: 'Network' },
  { value: 'switch',   label: '🔀  Switch',         group: 'Network' },
  { value: 'firewall', label: '🛡️  Firewall',       group: 'Network' },
  { value: 'ap',       label: '📡  Access Point',   group: 'Network' },
  // Computers
  { value: 'pc',       label: '🖥️  Desktop PC',     group: 'Computers' },
  { value: 'laptop',   label: '💻  Laptop',          group: 'Computers' },
  { value: 'server',   label: '🗄️  Server',          group: 'Computers' },
  // Mobile
  { value: 'phone',    label: '📱  Phone',           group: 'Mobile' },
  { value: 'tablet',   label: '📟  Tablet / iPad',   group: 'Mobile' },
  // Home
  { value: 'smarttv',  label: '📺  Smart TV',        group: 'Home' },
  { value: 'cctv',     label: '📷  CCTV / Camera',   group: 'Home' },
  { value: 'printer',  label: '🖨️  Printer',         group: 'Home' },
  { value: 'other',    label: '◈   Other',           group: 'Other' },
]

const EMPTY = { name: '', ip_address: '', type: 'other', location: '', description: '', notes: '' }

export default function DeviceForm({ initialData = null, onSubmit, onCancel, submitLabel = 'Save device' }) {
  const [form,     setForm]     = useState(EMPTY)
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name:        initialData.name        ?? '',
        ip_address:  initialData.ip_address  ?? '',
        type:        initialData.type        ?? 'other',
        location:    initialData.location    ?? '',
        description: initialData.description ?? '',
        notes:       initialData.notes       ?? '',
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
    setApiError('')
  }, [initialData])

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(err => ({ ...err, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())       e.name       = 'Device name is required.'
    if (!form.ip_address.trim()) e.ip_address = 'IP address is required.'
    else if (!/^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+$/.test(form.ip_address.trim())) {
      e.ip_address = 'Enter a valid IPv4 or IPv6 address.'
    }
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err) {
      const laravelErrors = err?.response?.data?.errors
      if (laravelErrors) {
        const mapped = {}
        Object.entries(laravelErrors).forEach(([k, v]) => { mapped[k] = v[0] })
        setErrors(mapped)
      } else {
        setApiError(err?.response?.data?.message ?? 'Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Group types for display
  const groups = [...new Set(DEVICE_TYPES.map(t => t.group))]

  return (
    <form onSubmit={handleSubmit} noValidate>
      {apiError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {apiError}
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="Device name *"
          placeholder="e.g. John's iPhone"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="IP address *"
            placeholder="192.168.1.55"
            value={form.ip_address}
            onChange={set('ip_address')}
            error={errors.ip_address}
            className="font-mono"
          />

          {/* Grouped select */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Device type *</label>
            <select
              value={form.type}
              onChange={set('type')}
              className="w-full border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              style={{ backgroundColor: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}
            >
              {groups.map(group => (
                <optgroup key={group} label={`── ${group}`}>
                  {DEVICE_TYPES.filter(t => t.group === group).map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Location"
          placeholder="e.g. Living Room, Bedroom"
          value={form.location}
          onChange={set('location')}
          error={errors.location}
        />

        <Textarea
          label="Description"
          placeholder="What is this device? e.g. Main office router"
          value={form.description}
          onChange={set('description')}
          rows={2}
        />

        <Textarea
          label="Notes"
          placeholder="Operational notes, reminders… e.g. Firmware update needed"
          value={form.notes}
          onChange={set('notes')}
          rows={2}
        />
      </div>

      <div className="flex gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--card-border)' }}>
        <Button type="submit" loading={loading} className="flex-1 justify-center">
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}