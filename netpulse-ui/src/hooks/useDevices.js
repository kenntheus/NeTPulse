import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../lib/api'

/**
 * useDevices — manages device list state, CRUD operations, and ping.
 *
 * Usage:
 *   const { devices, loading, addDevice, updateDevice, deleteDevice, pingDevice, refetch } = useDevices()
 */
export function useDevices(filters = {}) {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters])

  const fetchDevices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/devices', { params: filters })
      setDevices(data.data ?? data)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load devices.')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDevices()
  }, [fetchDevices])

  // ── Add ──────────────────────────────────────────────────────────────────
  const addDevice = async (formData) => {
    const { data } = await api.post('/devices', formData)
    setDevices((prev) => [...prev, data.data])
    return data.data
  }

  // ── Update ───────────────────────────────────────────────────────────────
  const updateDevice = async (id, formData) => {
    const { data } = await api.put(`/devices/${id}`, formData)
    setDevices((prev) => prev.map((d) => (d.id === id ? data.data : d)))
    return data.data
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  const deleteDevice = async (id) => {
    await api.delete(`/devices/${id}`)
    // Optimistic removal
    setDevices((prev) => prev.filter((d) => d.id !== id))
  }

  // ── Bulk Delete ──────────────────────────────────────────────────────────
  const bulkDeleteDevices = async (ids) => {
    await api.post('/devices/bulk-destroy', { ids })
    setDevices((prev) => prev.filter((d) => !ids.includes(d.id)))
  }

  // ── Ping ─────────────────────────────────────────────────────────────────
  const pingDevice = async (id) => {
    const { data } = await api.post(`/devices/${id}/ping`)
    // Update latency and status in place
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: data.status, latency_ms: data.latency_ms, last_checked_at: data.checked_at }
          : d
      )
    )
    return data
  }

  // ── Real-time update from WebSocket ────────────────────────────────────
  const applyRealtimeUpdate = useCallback((event) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === event.device_id
          ? {
              ...d,
              status:          event.status,
              latency_ms:      event.latency_ms,
              last_checked_at: event.checked_at,
            }
          : d
      )
    )
  }, [])

  return {
    devices,
    loading,
    error,
    refetch:             fetchDevices,
    addDevice,
    updateDevice,
    deleteDevice,
    bulkDeleteDevices,
    pingDevice,
    applyRealtimeUpdate,
  }
}