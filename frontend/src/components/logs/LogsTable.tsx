import { useState, useMemo } from 'react'
import type { Log } from '../../types'
import { STATUS_LABELS } from '../../lib/constants'
import { formatDate, formatDateTime } from '../../lib/format'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

interface LogsTableProps {
  logs: Log[]
  onDelete: (ids: number[]) => Promise<void>
}

export default function LogsTable({ logs, onDelete }: LogsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const allChecked = useMemo(
    () => logs.length > 0 && logs.every((l) => selectedIds.has(l.id)),
    [logs, selectedIds],
  )

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(logs.map((l) => l.id)) : new Set())
  }

  function toggleOne(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }

  async function handleDelete() {
    if (selectedIds.size === 0) return
    setDeleting(true)
    try {
      await onDelete([...selectedIds])
      setSelectedIds(new Set())
    } finally {
      setDeleting(false)
    }
  }

  if (!logs.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <p className="text-center py-10 text-slate-400 text-sm">Aucun historique.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {selectedIds.size > 0 && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
          <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
            Supprimer ({selectedIds.size})
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-9 text-center px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="accent-slate-900 cursor-pointer"
                />
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date cible</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Heure visée</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Réservée</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Terrain</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="text-center px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(log.id)}
                    onChange={(e) => toggleOne(log.id, e.target.checked)}
                    className="accent-slate-900 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={log.rule_id != null ? 'auto' : 'manual'}>
                    {log.rule_id != null ? 'Auto' : 'Manuel'}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-slate-700">{formatDate(log.target_date)}</td>
                <td className="px-4 py-2.5 text-slate-500">{log.target_time}</td>
                <td className="px-4 py-2.5 text-slate-500">{log.booked_time || '-'}</td>
                <td className="px-4 py-2.5 text-slate-500">{log.playground || '-'}</td>
                <td className="px-4 py-2.5">
                  <Badge
                    variant={log.status as 'success' | 'failed' | 'no_slots' | 'pending' | 'skipped' | 'payment_failed' | 'cancelled'}
                    title={log.error_message || undefined}
                  >
                    {STATUS_LABELS[log.status] || log.status}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">{formatDateTime(log.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
