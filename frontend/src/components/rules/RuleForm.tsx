import { useState, useEffect } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { Fragment } from 'react'
import { DAY_OPTIONS, DURATION_OPTIONS } from '../../lib/constants'
import type { Rule, DashboardConfig } from '../../types'
import Button from '../ui/Button'
import PlaygroundPrefs from './PlaygroundPrefs'

interface RuleFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: { day_of_week: number; target_time: string; duration: number; playground_order: string[] | null }) => Promise<void>
  rule: Rule | null
  config: DashboardConfig
}

export default function RuleForm({ open, onClose, onSave, rule, config }: RuleFormProps) {
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [targetTime, setTargetTime] = useState('19:00')
  const [duration, setDuration] = useState(60)
  const [playgroundOrder, setPlaygroundOrder] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (rule) {
      setDayOfWeek(rule.day_of_week)
      setTargetTime(rule.target_time)
      setDuration(rule.duration)
      setPlaygroundOrder(rule.playground_order ?? [])
    } else {
      setDayOfWeek(1)
      setTargetTime('19:00')
      setDuration(60)
      setPlaygroundOrder([])
    }
  }, [rule, open])

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({
        day_of_week: dayOfWeek,
        target_time: targetTime,
        duration,
        playground_order: playgroundOrder.length > 0 ? playgroundOrder : null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-[10000]">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center sm:p-5">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-250"
            enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl rounded-b-none sm:rounded-b-2xl p-7 shadow-xl">
              <DialogTitle className="text-lg font-bold mb-5">
                {rule ? 'Modifier la règle' : 'Ajouter une règle'}
              </DialogTitle>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Jour</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-base min-h-12 sm:text-sm sm:min-h-0 bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    {DAY_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Heure</label>
                  <input
                    type="time"
                    value={targetTime}
                    onChange={(e) => setTargetTime(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-base min-h-12 sm:text-sm sm:min-h-0 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Durée</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-base min-h-12 sm:text-sm sm:min-h-0 bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Préférence de terrains (glisser pour ordonner, décocher pour exclure)
                </label>
                <PlaygroundPrefs
                  allNames={config.playground_names}
                  selected={playgroundOrder}
                  onChange={setPlaygroundOrder}
                />
              </div>

              <div className="flex flex-col-reverse gap-2.5 mt-6 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={onClose}>Annuler</Button>
                <Button variant="primary" onClick={handleSave} loading={saving}>Enregistrer</Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
