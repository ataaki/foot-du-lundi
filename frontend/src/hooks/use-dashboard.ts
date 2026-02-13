import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api/client'
import type { DashboardData } from '../types'

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    try {
      const result = await api.get<DashboardData>('/dashboard')
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    intervalRef.current = setInterval(refresh, 60_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [refresh])

  return { data, loading, error, refresh }
}
