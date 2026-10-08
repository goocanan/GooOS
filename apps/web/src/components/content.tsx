import { Link } from 'react-router-dom'
import { cn, dueLabel } from '@/lib/utils'
import { Badge, Avatar, Progress } from '@/components/ui'
import { STATUS_META, PRIORITY_META, type Content } from '@/lib/types'
import type { PlatformMeta, User } from '@/lib/types'

export function PlatformChip({
  meta,
  className,
  showLabel = true,
  size = 'sm',
}: {
  meta: PlatformMeta
  className?: string
  showLabel?: boolean
  size?: 'xs' | 'sm'
}) {
  return (
    <span
      title={meta.label}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-semibold',
        size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        className,
      )}
      style={{
        color: meta.color,
        borderColor: `color-mix(in oklab, ${meta.color} 30%, transparent)`,
        background: `color-mix(in oklab, ${meta.color} 12%, transparent)`,
      }}
    >
      {meta.short}
      {showLabel && <span className="font-medium">{meta.label}</span>}
    </span>
  )
}

export function StatusBadge({ status, size = 'sm' }: { status: Content['status']; size?: 'xs' | 'sm' }) {
  const meta = STATUS_META[status]
  return (
    <Badge color={meta.color} size={size} dot>
      {meta.label}
    </Badge>
  )
}

export function PriorityBadge({ priority, size = 'sm' }: { priority: Content['priority']; size?: 'xs' | 'sm' }) {
  const meta = PRIORITY_META[priority]
  if (priority === 'low') return null
  return (
    <Badge color={meta.color} size={size}>
      {meta.label}
    </Badge>
  )
}

export function DueChip({ content, className }: { content: Content; className?: string }) {
  const info = dueLabel(content.deadline)
  if (!info) return null
  const color =
    info.tone === 'danger' ? '#ef4444' : info.tone === 'warn' ? '#f59e0b' : '#94a3b8'
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-[10px] font-medium', className)}
      style={{ color }}
    >
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 3.4V6l1.8 1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {info.text}
    </span>
  )
}

/** Abstract, deterministic thumbnail block — no real media in this prototype. */
export function ContentThumb({
  content,
  className,
  ratio = 'aspect-video',
}: {
  content: Content
  className?: string
  ratio?: string
}) {
  const base = content.thumbnailColor
  const id = content.id.replace(/[^a-z0-9]/gi, '')
  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-lg', ratio, className)}
      style={{ background: `linear-gradient(135deg, ${base}, color-mix(in oklab, ${base} 40%, #0c0c11))` }}
    >
      <svg viewBox="0 0 160 90" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="160" height="90" fill={`url(#g-${id})`} />
        <circle cx={124} cy={22} r={34} fill="#fff" opacity="0.06" />
        <circle cx={34} cy={74} r={22} fill="#fff" opacity="0.05" />
        <path
          d="M0 90 L44 58 L78 74 L112 46 L160 70 L160 90 Z"
          fill="#000"
          opacity="0.18"
        />
      </svg>
      <div className="absolute inset-0 flex items-end justify-between p-2">
        <span className="rounded bg-black/45 px-1.5 py-0.5 font-mono text-[9px] font-medium text-white/90 backdrop-blur-sm">
          #{content.ref}
        </span>
        <span className="rounded bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold text-white/90 backdrop-blur-sm">
          {content.platforms.length > 1 ? `${content.platforms.length} platform` : ''}
        </span>
      </div>
    </div>
  )
}

/** Card used in the list view / board column. */
export function ContentCard({
  content,
  platformMeta,
  creator,
  showProgress = true,
  compact = false,
  onClick,
  dragging,
}: {
  content: Content
  platformMeta: PlatformMeta
  creator?: User
  showProgress?: boolean
  compact?: boolean
  onClick?: () => void
  dragging?: boolean
}) {
  const due = dueLabel(content.deadline)
  return (
    <Link
      to={`/content/${content.id}`}
      onClick={onClick}
      draggable={false}
      className={cn(
        'group block rounded-xl border border-ink-700/70 bg-ink-900 p-2.5 transition-all',
        'hover:border-ink-600 hover:bg-ink-850',
        dragging && 'drag-ghost pointer-events-none',
        compact && 'p-2',
      )}
    >
      <ContentThumb content={content} ratio={compact ? 'aspect-[16/9]' : 'aspect-video'} />
      <div className={cn('space-y-1.5', compact ? 'pt-2' : 'pt-2.5')}>
        <div className="flex items-start gap-1.5">
          <h3 className="min-w-0 flex-1 text-[12px] font-medium leading-snug text-ink-100 line-clamp-2">
            {content.title}
          </h3>
          <PriorityBadge priority={content.priority} size="xs" />
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <PlatformChip meta={platformMeta} size="xs" showLabel={false} />
          {content.platforms
            .slice(1, 3)
            .map((v) => (
              <span
                key={v.platform}
                title={v.platform}
                className="rounded border border-ink-600 px-1 py-0.5 text-[9px] font-semibold text-ink-400"
              >
                {v.platform.split('_').map((s) => s[0]!.toUpperCase()).join('').slice(0, 3)}
              </span>
            ))}
        </div>

        {showProgress && content.status !== 'published' && content.status !== 'archived' && (
          <div className="flex items-center gap-2">
            <Progress value={content.productionProgress} height={3} className="flex-1" />
            <span className="text-[9px] tabular-nums text-ink-500">{content.productionProgress}%</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          {creator ? (
            <Avatar name={creator.name} color={creator.avatarColor} size="xs" title={creator.name} />
          ) : (
            <span />
          )}
          {due && (
            <span
              className={cn(
                'text-[10px] font-medium',
                due.tone === 'danger'
                  ? 'text-red-400'
                  : due.tone === 'warn'
                    ? 'text-amber-400'
                    : 'text-ink-500',
              )}
            >
              {due.text}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}