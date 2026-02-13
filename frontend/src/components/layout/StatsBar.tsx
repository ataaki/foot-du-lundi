interface StatsBarProps {
  activeRules: number
  upcomingBookings: number
  advanceDays: number
  onEditAdvanceDays: () => void
}

export default function StatsBar({ activeRules, upcomingBookings, advanceDays, onEditAdvanceDays }: StatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-2 my-4 sm:gap-3.5 sm:my-6">
      <StatCard
        value={String(activeRules)}
        label="Regles actives"
        accent="border-t-emerald-500"
      />
      <StatCard
        value={String(upcomingBookings)}
        label="A venir"
        accent="border-t-sky-500"
      />
      <StatCard
        value={`J-${advanceDays}`}
        label="Ouverture"
        accent="border-t-amber-500"
        onClick={onEditAdvanceDays}
        editable
      />
    </div>
  )
}

function StatCard({
  value,
  label,
  accent,
  onClick,
  editable,
}: {
  value: string
  label: string
  accent: string
  onClick?: () => void
  editable?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 border-t-2 ${accent} shadow-sm transition-shadow hover:shadow-md
        sm:rounded-xl sm:p-4
        ${editable ? 'cursor-pointer group relative hover:border-sky-300 dark:hover:border-sky-600' : ''}`}
    >
      {editable && (
        <span className="absolute top-1.5 right-2 text-[10px] text-slate-400 opacity-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          modifier
        </span>
      )}
      <span className="block text-xl font-bold text-slate-900 dark:text-slate-100 leading-none sm:text-[28px]">{value}</span>
      <span className="block text-[10px] font-medium text-slate-400 mt-1.5 uppercase tracking-wider sm:text-[11px]">{label}</span>
    </div>
  )
}
