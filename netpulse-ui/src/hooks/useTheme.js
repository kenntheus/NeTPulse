import { useState, useEffect } from 'react'

export const THEMES = [
  {
    id: 'midnight',
    label: 'Midnight',
    sidebarBg:     '#111827',
    sidebarBorder: '#1f2937',
    sidebarCard:   '#1f2937',
    accent:        '#2563eb',
    hover:         '#1d4ed8',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    sidebarBg:     '#0c1e35',
    sidebarBorder: '#163050',
    sidebarCard:   '#102845',
    accent:        '#0ea5e9',
    hover:         '#0284c7',
  },
  {
    id: 'forest',
    label: 'Forest',
    sidebarBg:     '#0f2018',
    sidebarBorder: '#1a3526',
    sidebarCard:   '#1a3526',
    accent:        '#10b981',
    hover:         '#059669',
  },
  {
    id: 'amethyst',
    label: 'Amethyst',
    sidebarBg:     '#1a0d2e',
    sidebarBorder: '#2d1a4a',
    sidebarCard:   '#2d1a4a',
    accent:        '#8b5cf6',
    hover:         '#7c3aed',
  },
  {
    id: 'ember',
    label: 'Ember',
    sidebarBg:     '#2a1206',
    sidebarBorder: '#3d1c0a',
    sidebarCard:   '#3d1c0a',
    accent:        '#f97316',
    hover:         '#ea580c',
  },
  {
    id: 'cherry',
    label: 'Cherry',
    sidebarBg:     '#2a0d14',
    sidebarBorder: '#3d1520',
    sidebarCard:   '#3d1520',
    accent:        '#f43f5e',
    hover:         '#e11d48',
  },
]

const KEY = 'netpulse_theme'

function read() {
  try { return localStorage.getItem(KEY) || 'midnight' } catch { return 'midnight' }
}

function apply(themeId) {
  const t = THEMES.find(t => t.id === themeId) ?? THEMES[0]
  const root = document.documentElement
  root.classList.add('dark')
  root.style.setProperty('--accent',         t.accent)
  root.style.setProperty('--accent-hover',   t.hover)
  root.style.setProperty('--sidebar-bg',     t.sidebarBg)
  root.style.setProperty('--sidebar-border', t.sidebarBorder)
  root.style.setProperty('--sidebar-card',   t.sidebarCard)
}

export function useTheme() {
  const [theme, setTheme] = useState(read)

  useEffect(() => {
    apply(theme)
    try { localStorage.setItem(KEY, theme) } catch {}
  }, [theme])

  useEffect(() => { apply(read()) }, [])

  return [theme, setTheme]
}
