require('dotenv').config()
const { execSync } = require('child_process')
const axios = require('axios')

const API_URL   = (process.env.API_URL || 'http://localhost:8000').replace(/\/$/, '')
const API_TOKEN = process.env.API_TOKEN
const INTERVAL  = parseInt(process.env.INTERVAL || '30') * 1000

if (!API_TOKEN) {
  console.error('[Agent] ERROR: API_TOKEN is not set in .env')
  process.exit(1)
}

function parseArp() {
  try {
    const output  = execSync('arp -a 2>&1', { encoding: 'utf8' })
    const entries = []
    const isWin   = process.platform === 'win32'

    for (const raw of output.split('\n')) {
      const line = raw.trim()
      if (isWin) {
        const m = line.match(
          /^(\d{1,3}(?:\.\d{1,3}){3})\s+([\da-fA-F]{2}[-:][\da-fA-F]{2}[-:][\da-fA-F]{2}[-:][\da-fA-F]{2}[-:][\da-fA-F]{2}[-:][\da-fA-F]{2})\s+(\w+)/
        )
        if (m && m[3].toLowerCase() === 'dynamic') {
          entries.push({ ip: m[1], mac: m[2].toLowerCase().replace(/-/g, ':'), type: 'dynamic' })
        }
      } else {
        const m = line.match(/\((\d{1,3}(?:\.\d{1,3}){3})\)\s+at\s+([\da-fA-F:]{17})/)
        if (m) {
          const mac = m[2].toLowerCase()
          if (mac !== '00:00:00:00:00:00' && mac !== 'ff:ff:ff:ff:ff:ff') {
            entries.push({ ip: m[1], mac, type: 'dynamic' })
          }
        }
      }
    }
    return entries
  } catch (e) {
    console.error('[Agent] ARP error:', e.message)
    return []
  }
}

async function push(entries) {
  try {
    const res = await axios.post(
      `${API_URL}/api/agent/push`,
      { entries },
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000,
      }
    )
    const d = res.data
    console.log(`[Agent] ${now()} — Pushed ${entries.length} entries. ${d.new} new device(s) added.`)
  } catch (e) {
    const msg = e.response?.data?.message || e.message
    console.error(`[Agent] ${now()} — Push failed: ${msg}`)
  }
}

async function run() {
  const entries = parseArp()
  if (entries.length === 0) {
    console.log(`[Agent] ${now()} — ARP table empty (no devices found).`)
    return
  }
  await push(entries)
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

console.log(`[Agent] Starting — API: ${API_URL} | Interval: ${INTERVAL / 1000}s`)
run()
setInterval(run, INTERVAL)
