import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn, initials as toInitials, uid } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'subtle'
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'icon'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_8px_20px_-8px_rgba(210,58,103,0.7)]',
  secondary: 'bg-ink-750 text-ink-100 hover:bg-ink-700 border border-ink-600',
  ghost: 'text-ink-300 hover:text-ink-100 hover:bg-ink-800',
  outline: 'border border-ink-600 text-ink-200 hover:border-ink-500 hover:bg-ink-850',
  danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30',
  subtle: 'bg-ink-800/60 text-ink-300 hover:text-ink-100 hover:bg-ink-750',
}

const SIZES: Record<Size, string> = {
  xs: 'h-7 px-2 text-[11px] gap-1 rounded-md',
  sm: 'h-8 px-2.5 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-[13px] gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-lg',
  icon: 'h-8 w-8 justify-center rounded-md',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export function Button({
  className,
  variant = 'secondary',
  size = 'md',
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center font-medium transition-all duration-150 select-none whitespace-nowrap',
        'focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950',
        'disabled:opacity-45 disabled:pointer-events-none active:scale-[0.985]',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Icon button
// ---------------------------------------------------------------------------

export function IconButton({
  className,
  label,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-300 transition-colors',
        'hover:bg-ink-800 hover:text-ink-100 focus-visible:ring-2 focus-visible:ring-brand-500/60',
        'disabled:opacity-40 disabled:pointer-events-none',
        className,
      )}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export function Badge({
  className,
  color = '#94a3b8',
  children,
  dot,
  size = 'sm',
}: {
  className?: string
  color?: string
  children: ReactNode
  dot?: boolean
  size?: 'xs' | 'sm'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap',
        size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        className,
      )}
      style={{
        color,
        borderColor: `color-mix(in oklab, ${color} 32%, transparent)`,
        background: `color-mix(in oklab, ${color} 12%, transparent)`,
      }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-xl border border-ink-700/70 bg-ink-900', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-ink-700/70 px-4 py-3', className)}>
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && <div className="mt-0.5 text-ink-400">{icon}</div>}
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold tracking-tight text-ink-100">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

const AVATAR_SIZES = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-[11px]',
  lg: 'h-10 w-10 text-xs',
  xl: 'h-14 w-14 text-base',
}

export function Avatar({
  name,
  color = '#3d3d52',
  size = 'md',
  className,
  title,
}: {
  name: string
  color?: string
  size?: keyof typeof AVATAR_SIZES
  className?: string
  title?: string
}) {
  return (
    <span
      title={title ?? name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-black/30',
        AVATAR_SIZES[size],
        className,
      )}
      style={{
        background: `linear-gradient(145deg, ${color}, color-mix(in oklab, ${color} 55%, #000))`,
        color: '#fff',
      }}
    >
      {toInitials(name)}
    </span>
  )
}

export function AvatarStack({
  names,
  max = 4,
  size = 'sm',
}: {
  names: { name: string; color: string }[]
  max?: number
  size?: keyof typeof AVATAR_SIZES
}) {
  const shown = names.slice(0, max)
  const rest = names.length - shown.length
  return (
    <div className="flex items-center">
      {shown.map((n, i) => (
        <Avatar
          key={i}
          name={n.name}
          color={n.color}
          size={size}
          className={cn(i > 0 && '-ml-1.5', 'ring-2 ring-ink-900')}
        />
      ))}
      {rest > 0 && (
        <span className="-ml-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink-700 text-[10px] font-semibold text-ink-200 ring-2 ring-ink-900">
          +{rest}
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------

const FIELD_BASE =
  'w-full bg-ink-850 border border-ink-700 rounded-lg text-[13px] text-ink-100 placeholder:text-ink-500 transition-colors focus:border-brand-500/70 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:opacity-50'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD_BASE, 'h-9 px-3', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(FIELD_BASE, 'min-h-20 px-3 py-2 leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(FIELD_BASE, 'h-9 appearance-none pl-3 pr-8 cursor-pointer', className)}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
  required,
  className,
}: {
  label?: ReactNode
  hint?: ReactNode
  children: ReactNode
  required?: boolean
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-ink-400">
          {label}
          {required && <span className="text-brand-400">*</span>}
        </span>
      )}
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-500">{hint}</span>}
    </label>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between gap-4 text-left disabled:opacity-50',
        label && 'cursor-pointer',
      )}
    >
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-[13px] font-medium text-ink-100">{label}</span>}
          {description && <span className="mt-0.5 block text-xs text-ink-400">{description}</span>}
        </span>
      )}
      <span
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-ink-700',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4.5' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}

