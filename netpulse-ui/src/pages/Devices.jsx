import { useState } from 'react'
import { useAuth }    from '../hooks/useAuth'
import { useDevices } from '../hooks/useDevices'
import { useEcho }    from '../hooks/useEcho'
import useToast       from '../hooks/useToast'
import api            from '../lib/api'
import DeviceCard from '../components/devices/DeviceCard'
import DeviceForm from '../components/devices/DeviceForm'
import {
  Button, Modal, ConfirmDialog, ToastContainer,
  EmptyState, LoadingPage, PageHeader, Select,
} from '../components/ui'

export default function Devices() {
  const { isAdmin } = useAuth()
  const [filters, setFilters] = useState({ search: '', status: '', type: '' })
  const { devices, loading, addDevice, updateDevice, deleteDevice, bulkDeleteDevices, muteDevice, unmuteDevice, pingDevice, applyRealtimeUpdate } = useDevices(filters)
  const { toasts, addToast, removeToast } = useToast()

  const [addOpen,      setAddOpen]      = useState(false)
  const [editDevice,   setEditDevice]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)
  const [scanning,     setScanning]     = useState(false)
  const [scanResult,   setScanResult]   = useState(null)
  const [selected,     setSelected]     = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEcho('network-monitoring', 'DeviceStatusUpdated', applyRealtimeUpdate)

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    await addDevice(formData)
    setAddOpen(false)
    addToast('Device added successfully!', 'success')
  }

  const handleEdit = async (formData) => {
    await updateDevice(editDevice.id, formData)
    setEditDevice(null)
    addToast('Device updated.', 'success')
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteDevice(deleteTarget.id)
      setDeleteTarget(null)
      addToast(`"${deleteTarget.name}" deleted.`, 'success')
    } catch {
      addToast('Failed to delete device.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handlePing = async (device) => {
    try {
      const result = await pingDevice(device.id)
      const label  = result.status === 'online' ? `Online — ${result.latency_ms}ms` : 'Offline'
      addToast(`${device.name}: ${label}`, result.status === 'online' ? 'success' : 'error')
    } catch {
      addToast('Ping failed.', 'error')
    }
  }

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleSelectAll = () => {
    if (selected.size === visible.length && visible.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(visible.map(d => d.id)))
    }
  }

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    try {
      await bulkDeleteDevices([...selected])
      const count = selected.size
      setSelected(new Set())
      addToast(`${count} device(s) deleted.`, 'success')
    } catch {
      addToast('Bulk delete failed.', 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleMute = async (device) => {
    try {
      await muteDevice(device.id, 60)
      addToast(`"${device.name}" alerts muted for 1 hour.`, 'success')
    } catch {
      addToast('Failed to mute device.', 'error')
    }
  }

  const handleUnmute = async (device) => {
    try {
      await unmuteDevice(device.id)
      addToast(`"${device.name}" alerts unmuted.`, 'success')
    } catch {
      addToast('Failed to unmute device.', 'error')
    }
  }

  // ARP network scan
  const handleArpScan = async () => {
    setScanning(true)
    setScanResult(null)
    try {
      const { data } = await api.post('/arp/scan')
      setScanResult(data)
      addToast(
        data.new > 0
          ? `Found ${data.found} devices — ${data.new} new added!`
          : `Scanned network — ${data.found} devices found, none new.`,
        data.new > 0 ? 'success' : 'info'
      )
      // Refresh device list
      window.location.reload()
    } catch {
      addToast('ARP scan failed. Make sure Laravel is running on your local machine.', 'error')
    } finally {
      setScanning(false)
    }
  }

  // Client-side filter
  const visible = devices.filter(d => {
    const q = filters.search.toLowerCase()
    if (q && !d.name.toLowerCase().includes(q) && !d.ip_address.includes(q)) return false
    if (filters.status && d.status !== filters.status) return false
    if (filters.type   && d.type   !== filters.type)   return false
    return true
  })

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">

      <PageHeader
        title="Devices"
        subtitle={`${devices.length} device${devices.length !== 1 ? 's' : ''} monitored`}
        action={
          <div className="flex gap-2">
            {/* ARP Network Scan button — admin only */}
            {isAdmin() && (
              <Button
                variant="secondary"
                onClick={handleArpScan}
                loading={scanning}
                title="Scan your local network for connected devices"
              >
                {!scanning && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                )}
                {scanning ? 'Scanning…' : 'Scan Network'}
              </Button>
            )}

            {isAdmin() && (
              <Button onClick={() => setAddOpen(true)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add device
              </Button>
            )}
          </div>
        }
      />

      {/* Scan result banner */}
      {scanResult && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                🔍 ARP Scan Complete
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Found <strong>{scanResult.found}</strong> devices on your network.
                {scanResult.new > 0
                  ? <> <strong>{scanResult.new}</strong> new device(s) were automatically added.</>
                  : <> No new devices discovered.</>
                }
              </p>
              {scanResult.entries?.length > 0 && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {scanResult.entries.map((e, i) => (
                    <div key={i} className="bg-white dark:bg-blue-900/30 rounded-lg px-3 py-2 text-xs">
                      <p className="font-mono font-semibold text-gray-900 dark:text-white">{e.ip}</p>
                      <p className="text-gray-500 dark:text-gray-400 font-mono truncate">{e.mac}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setScanResult(null)}
              className="text-blue-400 hover:text-blue-600 text-xl leading-none flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search name or IP…"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="pl-9 pr-4 py-2 text-sm border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 w-52"
            style={{ backgroundColor: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}
          />
        </div>

        <Select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="w-36">
          <option value="">All statuses</option>
          <option value="online">🟢 Online</option>
          <option value="offline">🔴 Offline</option>
          <option value="unknown">⚪ Unknown</option>
        </Select>

        <Select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} className="w-36">
          <option value="">All types</option>
          <option value="router">Router</option>
          <option value="switch">Switch</option>
          <option value="server">Server</option>
          <option value="firewall">Firewall</option>
          <option value="ap">Access Point</option>
          <option value="phone">Phone</option>
          <option value="tablet">Tablet / iPad</option>
          <option value="laptop">Laptop</option>
          <option value="pc">Desktop PC</option>
          <option value="cctv">CCTV / Camera</option>
          <option value="printer">Printer</option>
          <option value="smarttv">Smart TV</option>
          <option value="other">Other</option>
        </Select>

        {(filters.search || filters.status || filters.type) && (
          <Button size="sm" variant="ghost" onClick={() => setFilters({ search: '', status: '', type: '' })}>
            Clear
          </Button>
        )}

        {isAdmin() && visible.length > 0 && (
          <Button
            size="sm"
            variant={selected.size === visible.length ? 'primary' : 'ghost'}
            onClick={toggleSelectAll}
          >
            {selected.size === visible.length ? 'Deselect all' : 'Select all'}
          </Button>
        )}

        <div className="ml-auto flex gap-2 text-xs">
          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-md font-medium">
            {devices.filter(d => d.status === 'online').length} online
          </span>
          <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-md font-medium">
            {devices.filter(d => d.status === 'offline').length} offline
          </span>
        </div>
      </div>

      {/* Device grid */}
      {loading ? (
        <LoadingPage />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="⬡"
          title="No devices found"
          description={
            filters.search || filters.status || filters.type
              ? 'Try adjusting your filters.'
              : isAdmin()
              ? 'Click "Scan Network" to auto-discover devices, or add one manually.'
              : 'No devices have been added yet.'
          }
          action={
            isAdmin() && !filters.search && !filters.status && !filters.type && (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleArpScan} loading={scanning}>
                  Scan Network
                </Button>
                <Button onClick={() => setAddOpen(true)}>Add manually</Button>
              </div>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              isAdmin={isAdmin()}
              onEdit={setEditDevice}
              onDelete={setDeleteTarget}
              onPing={handlePing}
              selected={selected.has(device.id)}
              onSelect={isAdmin() ? toggleSelect : undefined}
              onMute={handleMute}
              onUnmute={handleUnmute}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add new device">
        <DeviceForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} submitLabel="Add device" />
      </Modal>

      <Modal open={!!editDevice} onClose={() => setEditDevice(null)} title={`Edit — ${editDevice?.name ?? ''}`}>
        <DeviceForm initialData={editDevice} onSubmit={handleEdit} onCancel={() => setEditDevice(null)} submitLabel="Save changes" />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete device"
        message={`Delete "${deleteTarget?.name}"? This removes all logs and alerts for this device.`}
        confirmLabel="Delete device"
        confirmVariant="danger"
      />

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3 rounded-2xl shadow-2xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <span className="text-sm font-medium text-gray-300">{selected.size} selected</span>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          <Button size="sm" variant="danger" loading={bulkDeleting} onClick={handleBulkDelete}>
            Delete selected
          </Button>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}