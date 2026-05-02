import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem('netpulse_dark')
      if (stored !== null) return stored === 'true'
    } catch (_) {}
    return false // default to light mode
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      localStorage.setItem('netpulse_dark', String(dark))
    } catch (_) {}
  }, [dark])

  return [dark, setDark]
}