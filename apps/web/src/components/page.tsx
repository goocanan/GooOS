import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  actions,
  tabs,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  tabs?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('border-b border-ink-800 bg-ink-950/60 px-4 pt-5 sm:px-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[19px] font-semibold tracking-tight text-ink-100">{title}</h1>
          {description && <p className="mt-1 text-[13px] text-ink-400">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {tabs && <div className="mt-4 flex items-center gap-1 overflow-x-auto no-scrollbar">{tabs}</div>}
      {!tabs && <div className="h-4" />}
    </div>
  )
}

export function PageBody({
  children,
  className,
  width = 'wide',
}: {
  children: ReactNode
  className?: string
  width?: 'wide' | 'narrow'
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 py-5 sm:px-6',
        width === 'wide' ? 'max-w-[1500px]' : 'max-w-4xl',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>
  )
}

export function FilterChip({
  active,
  onClick,
  children,
  count,
  color,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  count?: number
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors',
        active
          ? 'border-brand-500/40 bg-brand-600/15 text-brand-100'
          : 'border-ink-700 bg-ink-900 text-ink-400 hover:border-ink-600 hover:text-ink-200',
      )}
      style={active && color ? { borderColor: `${color}66`, background: `${color}1f`, color } : undefined}
    >
      {children}
      {count != null && (
        <span className={cn('text-[10px] tabular-nums', active ? 'opacity-80' : 'text-ink-600')}>
          {count}
        </span>
      )}
    </button>
  )
}

export function StatRow({
  items,
}: {
  items: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'default' | 'brand' | 'success' | 'warn' }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink-700/70 bg-ink-700/70 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="bg-ink-900 px-4 py-3.5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-ink-500">{it.label}</div>
          <div
            className={cn(
              'mt-1.5 text-xl font-bold tabular-nums tracking-tight',
              it.tone === 'brand' && 'text-brand-300',
              it.tone === 'success' && 'text-emerald-300',
              it.tone === 'warn' && 'text-amber-300',
              (!it.tone || it.tone === 'default') && 'text-ink-100',
            )}
          >
            {it.value}
          </div>
          {it.sub && <div className="mt-0.5 text-[11px] text-ink-500">{it.sub}</div>}
        </div>
      ))}
    </div>
  )
}