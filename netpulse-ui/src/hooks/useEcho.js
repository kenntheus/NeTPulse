import { useEffect, useRef } from 'react'

let echoInstance = null

function getEcho() {
  if (echoInstance) return echoInstance
  // Lazy-load to avoid errors if Pusher keys are not set
  const key     = import.meta.env.VITE_PUSHER_KEY
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER || 'mt1'

  if (!key || key === 'your_pusher_key') {
    console.warn('[NetPulse] Pusher key not configured. Real-time updates disabled.')
    return null
  }

  import('laravel-echo').then(({ default: Echo }) => {
    import('pusher-js').then(({ default: Pusher }) => {
      window.Pusher    = Pusher
      echoInstance     = new Echo({
        broadcaster: 'pusher',
        key,
        cluster,
        forceTLS:    true,
      })
    })
  })

  return null
}

/**
 * Subscribe to a public Laravel Echo channel and listen for an event.
 * callback is called with the event payload.
 *
 * Usage:
 *   useEcho('network-monitoring', 'DeviceStatusUpdated', (data) => { ... })
 */
export function useEcho(channel, event, callback) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const echo = getEcho()
    if (!echo) return

    const ch = echo.channel(channel)
    ch.listen(`.${event}`, (data) => callbackRef.current(data))

    return () => {
      ch.stopListening(`.${event}`)
    }
  }, [channel, event])
}