type BadgeVariant = 'success' | 'failed' | 'payment_failed' | 'no_slots' | 'pending' | 'skipped' | 'cancelled' | 'auto' | 'manual' | 'error'

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  failed: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  payment_failed: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  no_slots: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  pending: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  skipped: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  cancelled: 'bg-stone-100 text-stone-600 dark:bg-stone-500/15 dark:text-stone-400',
  auto: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  manual: 'bg-fuchsia-50 text-purple-700 dark:bg-fuchsia-500/15 dark:text-purple-400',
  error: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
}

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  failed: 'bg-red-500',
  payment_failed: 'bg-red-500',
  no_slots: 'bg-amber-500',
  pending: 'bg-blue-500',
  skipped: 'bg-violet-500',
  cancelled: 'bg-stone-400',
  auto: 'bg-sky-500',
  manual: 'bg-purple-500',
  error: 'bg-red-500',
}

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  title?: string
  className?: string
}

export default function Badge({ variant, children, title, className = '' }: BadgeProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${variantClasses[variant]} ${title ? 'cursor-help' : ''} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      {children}
    </span>
  )
}
