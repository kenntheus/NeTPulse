import { useEffect, useRef } from 'react'

let echoInstance = null
let initAttempted = false

function getEcho() {
  if (echoInstance) return echoInstance
  if (initAttempted) return null   // already tried and failed, don't retry
  initAttempted = true

  const key     = import.meta.env.VITE_PUSHER_KEY
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER || 'mt1'

  // Silently skip if Pusher key is not configured
  if (!key || key === 'your_pusher_key' || key.trim() === '') {
    return null
  }

  try {
    import('pusher-js').then(({ default: Pusher }) => {
      import('laravel-echo').then(({ default: Echo }) => {
        window.Pusher = Pusher
        echoInstance  = new Echo({
          broadcaster: 'pusher',
          key,
          cluster,
          forceTLS:    true,
        })
      })
    })
  } catch (_) {
    // Pusher packages not installed — fall back to polling silently
  }

  return null
}

/**
 * useEcho — subscribes to a Laravel Echo public channel event.
 * Falls back to polling (handled by the page's setInterval) if Pusher
 * is not configured.
 *
 * Usage:
 *   useEcho('network-monitoring', 'DeviceStatusUpdated', (data) => { ... })
 */
export function useEcho(channel, event, callback) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const echo = getEcho()
    if (!echo) return   // no Pusher — polling takes over

    const ch = echo.channel(channel)
    ch.listen(`.${event}`, (data) => callbackRef.current(data))

    return () => {
      try { ch.stopListening(`.${event}`) } catch (_) {}
    }
  }, [channel, event])
}