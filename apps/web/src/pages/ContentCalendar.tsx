import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  List as ListIcon,
  Rows3,
  Sun,
  Clock,
  Copy,
  ExternalLink,
  Check,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { PageBody, PageHeader, FilterChip } from '@/components/page'
import {
  Button,
  Card,
  EmptyState,
  Modal,
  Input,
  Select,
  Field,
  CopyButton,
} from '@/components/ui'
import { PlatformChip, StatusBadge } from '@/components/content'
import type { Content, Platform, PlatformMeta } from '@/lib/types'
import {
  addDays,
  cn,
  fmtDate,
  fmtDateTime,
  monthName,
  dayName,
  sameDay,
  startOfWeek,
  toLocalInput,
} from '@/lib/utils'

type CalView = 'month' | 'week' | 'day' | 'list'
type MetaFn = (p: Platform) => PlatformMeta
type Row = { content: Content; dateIso: string; platform: Platform; published: boolean }

export default function ContentCalendar() {
  const { workspaceContents, platformMeta, actions, toast } = useStore()
  const [view, setView] = useState<CalView>('month')
  const [cursor, setCursor] = useState(() => new Date())
  const [platformFilter, setPlatformFilter] = useState<Platform[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [dragId, setDragId] = useState<string | null>(null)
  const [overDay, setOverDay] = useState<string | null>(null)
  const [scheduleTarget, setScheduleTarget] = useState<Content | null>(null)

  const scheduled = useMemo<Row[]>(() => {
    return workspaceContents
      .filter((c) => c.status !== 'archived')
      .map((c) => {
        const variant = c.platforms.find((v) => v.scheduledAt ?? v.publishedAt)
        const dateIso = variant?.scheduledAt ?? variant?.publishedAt ?? c.publishedAt ?? c.deadline
        return {
          content: c,
          dateIso,
          platform: variant?.platform ?? c.type,
          published: Boolean(variant?.publishedAt),
        }
      })
      .filter((r): r is Row => Boolean(r.dateIso))
      .filter((r) => {
        if (platformFilter.length && !platformFilter.includes(r.platform)) return false
        if (statusFilter.length && !statusFilter.includes(r.content.status)) return false
        return true
      })
  }, [workspaceContents, platformFilter, statusFilter])

  const byDate = useMemo(() => {
    const map = new Map<string, Row[]>()
    scheduled.forEach((r) => {
      const key = new Date(r.dateIso).toDateString()
      const list = map.get(key) ?? []
      list.push(r)
      map.set(key, list)
    })
    return map
  }, [scheduled])

  const shift = (dir: number) => {
    const next = new Date(cursor)
    if (view === 'month') next.setMonth(next.getMonth() + dir)
    else if (view === 'week') next.setDate(next.getDate() + dir * 7)
    else next.setDate(next.getDate() + dir)
    setCursor(next)
  }

  const dropOn = (day: Date) => {
    if (!dragId) return
    const content = workspaceContents.find((c) => c.id === dragId)
    const target = scheduled.find((s) => s.content.id === dragId)
    const keepHour = target ? new Date(target.dateIso).getHours() : 19
    const d = new Date(day)
    d.setHours(keepHour, 0, 0, 0)
    if (content) {
      const variantIndex = content.platforms.findIndex((v) => v.scheduledAt ?? v.publishedAt)
      const idx = variantIndex >= 0 ? variantIndex : 0
      void actions.updateContent(dragId, {
          scheduledAt: d.toISOString(),
          platforms: content.platforms.map((p, i) =>
            i === idx ? { ...p, scheduledAt: d.toISOString() } : p,
          ),
        })
      toast(`${content.title} dijadwalkan ${fmtDate(d.toISOString(), { withYear: false })}`)
    }
    setDragId(null)
    setOverDay(null)
  }

  const headerLabel = () => {
    if (view === 'month') return `${monthName(cursor.getMonth())} ${cursor.getFullYear()}`
    if (view === 'week') {
      const s = startOfWeek(cursor)
      const e = addDays(s, 6)
      return `${s.getDate()} ${monthName(s.getMonth())} - ${e.getDate()} ${monthName(e.getMonth())} ${e.getFullYear()}`
    }
    return fmtDate(cursor.toISOString())
  }

  const statusOptions = [
    'idea', 'planned', 'script', 'production', 'editing', 'review', 'approved', 'scheduled', 'published',
  ]

  return (
    <>
      <PageHeader
        title="Content Calendar"
        description="Jadwal publish dan deadline konten lintas platform"
        actions={
          <>
            <div className="flex items-center rounded-lg border border-ink-700 bg-ink-900 p-0.5">
              {(
                [
                  ['month', CalendarDays, 'Month'],
                  ['week', Rows3, 'Week'],
                  ['day', Sun, 'Day'],
                  ['list', ListIcon, 'List'],
                ] as const
              ).map(([v, Icon, label]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-colors',
                    view === v ? 'bg-ink-750 text-ink-100' : 'text-ink-400 hover:text-ink-200',
                  )}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <Link to="/content?create=1">
              <Button variant="primary" size="sm">
                <Plus className="h-3.5 w-3.5" />
                New
              </Button>
            </Link>
          </>
        }
      />

      <PageBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => shift(-1)} aria-label="Sebelumnya">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setCursor(new Date())}>
              Hari ini
            </Button>
            <Button size="icon" variant="ghost" onClick={() => shift(1)} aria-label="Berikutnya">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-[15px] font-semibold tracking-tight text-ink-100">{headerLabel()}</h2>

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {(['tiktok', 'instagram_reel', 'youtube', 'youtube_short'] as Platform[]).map((p) => (
              <FilterChip
                key={p}
                active={platformFilter.includes(p)}
                color={platformMeta(p).color}
                onClick={() =>
                  setPlatformFilter((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
                }
              >
                {platformMeta(p).label}
              </FilterChip>
            ))}
            <Select
              value=""
              onChange={(e) => {
                if (!e.target.value) return
                setStatusFilter((prev) => (prev.includes(e.target.value) ? prev : [...prev, e.target.value]))
              }}
              className="h-7 w-auto text-[11px]"
            >
              <option value="">+ Status</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {platformFilter.length > 0 || statusFilter.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-500">
              {platformFilter.length + statusFilter.length} filter aktif - {scheduled.length} item terjadwal
            </span>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                setPlatformFilter([])
                setStatusFilter([])
              }}
            >
              Clear
            </Button>
          </div>
        ) : null}

        {view === 'month' && (
          <MonthView
            cursor={cursor}
            byDate={byDate}
            dragId={dragId}
            setDragId={setDragId}
            overDay={overDay}
            setOverDay={setOverDay}
            dropOn={dropOn}
            onEditSchedule={setScheduleTarget}
          />
        )}
        {view === 'week' && (
          <WeekView
            cursor={cursor}
            byDate={byDate}
            platformMeta={platformMeta}
            dropOn={dropOn}
            overDay={overDay}
            setOverDay={setOverDay}
            onEditSchedule={setScheduleTarget}
          />
        )}
        {view === 'day' && (
          <DayView cursor={cursor} byDate={byDate} platformMeta={platformMeta} onEditSchedule={setScheduleTarget} />
        )}
        {view === 'list' && (
          <ListView rows={scheduled} platformMeta={platformMeta} onEditSchedule={setScheduleTarget} />
        )}
      </PageBody>

      <ScheduleModal
        content={scheduleTarget}
        onClose={() => setScheduleTarget(null)}
        platformMeta={platformMeta}
      />
    </>
  )
}

