import { useState, useEffect, useRef } from 'react'

export function useServerTime() {
  const [time, setTime] = useState<string | null>(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    async function sync() {
      try {
        const before = Date.now()
        const res = await fetch('/api/time')
        const { time: serverTime } = await res.json()
        const rtt = Date.now() - before
        offsetRef.current = new Date(serverTime).getTime() + rtt / 2 - Date.now()
      } catch {
        // fallback: no offset, use client time
      }
    }

    function tick() {
      const now = new Date(Date.now() + offsetRef.current)
      setTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }

    sync().then(tick)
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  return time
}
