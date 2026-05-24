import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

export function useMaintenanceWindows(deviceId) {
  const [windows, setWindows]   = useState([])
  const [loading, setLoading]   = useState(true)

  const fetch = useCallback(async () => {
    if (!deviceId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/devices/${deviceId}/maintenance-windows`)
      setWindows(data.data)
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const addWindow = async (payload) => {
    const { data } = await api.post(`/devices/${deviceId}/maintenance-windows`, payload)
    setWindows((prev) => [...prev, data.data].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)))
    return data.data
  }

  const removeWindow = async (id) => {
    await api.delete(`/maintenance-windows/${id}`)
    setWindows((prev) => prev.filter((w) => w.id !== id))
  }

  return { windows, loading, addWindow, removeWindow, refetch: fetch }
}