function Pill({
  row,
  platformMeta,
  onDragStart,
  onDragEnd,
  onClick,
  dragging,
  compactMode,
}: {
  row: Row
  platformMeta: MetaFn
  onDragStart?: () => void
  onDragEnd?: () => void
  onClick?: () => void
  dragging?: boolean
  compactMode?: boolean
}) {
  const meta = platformMeta(row.platform)
  return (
    <div
      draggable={Boolean(onDragStart)}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', row.content.id)
        onDragStart?.()
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      title={`#${row.content.ref} ${row.content.title}`}
      className={cn(
        'group/pill relative cursor-pointer truncate rounded px-1.5 py-1 text-[10px] font-medium transition-all hover:brightness-125',
        dragging && 'drag-ghost',
        compactMode && 'py-0.5 text-[9px]',
      )}
      style={{
        background: `color-mix(in oklab, ${meta.color} 20%, var(--color-ink-850))`,
        color: meta.color,
        borderLeft: `2px solid ${meta.color}`,
      }}
    >
      {!compactMode && <span className="mr-1 font-mono opacity-70">{meta.short}</span>}
      {row.content.title}
      {row.published && <Check className="ml-1 inline h-2.5 w-2.5" />}
    </div>
  )
}

function MonthView({
  cursor,
  byDate,
  dragId,
  setDragId,
  overDay,
  setOverDay,
  dropOn,
  onEditSchedule,
}: {
  cursor: Date
  byDate: Map<string, Row[]>
  dragId: string | null
  setDragId: (id: string | null) => void
  overDay: string | null
  setOverDay: Dispatch<SetStateAction<string | null>>
  dropOn: (d: Date) => void
  onEditSchedule: (c: Content) => void
}) {
  const { platformMeta } = useStore()
  const today = new Date()

  const weeks = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const start = startOfWeek(first)
    let d = new Date(start)
    const out: Date[][] = []
    for (let w = 0; w < 6; w++) {
      out.push(Array.from({ length: 7 }, (_, i) => addDays(d, i)))
      d = addDays(d, 7)
    }
    return out
  }, [cursor])

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-ink-800 bg-ink-900">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
          <div
            key={d}
            className={cn(
              'px-2 py-2 text-[10px] font-semibold uppercase tracking-wider',
              i > 4 ? 'text-ink-600' : 'text-ink-500',
            )}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.map((week, wi) => (
          <div key={wi} className="contents">
            {week.map((day) => {
              const key = day.toDateString()
              const rows = byDate.get(key) ?? []
              const inMonth = day.getMonth() === cursor.getMonth()
              const isToday = sameDay(day, today)
              return (
                <div
                  key={key}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setOverDay(key)
                  }}
                  onDragLeave={() => setOverDay((v) => (v === key ? null : v))}
                  onDrop={(e) => {
                    e.preventDefault()
                    dropOn(day)
                  }}
                  className={cn(
                    'min-h-[112px] border-b border-r border-ink-800 p-1.5 transition-colors',
                    !inMonth && 'bg-ink-950/40',
                    overDay === key && 'bg-brand-950/30 ring-1 ring-inset ring-brand-500/40',
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        'flex h-5 min-w-5 items-center justify-center rounded px-1 text-[11px] font-semibold tabular-nums',
                        isToday ? 'bg-brand-600 text-white' : inMonth ? 'text-ink-300' : 'text-ink-600',
                      )}
                    >
                      {day.getDate()}
                    </span>
                    {rows.length > 2 && (
                      <span className="text-[9px] tabular-nums text-ink-600">{rows.length}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {rows.slice(0, 3).map((r, i) => (
                      <Pill
                        key={`${r.content.id}-${i}`}
                        row={r}
                        platformMeta={platformMeta}
                        dragging={dragId === r.content.id}
                        onDragStart={() => setDragId(r.content.id)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => onEditSchedule(r.content)}
                        compactMode
                      />
                    ))}
                    {rows.length > 3 && (
                      <div className="px-1 text-[9px] text-ink-600">+{rows.length - 3} lainnya</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-ink-800 bg-ink-900 px-3 py-2">
        <span className="inline-flex items-center gap-1 text-[10px] text-ink-500">
          <Check className="h-3 w-3 text-emerald-400" /> Published
        </span>
        <span className="text-[10px] text-ink-600">Drag kartu untuk menjadwalkan ulang</span>
        <span className="ml-auto text-[10px] text-ink-600">Timezone: Asia/Jakarta</span>
      </div>
    </Card>
  )
}

function WeekView({
  cursor,
  byDate,
  platformMeta,
  dropOn,
  overDay,
  setOverDay,
  onEditSchedule,
}: {
  cursor: Date
  byDate: Map<string, Row[]>
  platformMeta: MetaFn
  dropOn: (d: Date) => void
  overDay: string | null
  setOverDay: Dispatch<SetStateAction<string | null>>
  onEditSchedule: (c: Content) => void
}) {
  const start = startOfWeek(cursor)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const today = new Date()

  return (
    <div className="grid gap-3 lg:grid-cols-7">
      {days.map((day) => {
        const key = day.toDateString()
        const rows = byDate.get(key) ?? []
        const isToday = sameDay(day, today)
        return (
          <div
            key={key}
            onDragOver={(e) => {
              e.preventDefault()
              setOverDay(key)
            }}
            onDragLeave={() => setOverDay((v) => (v === key ? null : v))}
            onDrop={(e) => {
              e.preventDefault()
              dropOn(day)
            }}
            className={cn(
              'flex min-h-[420px] flex-col rounded-xl border bg-ink-900/50 p-2 transition-colors',
              isToday ? 'border-brand-700/50' : 'border-ink-800',
              overDay === key && 'bg-brand-950/30 ring-1 ring-brand-500/40',
            )}
          >
            <div className="mb-2 flex items-baseline justify-between border-b border-ink-800 pb-2">
              <span className="text-[10px] uppercase tracking-wider text-ink-500">{dayName(day.getDay())}</span>
              <span className={cn('text-base font-bold tabular-nums', isToday ? 'text-brand-300' : 'text-ink-300')}>
                {day.getDate()}
              </span>
            </div>
            <div className="flex-1 space-y-1.5">
              {rows.length === 0 && <div className="py-6 text-center text-[10px] text-ink-700">Kosong</div>}
              {rows.map((r, i) => (
                <button
                  key={`${r.content.id}-${i}`}
                  onClick={() => onEditSchedule(r.content)}
                  className="w-full rounded-lg border border-ink-800 bg-ink-850 p-2 text-left transition-colors hover:border-ink-600 hover:bg-ink-800"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-1">
                    <PlatformChip meta={platformMeta(r.platform)} size="xs" showLabel={false} />
                    <span className="text-[9px] tabular-nums text-ink-600">
                      {new Date(r.dateIso).getHours()}:00
                    </span>
                  </div>
                  <div className="line-clamp-2 text-[11px] font-medium leading-snug text-ink-100">
                    {r.content.title}
                  </div>
                  <div className="mt-1.5">
                    <StatusBadge status={r.content.status} size="xs" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DayView({
  cursor,
  byDate,
  platformMeta,
  onEditSchedule,
}: {
  cursor: Date
  byDate: Map<string, Row[]>
  platformMeta: MetaFn
  onEditSchedule: (c: Content) => void
}) {
  const rows = byDate.get(cursor.toDateString()) ?? []
  const hours = Array.from({ length: 20 }, (_, i) => i + 5)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="overflow-hidden">
        <div className="border-b border-ink-800 px-4 py-3">
          <h3 className="text-[13px] font-semibold text-ink-100">{fmtDate(cursor.toISOString())}</h3>
          <p className="mt-0.5 text-[11px] text-ink-500">{dayName(cursor.getDay())}</p>
        </div>
        <div className="relative">
          {hours.map((h) => {
            const rowsHere = rows.filter((r) => new Date(r.dateIso).getHours() === h)
            return (
              <div
                key={h}
                className="flex min-h-[52px] border-b border-ink-800/60 transition-colors hover:bg-ink-850/40"
              >
                <div className="w-16 shrink-0 border-r border-ink-800 px-2 py-1.5 text-[10px] tabular-nums text-ink-600">
                  {String(h).padStart(2, '0')}:00
                </div>
                <div className="flex-1 space-y-1 p-1.5">
                  {rowsHere.map((r, i) => (
                    <div key={i} onClick={() => onEditSchedule(r.content)} className="cursor-pointer">
                      <Pill row={r} platformMeta={platformMeta} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <div className="border-b border-ink-800 px-4 py-2.5">
          <h4 className="text-[12px] font-semibold text-ink-200">Agenda hari ini</h4>
        </div>
        <div className="divide-y divide-ink-800">
          {rows.length === 0 && <EmptyState title="Tidak ada agenda" description="Belum ada konten terjadwal hari ini." />}
          {rows.map((r, i) => (
            <button
              key={i}
              onClick={() => onEditSchedule(r.content)}
              className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-ink-850"
            >
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium text-ink-100">{r.content.title}</span>
                <span className="mt-1 flex items-center gap-1.5">
                  <PlatformChip meta={platformMeta(r.platform)} size="xs" showLabel={false} />
                  <span className="text-[10px] tabular-nums text-ink-500">
                    {new Date(r.dateIso).getHours()}:00
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

function ListView({
  rows,
  platformMeta,
  onEditSchedule,
}: {
  rows: Row[]
  platformMeta: MetaFn
  onEditSchedule: (c: Content) => void
}) {
  const sorted = [...rows].sort((a, b) => new Date(a.dateIso).getTime() - new Date(b.dateIso).getTime())
  const grouped = sorted.reduce<Record<string, Row[]>>((acc, r) => {
    const key = fmtDate(r.dateIso)
    ;(acc[key] ||= []).push(r)
    return acc
  }, {})

  if (sorted.length === 0)
    return (
      <Card>
        <EmptyState title="Tidak ada jadwal" description="Belum ada konten dengan tanggal publish atau deadline." />
      </Card>
    )

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <div className="mb-2 flex items-baseline gap-2">
            <h3 className="text-[13px] font-semibold text-ink-100">{date}</h3>
            <span className="text-[11px] text-ink-600">
              {items.length} item - {dayName(new Date(items[0]!.dateIso).getDay())}
            </span>
          </div>
          <Card className="divide-y divide-ink-800">
            {items.map((r, i) => (
              <button
                key={i}
                onClick={() => onEditSchedule(r.content)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-850"
              >
                <span className="w-12 shrink-0 text-[11px] font-semibold tabular-nums text-ink-300">
                  {new Date(r.dateIso).getHours()}:00
                </span>
                <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: r.content.thumbnailColor }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink-100">{r.content.title}</span>
                  <span className="mt-0.5 block text-[10px] text-ink-500">
                    #{r.content.ref} - {r.published ? 'Published' : 'Scheduled'}
                  </span>
                </span>
                <PlatformChip meta={platformMeta(r.platform)} size="xs" />
                <StatusBadge status={r.content.status} size="xs" />
              </button>
            ))}
          </Card>
        </div>
      ))}
    </div>
  )
}

function ScheduleModal({
  content,
  onClose,
  platformMeta,
}: {
  content: Content | null
  onClose: () => void
  platformMeta: MetaFn
}) {
  const { actions, toast } = useStore()
  const [dateTime, setDateTime] = useState('')
  const [timezone, setTimezone] = useState('Asia/Jakarta')

  useEffect(() => {
    if (!content) return
    const iso = content.platforms.find((v) => v.scheduledAt)?.scheduledAt ?? content.scheduledAt
    setDateTime(toLocalInput(iso ?? new Date().toISOString()))
  }, [content])

  if (!content) return null
  const meta = platformMeta(content.type)

  return (
    <Modal
      open={Boolean(content)}
      onClose={onClose}
      size="sm"
      title={`Jadwalkan #${content.ref}`}
      subtitle={content.title}
      footer={
        <>
          <CopyButton
            value={() =>
              [
                content.title,
                `Platform: ${content.platforms.map((p) => platformMeta(p.platform).label).join(', ')}`,
                `Jadwal: ${dateTime ? fmtDateTime(new Date(dateTime).toISOString()) : '-'} ${timezone}`,
                '',
                content.platforms[0]?.caption ?? '',
              ].join('\n')
            }
            label="Copy & publish"
            copiedLabel="Payload disalin"
            size="sm"
            variant="secondary"
            onCopied={() => toast('Caption dan jadwal siap di-paste ke aplikasi platform.', 'info')}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const iso = new Date(dateTime).toISOString()
              const variantIndex = content.platforms.findIndex((v) => v.scheduledAt)
              const idx = variantIndex >= 0 ? variantIndex : 0
              void actions.updateContent(content.id, {
                  scheduledAt: iso,
                  status: 'scheduled',
                  platforms: content.platforms.map((p, i) =>
                    i === idx ? { ...p, scheduledAt: iso } : p,
                  ),
                })
              toast(`#${content.ref} dijadwalkan ${fmtDate(iso)}`)
              onClose()
            }}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Simpan jadwal
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 rounded-lg border border-ink-700 bg-ink-850 p-3">
          <PlatformChip meta={meta} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium text-ink-100">{content.title}</div>
            <div className="text-[10px] text-ink-500">{content.platforms.length} platform variant</div>
          </div>
        </div>

        <Field label="Tanggal dan waktu">
          <Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
        </Field>

        <Field label="Timezone">
          <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            {['Asia/Jakarta', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/Amsterdam', 'UTC'].map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>
        </Field>

        <div>
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-ink-400">
            Jadwal per platform
          </span>
          <div className="space-y-1.5">
            {content.platforms.map((p) => (
              <div
                key={p.platform}
                className="flex items-center gap-2 rounded-lg border border-ink-800 bg-ink-850 px-2.5 py-2"
              >
                <PlatformChip meta={platformMeta(p.platform)} size="xs" showLabel={false} />
                <span className="min-w-0 flex-1 truncate text-[11px] text-ink-300">
                  {platformMeta(p.platform).label}
                </span>
                <span className="shrink-0 text-[10px] tabular-nums text-ink-500">
                  {p.scheduledAt ? fmtDateTime(p.scheduledAt) : 'belum dijadwalkan'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-ink-800 bg-ink-850/60 p-3">
          <div className="text-[10px] uppercase tracking-wider text-ink-500">Copy and publish</div>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
            API platform belum terhubung. Sistem menyiapkan caption, hashtag, dan jadwal agar bisa langsung
            di-paste manual ke aplikasi platform.
          </p>
          <div className="mt-2 flex gap-2">
            <Button size="xs" variant="secondary" onClick={() => toast('Payload siap di-paste', 'info')}>
              <Copy className="h-3 w-3" />
              Copy payload
            </Button>
            <Button size="xs" variant="ghost">
              <ExternalLink className="h-3 w-3" />
              Buka platform
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}