export function Checkbox({
  checked,
  onChange,
  className,
  ...props
}: { checked: boolean; onChange: (v: boolean) => void } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className={cn(
        'h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border border-ink-600 bg-ink-850 transition-colors',
        'checked:border-brand-500 checked:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500/50',
        className,
      )}
      style={
        checked
          ? {
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='white'%3E%3Cpath d='M13 4.5L6.5 11 3 7.5'  stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
              backgroundSize: '100%',
            }
          : undefined
      }
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export function Progress({
  value,
  className,
  color = 'var(--color-brand-500)',
  height = 6,
}: {
  value: number
  className?: string
  color?: string
  height?: number
}) {
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-ink-750', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

interface TabsCtx {
  value: string
  setValue: (v: string) => void
}
const TabsContext = createContext<TabsCtx | null>(null)

export function Tabs({
  value,
  onChange,
  children,
  className,
}: {
  value: string
  onChange: (v: string) => void
  children: ReactNode
  className?: string
}) {
  return (
    <TabsContext.Provider value={{ value, setValue: onChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn('no-scrollbar flex items-center gap-1 overflow-x-auto', className)}
    >
      {children}
    </div>
  )
}

export function Tab({
  value,
  children,
  count,
  className,
}: {
  value: string
  children: ReactNode
  count?: number
  className?: string
}) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tab must be inside <Tabs>')
  const active = ctx.value === value
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
        active
          ? 'bg-ink-750 text-ink-100 ring-1 ring-ink-600'
          : 'text-ink-400 hover:bg-ink-850 hover:text-ink-200',
        className,
      )}
    >
      {children}
      {count != null && (
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
            active ? 'bg-brand-600/25 text-brand-200' : 'bg-ink-750 text-ink-400',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Modal / Sheet
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  className,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div
        className="animate-fade-in fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'animate-scale-in relative my-auto w-full rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl shadow-black/60',
          widths[size],
          className,
        )}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-4 border-b border-ink-700 px-5 py-4">
            <div className="min-w-0">
              {title && <h2 className="text-[15px] font-semibold tracking-tight text-ink-100">{title}</h2>}
              {subtitle && <p className="mt-1 text-xs text-ink-400">{subtitle}</p>}
            </div>
            <IconButton label="Tutup" onClick={onClose} className="-mr-1 -mt-1">
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        )}
        <div className="max-h-[calc(100vh-16rem)] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-ink-700 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function Drawer({
  open,
  onClose,
  children,
  width = 480,
  side = 'right',
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  width?: number
  side?: 'right' | 'left'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="animate-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'absolute inset-y-0 flex w-full flex-col border-ink-700 bg-ink-900 shadow-2xl',
          side === 'right' ? 'animate-slide-right border-l' : 'border-r',
        )}
        style={{ maxWidth: width }}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function DrawerHeader({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  children?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-ink-700 px-5 py-4">
      <div className="min-w-0">
        <h2 className="truncate text-[15px] font-semibold text-ink-100">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {children}
        <IconButton label="Tutup" onClick={onClose}>
          <X className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dropdown menu
// ---------------------------------------------------------------------------

export function Dropdown({
  trigger,
  children,
  align = 'end',
  width = 200,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'start' | 'end'
  width?: number
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          className="animate-scale-in absolute z-40 mt-1.5 overflow-hidden rounded-xl border border-ink-700 bg-ink-850 p-1 shadow-2xl shadow-black/50"
          style={{ [align === 'end' ? 'right' : 'left']: 0, width }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  children,
  onClick,
  icon,
  danger,
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors disabled:opacity-40',
        danger
          ? 'text-red-300 hover:bg-red-500/15'
          : 'text-ink-200 hover:bg-ink-750 hover:text-ink-100',
      )}
    >
      {icon && <span className="text-ink-400">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  )
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-ink-700" />
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-ink-700 bg-ink-850 text-ink-400">
          {icon}
        </div>
      )}
      <p className="text-[13px] font-semibold text-ink-200">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tooltip (CSS only)
// ---------------------------------------------------------------------------

export function Tooltip({
  label,
  children,
  side = 'top',
}: {
  label: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}) {
  const pos = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }[side]
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-md border border-ink-700 bg-ink-800 px-2 py-1 text-[11px] font-medium text-ink-100 shadow-lg group-hover/tt:block animate-fade-in',
          pos,
        )}
      >
        {label}
      </span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------

export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Tersalin',
  size = 'xs',
  variant = 'ghost',
  className,
  onCopied,
}: {
  value: string | (() => string)
  label?: ReactNode
  copiedLabel?: ReactNode
  size?: Size
  variant?: Variant
  className?: string
  onCopied?: () => void
}) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={async () => {
        const text = typeof value === 'function' ? value() : value
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          const ta = document.createElement('textarea')
          ta.value = text
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          ta.remove()
        }
        setCopied(true)
        onCopied?.()
        window.setTimeout(() => setCopied(false), 1600)
      }}
    >
      {copied ? copiedLabel : label}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-ink-600 bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-ink-300">
      {children}
    </kbd>
  )
}

export function Divider({ className, label }: { className?: string; label?: string }) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <span className="h-px flex-1 bg-ink-700" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-ink-500">{label}</span>
        <span className="h-px flex-1 bg-ink-700" />
      </div>
    )
  }
  return <div className={cn('h-px w-full bg-ink-700/70', className)} />
}

export function SectionTitle({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-ink-100">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-ink-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-md bg-ink-800', className)}>
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          animation: 'cf-shimmer 1.6s infinite',
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.045), transparent)',
        }}
      />
    </div>
  )
}

export function useDebounced<T>(value: T, ms = 200) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms)
    return () => window.clearTimeout(t)
  }, [value, ms])
  return v
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* ignore */
    }
  }, [key, value])
  return [value, setValue] as const
}

export function CheckboxGroup<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T[]
  onChange: (v: T[]) => void
  options: { value: T; label: ReactNode }[]
  className?: string
}) {
  const id = useId()
  void id
  return (
    <div className={cn('space-y-1.5', className)}>
      {options.map((o) => {
        const checked = value.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            onClick={() =>
              onChange(checked ? value.filter((v) => v !== o.value) : [...value, o.value])
            }
            className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-left hover:bg-ink-850"
          >
            <Checkbox checked={checked} onChange={() => {}} className="pointer-events-none" />
            <span className="text-[13px] text-ink-200">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export { uid }