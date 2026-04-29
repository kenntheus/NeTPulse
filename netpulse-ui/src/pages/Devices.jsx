import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from '../store/AuthContext'
import { Button, Modal, Badge, StatusDot, EmptyState, Spinner } from '../components/ui'

const DEVICE_TYPES = ['router', 'switch', 'server', 'firewall', 'ap', 'other']
const TYPE_ICON    = { router: '⬡', switch: '⬢', server: '▣', firewall: '⬛', ap: '◎', other: '◈' }

const emptyForm = { name: '', ip_address: '', type: 'server', location: '', description: '' }

export default function Devices() {
  const { isAdmin }                     = useAuth()
  const [devices,    setDevices]        = useState([])
  const [loading,    setLoading]        = useState(true)
  const [modalOpen,  setModalOpen]      = useState(false)
  const [editDevice, setEditDevice]     = useState(null)
  const [form,       setForm]           = useState(emptyForm)
  const [formError,  setFormError]      = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [pingLoading,setPingLoading]    = useState({})
  const [search,     setSearch]         = useState('')
  const [filter,     setFilter]         = useState('')

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filter) params.status = filter
      const { data } = await api.get('/devices', { params })
      setDevices(data.data)
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDevices() }, [search, filter])

  const openAdd = () => {
    setEditDevice(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (device) => {
    setEditDevice(device)
    setForm({ name: device.name, ip_address: device.ip_address, type: device.type, location: device.location || '', description: device.description || '' })
    setFormError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      if (editDevice) {
        await api.put(`/devices/${editDevice.id}`, form)
      } else {
        await api.post('/devices', form)
      }
      setModalOpen(false)
      fetchDevices()
    } catch (err) {
      const errors = err.response?.data?.errors
      setFormError(errors ? Object.values(errors)[0]?.[0] : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (device) => {
    if (!confirm(`Delete "${device.name}"? This also deletes all logs.`)) return
    try {
      await api.delete(`/devices/${device.id}`)
      setDevices(prev => prev.filter(d => d.id !== device.id))
    } catch (_) {}
  }

  const handlePing = async (device) => {
    setPingLoading(p => ({ ...p, [device.id]: true }))
    try {
      const { data } = await api.post(`/devices/${device.id}/ping`)
      setDevices(prev =>
        prev.map(d => d.id === device.id
          ? { ...d, status: data.status, latency_ms: data.latency_ms, last_checked_at: data.checked_at }
          : d
        )
      )
    } catch (_) {}
    finally { setPingLoading(p => ({ ...p, [device.id]: false })) }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Devices</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage monitored network devices</p>
        </div>
        {isAdmin() && (
          <Button onClick={openAdd}>+ Add device</Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="search"
          placeholder="Search name or IP..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-56"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All statuses</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>

      {/* Device grid */}
      {loading
        ? <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        : devices.length === 0
          ? <EmptyState icon="⬡" title="No devices found" description={isAdmin() ? 'Add your first network device to start monitoring.' : 'No devices match your filters.'} action={isAdmin() ? <Button onClick={openAdd}>Add device</Button> : null} />
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {devices.map(device => (
                <div key={device.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md dark:hover:border-gray-600 transition-all">

                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{TYPE_ICON[device.type]}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{device.name}</h3>
                        <p className="text-xs text-gray-500 font-mono">{device.ip_address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusDot status={device.status} animate />
                      <Badge variant={device.status}>{device.status}</Badge>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span className="capitalize text-gray-700 dark:text-gray-300">{device.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location</span>
                      <span className="text-gray-700 dark:text-gray-300">{device.location || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latency</span>
                      <span className={`font-mono ${device.latency_ms > 100 ? 'text-amber-500' : 'text-green-500'}`}>
                        {device.latency_ms != null ? `${device.latency_ms}ms` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last check</span>
                      <span>{device.last_checked_at ? new Date(device.last_checked_at).toLocaleTimeString() : '—'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Button
                      size="sm" variant="secondary"
                      loading={pingLoading[device.id]}
                      onClick={() => handlePing(device)}
                      className="flex-1"
                    >
                      Ping
                    </Button>
                    {isAdmin() && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => openEdit(device)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(device)}>Del</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
      }

      {/* Add / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editDevice ? `Edit — ${editDevice.name}` : 'Add new device'}
      >
        {formError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
            {formError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'name',       label: 'Device name', placeholder: 'Core Router 01', required: true },
            { key: 'ip_address', label: 'IP address',  placeholder: '192.168.1.1',    required: true },
            { key: 'location',   label: 'Location',    placeholder: 'Server Room A',  required: false },
          ].map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
              <input
                type="text"
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                required={required}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {DEVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Optional notes about this device..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={submitting} className="flex-1 justify-center">
              {editDevice ? 'Save changes' : 'Add device'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}