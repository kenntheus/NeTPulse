import { useState, useEffect } from 'react'

const KEY   = 'netpulse_dark'
const EVENT = 'netpulse:dark'

function read() {
  try {
    const v = localStorage.getItem(KEY)
    return v !== null ? v === 'true' : false
  } catch (_) { return false }
}

export function useDarkMode() {
  const [dark, setDark] = useState(read)

  // Sync the <html> class and persist whenever state changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem(KEY, String(dark)) } catch (_) {}
  }, [dark])

  // Listen for changes made by other hook instances (Sidebar ↔ TopBar)
  useEffect(() => {
    const handler = (e) => setDark(e.detail)
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [])

  // Setter that also notifies every other mounted instance
  const set = (value) => {
    setDark(value)
    window.dispatchEvent(new CustomEvent(EVENT, { detail: value }))
  }

  return [dark, set]
}
