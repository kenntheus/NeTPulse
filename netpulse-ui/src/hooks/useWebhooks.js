import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState([])
  const [loading,  setLoading]  = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/webhooks')
      setWebhooks(data.data)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const addWebhook = async (payload) => {
    const { data } = await api.post('/webhooks', payload)
    setWebhooks((prev) => [...prev, data.data])
    return data.data
  }

  const updateWebhook = async (id, payload) => {
    const { data } = await api.put(`/webhooks/${id}`, payload)
    setWebhooks((prev) => prev.map((w) => (w.id === id ? data.data : w)))
    return data.data
  }

  const deleteWebhook = async (id) => {
    await api.delete(`/webhooks/${id}`)
    setWebhooks((prev) => prev.filter((w) => w.id !== id))
  }

  const testWebhook = async (id) => {
    const { data } = await api.post(`/webhooks/${id}/test`)
    return data
  }

  return { webhooks, loading, addWebhook, updateWebhook, deleteWebhook, testWebhook, refetch: fetch }
}
