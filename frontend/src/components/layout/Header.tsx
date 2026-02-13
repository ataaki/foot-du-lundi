import Button from '../ui/Button'

interface HeaderProps {
  onOpenSettings: () => void
}

export default function Header({ onOpenSettings }: HeaderProps) {
  return (
    <header className="-mx-3 border-b border-slate-200 sm:-mx-5">
      <div className="max-w-5xl mx-auto px-3 py-4 flex items-center justify-between sm:px-5 sm:py-5">
        <h1 className="text-base font-bold text-slate-900 tracking-tight sm:text-lg">Foot Du Lundi</h1>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Scheduler actif</span>
          </div>
          <Button
            variant="icon"
            size="sm"
            onClick={onOpenSettings}
          >
            Parametres
          </Button>
        </div>
      </div>
    </header>
  )
}
