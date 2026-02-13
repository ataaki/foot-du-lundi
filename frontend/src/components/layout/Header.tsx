import Button from '../ui/Button'

interface HeaderProps {
  onOpenSettings: () => void
}

export default function Header({ onOpenSettings }: HeaderProps) {
  return (
    <header className="bg-slate-900 relative overflow-hidden -mx-5 max-sm:-mx-3">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_600px_300px_at_80%_20%,rgba(56,189,248,0.12),transparent_70%),radial-gradient(ellipse_400px_200px_at_20%_80%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />
      <div className="max-w-5xl mx-auto px-5 py-7 relative flex items-center justify-between max-sm:px-3 max-sm:py-5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-xl shadow-[0_0_20px_rgba(56,189,248,0.3)]">
            ⚽
          </div>
          <h1 className="text-[22px] font-bold text-white tracking-tight max-sm:text-lg">Foot Du Lundi</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="icon"
            onClick={onOpenSettings}
            className="!text-white/60 !border-white/15 hover:!text-white hover:!bg-white/10"
          >
            ⚙
          </Button>
          <div className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_theme(colors.emerald.500)] animate-pulse" />
            Scheduler actif
          </div>
        </div>
      </div>
    </header>
  )
}
