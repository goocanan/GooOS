import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { PageBody, PageHeader, FilterChip } from '@/components/page'
import {
  Button,
  Card,
  Dropdown,
  Input,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  useDebounced,
} from '@/components/ui'
import { ContentCard } from '@/components/content'
import { STATUS_META, type Content, type ContentStatus, type Platform } from '@/lib/types'
import { cn, groupBy } from '@/lib/utils'

/** Board columns - MVP phase 3 grouping of the full workflow. */
const COLUMNS: { status: ContentStatus; hint: string }[] = [
  { status: 'idea', hint: 'Ide mentah yang belum dikembangkan' },
  { status: 'planned', hint: 'Sudah masuk rencana konten' },
  { status: 'script', hint: 'Sedang menulis script' },
  { status: 'production', hint: 'Shooting dan produksi' },
  { status: 'editing', hint: 'Editing dan revisi' },
  { status: 'review', hint: 'Menunggu approval' },
  { status: 'approved', hint: 'Sudah disetujui reviewer' },
  { status: 'scheduled', hint: 'Terjadwal untuk publish' },
  { status: 'published', hint: 'Sudah tayang' },
]

export default function ContentBoard() {
  const { workspaceContents, platformMeta, actions, toast } = useStore()
  const [q, setQ] = useState('')
  const debouncedQ = useDebounced(q, 180)
  const [platformFilter, setPlatformFilter] = useState<Platform[]>([])
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<ContentStatus | null>(null)
  const [collapsedCols, setCollapsedCols] = useState<ContentStatus[]>([])

  const filtered = useMemo(() => {
    let list = workspaceContents.filter((c) => c.status !== 'archived')
    if (debouncedQ) {
      const term = debouncedQ.toLowerCase()
      list = list.filter((c) => `${c.title} ${c.tags.join(' ')}`.toLowerCase().includes(term))
    }
    if (platformFilter.length) list = list.filter((c) => c.platforms.some((v) => platformFilter.includes(v.platform)))
    return list
  }, [workspaceContents, debouncedQ, platformFilter])

  const grouped = useMemo(() => groupBy(filtered, (c) => c.status), [filtered])

  const onDrop = (status: ContentStatus) => {
    if (!dragId) return
    const content = workspaceContents.find((c) => c.id === dragId)
    setDragId(null)
    setOverCol(null)
    if (!content || content.status === status) return

    void actions.moveContent(dragId, status)

    // Notifications and the activity log are written server-side by the move
    // endpoint, so the client does not fabricate them.
    toast(`#${content.ref} dipindahkan ke ${STATUS_META[status].label}`)
  }

  return (
    <>
      <PageHeader
        title="Content Board"
        description="Drag & drop kartu untuk memindahkan status konten"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => toast('Board view aktif', 'info')}>
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
            </Button>
            <Link to="/content?create=1">
              <Button variant="primary" size="sm">
                <Plus className="h-3.5 w-3.5" />
                New Content
              </Button>
            </Link>
          </>
        }
      />

      <PageBody width="wide" className="!py-4">
        {/* Filter bar */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-500" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search board..."
              className="h-8 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(['tiktok', 'instagram_reel', 'youtube', 'youtube_short'] as Platform[]).map((p) => (
              <FilterChip
                key={p}
                active={platformFilter.includes(p)}
                color={platformMeta(p).color}
                onClick={() =>
                  setPlatformFilter((prev) =>
                    prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
                  )
                }
              >
                {platformMeta(p).label}
              </FilterChip>
            ))}
          </div>
          <div className="ml-auto text-[11px] text-ink-500">
            {filtered.length} konten across {COLUMNS.length} kolom
          </div>
        </div>

        {/* Board */}
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
          {COLUMNS.map((col) => {
            const items = grouped[col.status] ?? []
            const meta = STATUS_META[col.status]
            const isOver = overCol === col.status
            const isCollapsed = collapsedCols.includes(col.status)

            return (
              <div
                key={col.status}
                className={cn(
                  'flex w-[268px] shrink-0 flex-col rounded-xl border transition-colors',
                  isOver ? 'drop-active border-brand-500/50' : 'border-ink-800 bg-ink-900/40',
                )}
                title={col.hint}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverCol(col.status)
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return
                  setOverCol((v) => (v === col.status ? null : v))
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  onDrop(col.status)
                }}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 border-b border-ink-800 px-3 py-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} />
                  <span className="text-[12px] font-semibold text-ink-200">{meta.label}</span>
                  <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-ink-400">
                    {items.length}
                  </span>
                  <button
                    onClick={() =>
                      setCollapsedCols((prev) =>
                        prev.includes(col.status) ? prev.filter((x) => x !== col.status) : [...prev, col.status],
                      )
                    }
                    className="ml-auto text-ink-600 transition-colors hover:text-ink-300"
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                  >
                    <ChevronRight
                      className={cn('h-3.5 w-3.5 transition-transform', isCollapsed && 'rotate-90')}
                    />
                  </button>
                </div>

                {/* Cards */}
                {!isCollapsed && (
                  <div className="no-scrollbar flex max-h-[calc(100dvh-19rem)] min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto p-2">
                    {items.length === 0 && (
                      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-ink-700 py-8 text-[11px] text-ink-600">
                        Drop konten di sini
                      </div>
                    )}
                    {items.map((c) => (
                      <BoardCard
                        key={c.id}
                        content={c}
                        onDragStart={() => setDragId(c.id)}
                        onDragEnd={() => {
                          setDragId(null)
                          setOverCol(null)
                        }}
                        dragging={dragId === c.id}
                      />
                    ))}
                  </div>
                )}
                {!isCollapsed && (
                  <div className="border-t border-ink-800 p-2">
                    <Link
                      to="/content?create=1"
                      className="flex items-center justify-center gap-1 rounded-md py-1.5 text-[11px] text-ink-500 transition-colors hover:bg-ink-850 hover:text-ink-300"
                    >
                      <Plus className="h-3 w-3" />
                      Tambah
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Workflow hint */}
        <Card className="mt-1 p-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-medium text-ink-400">Workflow default:</span>
            {COLUMNS.map((c, i) => (
              <span key={c.status} className="flex items-center gap-2">
                <span
                  className="rounded px-1.5 py-0.5 font-medium"
                  style={{
                    background: `color-mix(in oklab, ${STATUS_META[c.status].color} 15%, transparent)`,
                    color: STATUS_META[c.status].color,
                  }}
                >
                  {STATUS_META[c.status].label}
                </span>
                {i < COLUMNS.length - 1 && <ArrowRight className="h-3 w-3 text-ink-600" />}
              </span>
            ))}
          </div>
        </Card>
      </PageBody>
    </>
  )
}

