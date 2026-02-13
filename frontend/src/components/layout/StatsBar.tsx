interface StatsBarProps {
  activeRules: number
  upcomingBookings: number
  advanceDays: number
  onEditAdvanceDays: () => void
}

export default function StatsBar({ activeRules, upcomingBookings, advanceDays, onEditAdvanceDays }: StatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-3.5 my-6 max-sm:gap-2 max-sm:my-4">
      <StatCard value={String(activeRules)} label="Règles actives" />
      <StatCard value={String(upcomingBookings)} label="Réservations à venir" />
      <StatCard
        value={`J-${advanceDays}`}
        label="Ouverture créneaux"
        onClick={onEditAdvanceDays}
        editable
      />
    </div>
  )
}

function StatCard({
  value,
  label,
  onClick,
  editable,
}: {
  value: string
  label: string
  onClick?: () => void
  editable?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 text-center border border-slate-200 shadow-sm transition-shadow hover:shadow-md
        max-sm:p-3 max-sm:rounded-lg
        ${editable ? 'cursor-pointer group relative hover:border-sky-500 hover:shadow-[0_0_0_1px_rgba(56,189,248,0.15)]' : ''}`}
    >
      {editable && (
        <span className="absolute top-1.5 right-2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity max-sm:opacity-50">
          ✎
        </span>
      )}
      <span className="block text-[28px] font-bold text-slate-900 leading-none max-sm:text-[22px]">{value}</span>
      <span className="block text-[11px] font-semibold text-slate-400 mt-1.5 uppercase tracking-wider max-sm:text-[9px]">{label}</span>
    </div>
  )
}
