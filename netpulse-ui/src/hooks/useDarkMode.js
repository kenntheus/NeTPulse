import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    // Check localStorage first
    const stored = localStorage.getItem('netpulse_dark')
    if (stored !== null) return stored === 'true'
    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('netpulse_dark', String(dark))
  }, [dark])

  // Apply on first render too (before any toggle)
  useEffect(() => {
    const stored = localStorage.getItem('netpulse_dark')
    const isDark = stored !== null
      ? stored === 'true'
      : window.matchMedia('(prefers-color-scheme: dark)').matches

    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return [dark, setDark]
}