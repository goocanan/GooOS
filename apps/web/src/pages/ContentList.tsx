import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Plus,
  Download,
  X,
  Archive,
  Copy,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { PageBody, PageHeader, FilterChip, Toolbar } from '@/components/page'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  IconButton,
  Input,
  Select,
  Dropdown,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  useDebounced,
} from '@/components/ui'
import { ContentCard, ContentThumb, PlatformChip, StatusBadge, PriorityBadge, DueChip } from '@/components/content'
import { PLATFORMS, STATUS_META, STATUS_ORDER, type Content, type ContentStatus, type Platform } from '@/lib/types'
import { cn, compact, fmtDate, fmtDateTime, toCsv, downloadText, toInitials } from '@/lib/utils'

type ViewMode = 'grid' | 'list'

export default function ContentList() {
  const { state, workspaceContents, platformMeta, userById, actions, toast } = useStore()
  const [params, setParams] = useSearchParams()

  const [view, setView] = useState<ViewMode>('grid')
  const [q, setQ] = useState('')
  const debouncedQ = useDebounced(q, 200)
  const [statusFilter, setStatusFilter] = useState<ContentStatus[]>(
    params.get('status') ? [params.get('status') as ContentStatus] : [],
  )
  const [platformFilter, setPlatformFilter] = useState<Platform[]>(
    params.get('platform') ? [params.get('platform') as Platform] : [],
  )
  const [creatorFilter, setCreatorFilter] = useState<string[]>([])
  const [campaignFilter, setCampaignFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [sort, setSort] = useState<'updated' | 'deadline' | 'priority' | 'title'>('updated')
  const [selected, setSelected] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const archivedMode = params.get('view') === 'archived'

  useEffect(() => {
    const s = params.get('status')
    const p = params.get('platform')
    setStatusFilter(s ? [s as ContentStatus] : [])
    setPlatformFilter(p ? [p as Platform] : [])
  }, [params])

  const filtered = useMemo(() => {
    let list = workspaceContents.filter((c) => (archivedMode ? c.status === 'archived' : c.status !== 'archived'))

    if (debouncedQ) {
      const term = debouncedQ.toLowerCase()
      list = list.filter((c) =>
        `${c.title} ${c.description} ${c.tags.join(' ')} #${c.ref} ${c.cta}`
          .toLowerCase()
          .includes(term),
      )
    }
    if (statusFilter.length) list = list.filter((c) => statusFilter.includes(c.status))
    if (platformFilter.length)
      list = list.filter((c) => c.platforms.some((v) => platformFilter.includes(v.platform)))
    if (creatorFilter.length) list = list.filter((c) => creatorFilter.includes(c.creatorId))
    if (campaignFilter.length) list = list.filter((c) => c.campaignId && campaignFilter.includes(c.campaignId))
    if (priorityFilter.length) list = list.filter((c) => priorityFilter.includes(c.priority))

    const sorted = [...list]
    sorted.sort((a, b) => {
      switch (sort) {
        case 'deadline': {
          const av = a.deadline ? new Date(a.deadline).getTime() : Infinity
          const bv = b.deadline ? new Date(b.deadline).getTime() : Infinity
          return av - bv
        }
        case 'priority': {
          const rank = { urgent: 0, high: 1, medium: 2, low: 3 }
          return rank[a.priority] - rank[b.priority]
        }
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })
    return sorted
  }, [
    workspaceContents,
    archivedMode,
    debouncedQ,
    statusFilter,
    platformFilter,
    creatorFilter,
    campaignFilter,
    priorityFilter,
    sort,
  ])

  const activeFilters =
    statusFilter.length + platformFilter.length + creatorFilter.length + campaignFilter.length + priorityFilter.length

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

  const clearFilters = () => {
    setStatusFilter([])
    setPlatformFilter([])
    setCreatorFilter([])
    setCampaignFilter([])
    setPriorityFilter([])
    setParams({})
  }

  const exportCsv = () => {
    const rows = filtered.map((c) => ({
      ref: `#${c.ref}`,
      title: c.title,
      status: c.status,
      priority: c.priority,
      platforms: c.platforms.map((p) => p.platform).join(' | '),
      creator: userById(c.creatorId)?.name ?? '',
      deadline: c.deadline ?? '',
      scheduled: c.scheduledAt ?? '',
      published: c.publishedAt ?? '',
      tags: c.tags.join(', '),
    }))
    downloadText('gooos-content.csv', toCsv(rows), 'text/csv')
    toast(`${rows.length} baris diekspor ke CSV`)
  }

  const allSelected = filtered.length > 0 && selected.length === filtered.length

  return (
    <>
      <PageHeader
        title={archivedMode ? 'Archived Content' : 'All Content'}
        description={`${filtered.length} dari ${workspaceContents.length} konten`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Link to="/content?create=1">
              <Button variant="primary" size="sm">
                <Plus className="h-3.5 w-3.5" />
                New Content
              </Button>
            </Link>
          </>
        }
        tabs={
          <div className="flex items-center gap-1 pb-2">
            <Link
              to="/content"
              className={cn(
                'rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
                !archivedMode ? 'bg-ink-750 text-ink-100 ring-1 ring-ink-600' : 'text-ink-400 hover:text-ink-200',
              )}
            >
              Active
            </Link>
            <Link
              to="/content?view=archived"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
                archivedMode ? 'bg-ink-750 text-ink-100 ring-1 ring-ink-600' : 'text-ink-400 hover:text-ink-200',
              )}
            >
              <Archive className="h-3.5 w-3.5" />
              Archived
              <span className="text-[10px] tabular-nums text-ink-500">
                {workspaceContents.filter((c) => c.status === 'archived').length}
              </span>
            </Link>
          </div>
        }
      />

      <PageBody className="space-y-4">
        <Toolbar>
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-500" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search judul, tag, #ref..."
              className="pl-9"
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Button
            variant={showFilters || activeFilters ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilters > 0 && (
              <span className="rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {activeFilters}
              </span>
            )}
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-8 w-auto"
            >
              <option value="updated">Terakhir diubah</option>
              <option value="deadline">Deadline terdekat</option>
              <option value="priority">Priority</option>
              <option value="title">Judul A-Z</option>
            </Select>
            <div className="flex items-center rounded-lg border border-ink-700 bg-ink-900 p-0.5">
              <IconButton
                label="Grid view"
                onClick={() => setView('grid')}
                className={cn('h-7 w-7', view === 'grid' && 'bg-ink-750 text-ink-100')}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton
                label="List view"
                onClick={() => setView('list')}
                className={cn('h-7 w-7', view === 'list' && 'bg-ink-750 text-ink-100')}
              >
                <List className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          </div>
        </Toolbar>

        {/* Filter panel */}
        {showFilters && (
          <Card className="animate-fade-up p-4">
            <div className="grid gap-4 md:grid-cols-4">
              <FilterGroup label="Status">
                {STATUS_ORDER.map((s) => (
                  <FilterChip
                    key={s}
                    active={statusFilter.includes(s)}
                    color={STATUS_META[s].color}
                    onClick={() => toggle(statusFilter, s, setStatusFilter)}
                    count={workspaceContents.filter((c) => c.status === s).length}
                  >
                    {STATUS_META[s].label}
                  </FilterChip>
                ))}
              </FilterGroup>
              <FilterGroup label="Platform">
                {PLATFORMS.map((p) => (
                  <FilterChip
                    key={p.id}
                    active={platformFilter.includes(p.id)}
                    color={p.color}
                    onClick={() => toggle(platformFilter, p.id, setPlatformFilter)}
                    count={
                      workspaceContents.filter((c) => c.platforms.some((v) => v.platform === p.id)).length
                    }
                  >
                    {p.label}
                  </FilterChip>
                ))}
              </FilterGroup>
              <FilterGroup label="Creator">
                {state.users.map((u) => (
                  <FilterChip
                    key={u.id}
                    active={creatorFilter.includes(u.id)}
                    onClick={() => toggle(creatorFilter, u.id, setCreatorFilter)}
                    count={workspaceContents.filter((c) => c.creatorId === u.id).length}
                  >
                    {u.name.split(' ')[0]}
                  </FilterChip>
                ))}
              </FilterGroup>
              <FilterGroup label="Campaign & priority">
                {state.campaigns.map((c) => (
                  <FilterChip
                    key={c.id}
                    active={campaignFilter.includes(c.id)}
                    color={c.color}
                    onClick={() => toggle(campaignFilter, c.id, setCampaignFilter)}
                  >
                    {c.name}
                  </FilterChip>
                ))}
                <div className="mt-2 flex gap-1.5 border-t border-ink-800 pt-2">
                  {(['urgent', 'high', 'medium', 'low'] as const).map((p) => (
                    <FilterChip
                      key={p}
                      active={priorityFilter.includes(p)}
                      onClick={() => toggle(priorityFilter, p, setPriorityFilter)}
                    >
                      {p}
                    </FilterChip>
                  ))}
                </div>
              </FilterGroup>
            </div>
            {activeFilters > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-ink-800 pt-3">
                <span className="text-[11px] text-ink-500">{activeFilters} filter aktif</span>
                <Button size="xs" variant="ghost" onClick={clearFilters}>
                  <X className="h-3 w-3" />
                  Clear semua
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Selection bar */}
        {selected.length > 0 && (
          <div className="animate-fade-up sticky top-2 z-10 flex items-center gap-2 rounded-xl border border-brand-700/50 bg-ink-850/95 px-3 py-2 shadow-xl backdrop-blur-xl">
            <span className="text-[12px] font-medium text-ink-200">{selected.length} dipilih</span>
            <div className="ml-auto flex items-center gap-1.5">
              <Button
                size="xs"
                variant="secondary"
                onClick={() => {
                  selected.forEach((id) =>
                    void actions.moveContent(id, 'review' as ContentStatus),
                  )
                  toast(`${selected.length} konten dikirim ke review`)
                  setSelected([])
                }}
              >
                Kirim review
              </Button>
              <Button
                size="xs"
                variant="secondary"
                onClick={() => {
                  selected.forEach((id) =>
                    void actions.moveContent(id, 'archived' as ContentStatus),
                  )
                  toast(`${selected.length} konten diarsipkan`)
                  setSelected([])
                }}
              >
                <Archive className="h-3 w-3" />
                Archive
              </Button>
              <Button
                size="xs"
                variant="danger"
                onClick={() => {
                  void actions
                    .bulkContent({ ids: selected, action: 'delete' })
                    .then(() => {
                      toast(`${selected.length} konten dihapus`, 'warn')
                      setSelected([])
                    })
                    .catch(() => toast('Gagal menghapus konten', 'danger'))
                }}
              >
                <Trash2 className="h-3 w-3" />
                Hapus
              </Button>
              <IconButton label="Batal pilih" onClick={() => setSelected([])}>
                <X className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          </div>
        )}

        {/* Results */}
        {filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Search className="h-5 w-5" />}
              title="Tidak ada konten yang cocok"
              description="Coba ubah filter atau kata kunci pencarian."
              action={
                <Button size="sm" variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          </Card>
        ) : view === 'grid' ? (
          <>
            <div className="mb-1 flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onChange={(v) => setSelected(v ? filtered.map((c) => c.id) : [])}
              />
              <span className="text-[11px] text-ink-500">Select all</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((c) => {
                const creator = userById(c.creatorId)
                return (
                  <div key={c.id} className="group relative">
                    <div className="absolute left-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                      <Checkbox
                        checked={selected.includes(c.id)}
                        onChange={(v) =>
                          setSelected((s) => (v ? [...s, c.id] : s.filter((x) => x !== c.id)))
                        }
                      />
                    </div>
                    <RowActions content={c} />
                    <ContentCard
                      content={c}
                      platformMeta={platformMeta(c.type)}
                      creator={creator}
                    />
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <Card className="overflow-hidden">
            <div className="flex items-center gap-3 border-b border-ink-800 px-4 py-2.5">
              <Checkbox
                checked={allSelected}
                onChange={(v) => setSelected(v ? filtered.map((c) => c.id) : [])}
              />
              <span className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
                {filtered.length} konten
              </span>
            </div>
            <div className="divide-y divide-ink-800">
              {filtered.map((c) => {
                const creator = userById(c.creatorId)
                const campaign = state.campaigns.find((x) => x.id === c.campaignId)
                const metrics = state.analytics.filter((a) => a.contentId === c.id)
                const views = metrics.reduce((a, b) => a + b.views, 0)
                return (
                  <div
                    key={c.id}
                    className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-ink-850"
                  >
                    <Checkbox
                      checked={selected.includes(c.id)}
                      onChange={(v) =>
                        setSelected((s) => (v ? [...s, c.id] : s.filter((x) => x !== c.id)))
                      }
                    />
                    <ContentThumb content={c} className="w-16 shrink-0" ratio="aspect-square" />
                    <Link to={`/content/${c.id}`} className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-ink-100">{c.title}</span>
                        <span className="shrink-0 font-mono text-[10px] text-ink-600">#{c.ref}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={c.status} size="xs" />
                        <PlatformChip meta={platformMeta(c.type)} size="xs" showLabel={false} />
                        <PriorityBadge priority={c.priority} size="xs" />
                        {campaign && (
                          <Badge color={campaign.color} size="xs">
                            {campaign.name}
                          </Badge>
                        )}
                        <DueChip content={c} />
                      </div>
                    </Link>
                    <div className="hidden w-28 shrink-0 text-right lg:block">
                      <div className="text-[11px] text-ink-400">
                        {c.scheduledAt
                          ? `Jadwal ${fmtDate(c.scheduledAt)}`
                          : c.publishedAt
                            ? `Tayang ${fmtDate(c.publishedAt)}`
                            : 'Belum ada jadwal'}
                      </div>
                      <div className="mt-0.5 text-[10px] text-ink-600">{fmtDateTime(c.updatedAt)}</div>
                    </div>
                    <div className="hidden w-16 shrink-0 text-right sm:block">
                      {views > 0 ? (
                        <>
                          <div className="text-[12px] font-semibold tabular-nums text-ink-200">
                            {compact(views)}
                          </div>
                          <div className="text-[10px] text-ink-600">views</div>
                        </>
                      ) : (
                        <span className="text-[11px] text-ink-600">-</span>
                      )}
                    </div>
                    {creator && (
                      <span className="hidden sm:block" title={creator.name}>
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                          style={{ background: creator.avatarColor }}
                        >
                          {toInitials(creator.name)}
                        </span>
                      </span>
                    )}
                    <RowActions content={c} compact />
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </PageBody>
    </>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function RowActions({ content, compact: isCompact }: { content: Content; compact?: boolean }) {
  const { actions, toast } = useStore()
  const navigate = useNavigate()

  return (
    <Dropdown
      width={220}
      trigger={({ toggle }) => (
        <button
          onClick={(e) => {
            e.preventDefault()
            toggle()
          }}
          aria-label="Actions"
          className={cn(
            'absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md bg-black/50 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-white',
            isCompact ? 'right-2 top-1/2 -translate-y-1/2' : 'opacity-0 group-hover:opacity-100',
          )}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    >
      {(close) => (
        <>
          <MenuLabel>#{content.ref}</MenuLabel>
          <MenuItem
            icon={<ChevronRight className="h-3.5 w-3.5" />}
            onClick={() => {
              navigate(`/content/${content.id}`)
              close()
            }}
          >
            Buka detail
          </MenuItem>
          <MenuItem
            icon={<Copy className="h-3.5 w-3.5" />}
            onClick={() => {
              void actions.duplicateContent(content.id)
              toast('Konten diduplikasi')
              close()
            }}
          >
            Duplikasi
          </MenuItem>
          <MenuSeparator />
          <MenuLabel>Pindahkan status</MenuLabel>
          {(['planned', 'script', 'production', 'editing', 'review', 'approved', 'scheduled'] as ContentStatus[]).map(
            (s) => (
              <MenuItem
                key={s}
                icon={
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: STATUS_META[s].color }}
                  />
                }
                onClick={() => {
                  void actions.moveContent(content.id, s)
                  toast(`#${content.ref} -> ${STATUS_META[s].label}`)
                  close()
                }}
              >
                {STATUS_META[s].label}
              </MenuItem>
            ),
          )}
          <MenuSeparator />
          <MenuItem
            icon={<Archive className="h-3.5 w-3.5" />}
            onClick={() => {
              void actions.moveContent(content.id, 'archived')
              toast(`#${content.ref} diarsipkan`, 'info')
              close()
            }}
          >
            Archive
          </MenuItem>
          <MenuItem
            danger
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => {
              void actions.deleteContent(content.id)
              toast(`#${content.ref} dihapus`, 'warn')
              close()
            }}
          >
            Hapus
          </MenuItem>
        </>
      )}
    </Dropdown>
  )
}

