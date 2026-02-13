const DAY_NAMES = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const [y, m, d] = dateStr.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return `${DAY_NAMES[date.getDay()]} ${d}/${m}/${y}`
}

export function formatDateTime(dtStr: string | null | undefined): string {
  if (!dtStr) return '-'
  const d = new Date(dtStr + 'Z')
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '-'
  return new Date(isoStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

export function formatPrice(cents: number | null | undefined): string {
  if (cents == null) return '-'
  return `${(cents / 100).toFixed(2)} EUR`
}
