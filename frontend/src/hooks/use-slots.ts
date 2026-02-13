import { useState, useCallback } from 'react'
import { api } from '../api/client'
import type { Slot, BookResult } from '../types'

export function useSlots() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (params: {
    date: string
    from?: string
    to?: string
    duration?: number
  }) => {
    setLoading(true)
    try {
      let url = `/slots?date=${params.date}`
      if (params.duration) url += `&duration=${params.duration}`
      if (params.from) url += `&from=${params.from}`
      if (params.to) url += `&to=${params.to}`
      const result = await api.get<Slot[]>(url)
      setSlots(result)
    } catch {
      setSlots([])
    } finally {
      setLoading(false)
    }
  }, [])

  const bookSlot = useCallback(async (params: {
    date: string
    startTime: string
    duration: number
    playgroundName: string
  }) => {
    return api.post<BookResult>('/book-manual', params)
  }, [])

  return { slots, loading, search, bookSlot }
}
