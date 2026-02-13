import { useState, useCallback } from 'react'
import { api } from '../api/client'
import type { BookingsResponse } from '../types'

export function useBookings() {
  const [data, setData] = useState<BookingsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'upcoming' | 'past'>('upcoming')
  const [page, setPage] = useState(1)

  const load = useCallback(async (s?: 'upcoming' | 'past', p?: number) => {
    const newStatus = s ?? status
    const newPage = p ?? page
    setLoading(true)
    setStatus(newStatus)
    setPage(newPage)
    try {
      const result = await api.get<BookingsResponse>(`/bookings?status=${newStatus}&page=${newPage}&limit=20`)
      setData(result)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [status, page])

  return { data, loading, status, page, load }
}
