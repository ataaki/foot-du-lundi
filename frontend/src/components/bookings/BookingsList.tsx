import { useState } from 'react'
import { TabGroup, TabList, Tab } from '@headlessui/react'
import { formatDate, formatTime, formatDuration, formatPrice } from '../../lib/format'
import type { BookingsResponse } from '../../types'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import Pagination from './Pagination'

interface BookingsListProps {
  data: BookingsResponse | null
  loading: boolean
  status: 'upcoming' | 'past'
  page: number
  onLoad: (status: 'upcoming' | 'past', page: number) => void
  onCancel: (bookingId: string, date: string, time: string, playground: string) => void
  onRefresh: () => void
}

export default function BookingsList({ data, loading, status, page, onLoad, onCancel, onRefresh }: BookingsListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const tabIndex = status === 'upcoming' ? 0 : 1

  async function handleCancel(id: string, date: string, time: string, pg: string) {
    setCancellingId(id)
    await onCancel(id, date, time, pg)
    setCancellingId(null)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3">
        <TabGroup selectedIndex={tabIndex} onChange={(i) => onLoad(i === 0 ? 'upcoming' : 'past', 1)}>
          <TabList className="flex gap-2 border-b-2 border-slate-100 pb-0">
            {['À venir', 'Passées'].map((label) => (
              <Tab
                key={label}
                className={({ selected }) =>
                  `px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] transition cursor-pointer focus:outline-none
                  ${selected ? 'text-slate-900 border-slate-900 font-semibold' : 'text-slate-500 border-transparent hover:text-slate-700'}`
                }
              >
                {label}
              </Tab>
            ))}
          </TabList>
        </TabGroup>
        <Button variant="secondary" size="sm" onClick={onRefresh}>Actualiser</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
          <Spinner />
          <span>Chargement...</span>
        </div>
      ) : !data?.bookings?.length ? (
        <div className="text-center py-10">
          <p className="text-sm font-medium text-slate-600">
            {status === 'upcoming' ? 'Aucune reservation a venir' : 'Aucune reservation passee'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {status === 'upcoming' ? 'Vos prochaines reservations apparaitront ici.' : 'Votre historique de reservations est vide.'}
          </p>
        </div>
      ) : (
        <>
          <div className="px-4 py-2 text-xs text-slate-400 bg-slate-50">
            Page {page} / {data.totalPages} · {data.total} réservation{data.total > 1 ? 's' : ''}
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-slate-100">
            {data.bookings.map((b) => (
              <div key={b.id} className={`p-4 ${b.canceled ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900 text-sm">{formatDate(b.date)}</span>
                  {b.canceled ? (
                    <Badge variant="error">Annulée</Badge>
                  ) : b.confirmed ? (
                    <Badge variant="success">Confirmée</Badge>
                  ) : (
                    <Badge variant="pending">Non confirmée</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs">Début</span>
                    <p className="text-slate-700">{formatTime(b.startAt)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">Durée</span>
                    <p className="text-slate-700">{formatDuration((new Date(b.endAt).getTime() - new Date(b.startAt).getTime()) / 60000)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">Terrain</span>
                    <p className="text-slate-700">{b.playground || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">Prix</span>
                    <p className="text-slate-700">{formatPrice(b.pricePerParticipant)}/pers</p>
                  </div>
                </div>
                {status === 'upcoming' && !b.canceled && (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={cancellingId === b.id}
                    onClick={() => handleCancel(b.id, b.date, formatTime(b.startAt), b.playground)}
                    className="w-full mt-3"
                  >
                    Annuler
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Début</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Durée</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Terrain</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Prix</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
                  {status === 'upcoming' && <th className="px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody>
                {data.bookings.map((b) => (
                  <tr
                    key={b.id}
                    className={`border-t border-slate-100 hover:bg-slate-50 transition-colors ${b.canceled ? 'opacity-60 [&_td]:line-through' : ''}`}
                  >
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{formatDate(b.date)}</td>
                    <td className="px-4 py-2.5 text-slate-500">{formatTime(b.startAt)}</td>
                    <td className="px-4 py-2.5 text-slate-500">{formatDuration((new Date(b.endAt).getTime() - new Date(b.startAt).getTime()) / 60000)}</td>
                    <td className="px-4 py-2.5 text-slate-500">{b.playground || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-500">{formatPrice(b.pricePerParticipant)}/pers</td>
                    <td className="px-4 py-2.5">
                      {b.canceled ? (
                        <Badge variant="error">Annulée</Badge>
                      ) : b.confirmed ? (
                        <Badge variant="success">Confirmée</Badge>
                      ) : (
                        <Badge variant="pending">Non confirmée</Badge>
                      )}
                    </td>
                    {status === 'upcoming' && (
                      <td className="px-4 py-2.5">
                        {!b.canceled && (
                          <Button
                            variant="danger"
                            size="sm"
                            loading={cancellingId === b.id}
                            onClick={() => handleCancel(b.id, b.date, formatTime(b.startAt), b.playground)}
                          >
                            Annuler
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={data.totalPages} onPageChange={(p) => onLoad(status, p)} />
        </>
      )}
    </div>
  )
}
