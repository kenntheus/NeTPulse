import { useState, useEffect } from 'react'
import { Button, Input, Select, Textarea } from '../ui'

const DEVICE_TYPES = [
  { value: 'router',   label: '⬡  Router'   },
  { value: 'switch',   label: '⬢  Switch'   },
  { value: 'server',   label: '▣  Server'   },
  { value: 'firewall', label: '⬛  Firewall' },
  { value: 'ap',       label: '◎  Access Point' },
  { value: 'other',    label: '◈  Other'    },
]

const EMPTY = {
  name:        '',
  ip_address:  '',
  type:        'server',
  location:    '',
  description: '',
}

/**
 * DeviceForm — shared form for adding and editing devices.
 *
 * Props:
 *   initialData  object    prefills fields when editing (optional)
 *   onSubmit     async fn  called with form data; should throw on API error
 *   onCancel     fn        called when Cancel is clicked
 *   submitLabel  string    button label (default: 'Save device')
 */
export default function DeviceForm({ initialData = null, onSubmit, onCancel, submitLabel = 'Save device' }) {
  const [form,    setForm]    = useState(EMPTY)
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  // Pre-fill when editing
  useEffect(() => {
    if (initialData) {
      setForm({
        name:        initialData.name        ?? '',
        ip_address:  initialData.ip_address  ?? '',
        type:        initialData.type        ?? 'server',
        location:    initialData.location    ?? '',
        description: initialData.description ?? '',
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
    setApiError('')
  }, [initialData])

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((err) => ({ ...err, [field]: '' })) // clear field error on change
  }

  // Client-side validation
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
    const validationErrors = validate()
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      return
    }
    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err) {
      // Laravel validation errors come as { errors: { field: [msg] } }
      const laravelErrors = err?.response?.data?.errors
      if (laravelErrors) {
        const mapped = {}
        Object.entries(laravelErrors).forEach(([k, v]) => { mapped[k] = v[0] })
        setErrors(mapped)
      } else {
        setApiError(err?.response?.data?.message ?? 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* API-level error banner */}
      {apiError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {apiError}
        </div>
      )}

      <div className="space-y-4">

        {/* Name */}
        <Input
          label="Device name *"
          placeholder="e.g. Core Router 01"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          autoFocus
        />

        {/* IP + Type — side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="IP address *"
            placeholder="192.168.1.1"
            value={form.ip_address}
            onChange={set('ip_address')}
            error={errors.ip_address}
            className="font-mono"
          />

          <Select
            label="Device type *"
            value={form.type}
            onChange={set('type')}
            error={errors.type}
          >
            {DEVICE_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>

        {/* Location */}
        <Input
          label="Location"
          placeholder="e.g. Server Room A, Floor 2"
          value={form.location}
          onChange={set('location')}
          error={errors.location}
        />

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Optional notes about this device…"
          value={form.description}
          onChange={set('description')}
          error={errors.description}
          rows={3}
        />
      </div>

      {/* Form actions */}
      <div className="flex gap-3 mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="submit"
          loading={loading}
          className="flex-1 justify-center"
        >
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}