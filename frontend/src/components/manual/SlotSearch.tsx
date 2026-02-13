import { useState } from 'react'
import Button from '../ui/Button'

interface SlotSearchProps {
  loading: boolean
  onSearch: (params: { date: string; from: string; to: string; duration?: number }) => void
}

export default function SlotSearch({ loading, onSearch }: SlotSearchProps) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDate = tomorrow.toISOString().split('T')[0]

  const [date, setDate] = useState(defaultDate)
  const [from, setFrom] = useState('19:00')
  const [to, setTo] = useState('22:00')
  const [duration, setDuration] = useState<string>('')

  function handleSearch() {
    if (!date) return
    onSearch({ date, from, to, duration: duration ? Number(duration) : undefined })
  }

  const inputClass = 'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-base min-h-12 sm:text-sm sm:min-h-0 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500'

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-end">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">De</label>
          <input
            type="time"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">A</label>
          <input
            type="time"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Duree</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={inputClass}
          >
            <option value="">Toutes</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
            <option value="120">120 min</option>
          </select>
        </div>
        <Button variant="primary" onClick={handleSearch} loading={loading} className="w-full col-span-2 sm:col-span-1 sm:w-auto">
          Rechercher
        </Button>
      </div>
    </div>
  )
}
