import { useEffect } from 'react'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

let echo = null

function getEcho() {
  if (!echo) {
    window.Pusher = Pusher
    echo = new Echo({
      broadcaster:  'pusher',
      key:           import.meta.env.VITE_PUSHER_KEY,
      cluster:       import.meta.env.VITE_PUSHER_CLUSTER,
      forceTLS:      true,
    })
  }
  return echo
}

export function useEcho(channel, event, callback) {
  useEffect(() => {
    const ch = getEcho().channel(channel)
    ch.listen(`.${event}`, callback)
    return () => ch.stopListening(`.${event}`)
  }, [channel, event])
}