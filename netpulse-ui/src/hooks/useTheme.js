import { useState, useEffect } from 'react'

export const THEMES = [
  { id: 'blue',    label: 'Blue',    accent: '#2563eb', hover: '#1d4ed8' },
  { id: 'violet',  label: 'Violet',  accent: '#7c3aed', hover: '#6d28d9' },
  { id: 'emerald', label: 'Emerald', accent: '#059669', hover: '#047857' },
  { id: 'rose',    label: 'Rose',    accent: '#e11d48', hover: '#be123c' },
  { id: 'orange',  label: 'Orange',  accent: '#ea580c', hover: '#c2410c' },
  { id: 'teal',    label: 'Teal',    accent: '#0d9488', hover: '#0f766e' },
]

const KEY = 'netpulse_theme'

function read() {
  try { return localStorage.getItem(KEY) || 'blue' } catch { return 'blue' }
}

function apply(themeId) {
  const t = THEMES.find(t => t.id === themeId) ?? THEMES[0]
  const root = document.documentElement
  root.classList.add('dark')
  root.style.setProperty('--accent', t.accent)
  root.style.setProperty('--accent-hover', t.hover)
}

export function useTheme() {
  const [theme, setTheme] = useState(read)

  useEffect(() => {
    apply(theme)
    try { localStorage.setItem(KEY, theme) } catch {}
  }, [theme])

  // Apply immediately on first paint to avoid flash
  useEffect(() => { apply(read()) }, [])

  return [theme, setTheme]
}
