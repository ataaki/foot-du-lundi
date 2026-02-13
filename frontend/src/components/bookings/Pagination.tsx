import Button from '../ui/Button'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = generatePageNumbers(page, totalPages)

  return (
    <div className="flex items-center justify-center gap-3 mt-4 p-4 bg-slate-50 rounded-lg flex-wrap max-sm:gap-2">
      <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => onPageChange(1)}>⏮</Button>
      <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>← Préc</Button>

      <div className="flex items-center gap-1 mx-3 max-sm:order-3 max-sm:w-full max-sm:justify-center max-sm:my-2">
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-2 text-slate-400 text-sm">...</span>
          ) : (
            <button
              key={p}
              disabled={p === page}
              onClick={() => onPageChange(p as number)}
              className={`min-w-9 h-9 px-2 border rounded-lg text-sm font-medium transition cursor-pointer
                ${p === page
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900 hover:text-slate-900'
                }`}
            >
              {p}
            </button>
          ),
        )}
      </div>

      <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Suiv →</Button>
      <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => onPageChange(totalPages)}>⏭</Button>
    </div>
  )
}

function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]
  const start = Math.max(2, current - 2)
  const end = Math.min(total - 1, current + 2)

  if (start > 2) pages.push('...')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('...')
  if (total > 1) pages.push(total)

  return pages
}
