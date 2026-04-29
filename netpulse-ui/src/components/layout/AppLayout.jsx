import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import api from '../../lib/api'

export default function AppLayout() {
  const [unreadAlerts, setUnreadAlerts] = useState(0)

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const { data } = await api.get('/dashboard/summary')
        setUnreadAlerts(data.unread_alerts ?? 0)
      } catch (_) {}
    }
    fetchAlertCount()
    const id = setInterval(fetchAlertCount, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar alertCount={unreadAlerts} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}