function BoardCard({
  content,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  content: Content
  onDragStart: () => void
  onDragEnd: () => void
  dragging: boolean
}) {
  const { platformMeta, userById, actions, toast } = useStore()
  const navigate = useNavigate()
  const creator = userById(content.creatorId)

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', content.id)
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      className={cn('cursor-grab active:cursor-grabbing', dragging && 'drag-ghost')}
    >
      <div className="group/card relative rounded-lg">
        <ContentCard
          content={content}
          platformMeta={platformMeta(content.type)}
          creator={creator}
          compact
          dragging={dragging}
        />
        <div className="absolute right-1.5 top-1.5 z-10 opacity-0 transition-opacity group-hover/card:opacity-100">
          <Dropdown
            width={200}
            trigger={({ toggle }) => (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  toggle()
                }}
                className="flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white/85 backdrop-blur-sm hover:bg-black/80"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuLabel>#{content.ref}</MenuLabel>
                <MenuItem
                  onClick={() => {
                    navigate(`/content/${content.id}`)
                    close()
                  }}
                >
                  Buka detail
                </MenuItem>
                <MenuItem
                  icon={<RotateCcw className="h-3.5 w-3.5" />}
                  onClick={() => {
                    void actions.moveContent(content.id, 'production')
                    toast('Dikembalikan ke production', 'info')
                    close()
                  }}
                >
                  Reset ke production
                </MenuItem>
                <MenuSeparator />
                <MenuItem
                  danger
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => {
                    void actions.deleteContent(content.id)
                    toast('Konten dihapus', 'warn')
                    close()
                  }}
                >
                  Hapus
                </MenuItem>
              </>
            )}
          </Dropdown>
        </div>
      </div>
    </div>
  )
}

