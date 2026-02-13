import { useToast } from '../../hooks/use-toast'
import type { ToastType } from '../../types'

const dotColors: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
}

const borderColors: Record<ToastType, string> = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  warning: 'border-l-amber-500',
  info: 'border-l-sky-500',
}

export default function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-3 right-3 z-[9999] flex flex-col gap-2.5 max-w-none pointer-events-none sm:top-5 sm:right-5 sm:left-auto sm:bottom-auto sm:max-w-md">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-lg border-l-4 ${borderColors[t.type]} animate-[slideIn_0.3s_ease-out]`}
        >
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${dotColors[t.type]}`} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{t.title}</div>
            {t.message && (
              <div className="text-xs text-slate-500 mt-0.5 break-words">{t.message}</div>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none shrink-0 cursor-pointer"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
