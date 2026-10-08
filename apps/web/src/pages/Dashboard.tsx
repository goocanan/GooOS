import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  ArrowRight,
  Eye,
  TrendingUp,
  Users as UsersIcon,
  Clock,
  CheckCircle2,
  Flame,
  Sparkles,
  FileText,
  CalendarDays,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { PageBody, PageHeader, FilterChip } from '@/components/page'
import { Badge, Button, Card, CardHeader, Avatar, EmptyState, Progress } from '@/components/ui'
import { ContentThumb, PlatformChip, StatusBadge } from '@/components/content'
import { LineChart, Funnel, RankedBar, DonutChart, SparklineCard } from '@/components/charts'
import {
  compact,
  num,
  pct,
  fmtTime,
  relTime,
  seeded,
  groupBy,
  startOfWeek,
  addDays,
  sameDay,
  dueLabel,
  cn,
} from '@/lib/utils'
import { STATUS_META, PLATFORMS, type ContentStatus } from '@/lib/types'

export default function Dashboard() {
  const { state, currentUser, workspaceContents, platformMeta, userById } = useStore()
  const navigate = useNavigate()
  const [range, setRange] = useState<'7' | '14' | '30'>('14')

  const today = useMemo(() => new Date(), [])

  const stats = useMemo(() => {
    const published = workspaceContents.filter((c) => c.status === 'published')
    const active = workspaceContents.filter((c) =>
      ['script', 'production', 'editing', 'review', 'approved', 'scheduled'].includes(c.status),
    )
    const rows = state.analytics.filter((a) =>
      workspaceContents.some((c) => c.id === a.contentId),
    )
    const views = rows.reduce((a, b) => a + b.views, 0)
    const engagements = rows.reduce(
      (a, b) => a + b.likes + b.comments + b.shares + b.saves,
      0,
    )
    const followers = rows.reduce((a, b) => a + b.followersGained, 0)
    const engagementRate = views ? engagements / views : 0
    return { published, active, views, engagements, followers, engagementRate, total: workspaceContents.length }
  }, [workspaceContents, state.analytics])

  const pipeline = useMemo(() => {
    const grouped = groupBy(workspaceContents, (c) => c.status)
    return (
      [
        ['idea', 'Idea'],
        ['planned', 'Planning'],
        ['script', 'Script'],
        ['production', 'Production'],
        ['editing', 'Editing'],
        ['review', 'Review'],
        ['approved', 'Approved'],
        ['scheduled', 'Scheduled'],
        ['published', 'Published'],
      ] as [ContentStatus, string][]
    ).map(([status, label]) => ({
      label,
      value: (grouped[status] ?? []).length,
      color: STATUS_META[status].color,
    }))
  }, [workspaceContents])

  const week = useMemo(() => {
    const start = startOfWeek(today)
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i)
      const items = workspaceContents.filter((c) => {
        const ref = c.scheduledAt ?? c.publishedAt ?? c.deadline
        return ref ? sameDay(new Date(ref), date) : false
      })
      return { date, items }
    })
  }, [workspaceContents, today])

  const needsAttention = useMemo(
    () =>
      workspaceContents
        .filter((c) => ['review', 'production', 'editing', 'script'].includes(c.status))
        .filter((c) => {
          const d = dueLabel(c.deadline)
          return d && d.tone !== 'muted'
        })
        .slice(0, 5),
    [workspaceContents],
  )

  const topContent = useMemo(() => {
    const totals = new Map<string, number>()
    state.analytics
      .filter((a) => workspaceContents.some((c) => c.id === a.contentId))
      .forEach((a) => totals.set(a.contentId, (totals.get(a.contentId) ?? 0) + a.views))
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, views]) => {
        const c = workspaceContents.find((x) => x.id === id)!
        return { label: c.title, value: views, meta: `#${c.ref} - ${platformMeta(c.type).label}` }
      })
  }, [state.analytics, workspaceContents, platformMeta])

  const byPlatform = useMemo(() => {
    const totals = new Map<string, number>()
    state.analytics
      .filter((a) => workspaceContents.some((c) => c.id === a.contentId))
      .forEach((a) => totals.set(a.platform, (totals.get(a.platform) ?? 0) + a.views))
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([p, v]) => ({ label: platformMeta(p as never).label, value: v, color: platformMeta(p as never).color }))
  }, [state.analytics, workspaceContents, platformMeta])

  const byStatus = useMemo(() => {
    const grouped = groupBy(workspaceContents, (c) => c.status)
    return Object.entries(grouped)
      .map(([status, items]) => ({
        label: STATUS_META[status as ContentStatus].label,
        value: items.length,
        color: STATUS_META[status as ContentStatus].color,
      }))
      .sort((a, b) => b.value - a.value)
  }, [workspaceContents])

  const reviewQueue = useMemo(
    () => workspaceContents.filter((c) => c.status === 'review'),
    [workspaceContents],
  )

  const reachSeries = useMemo(() => {
    // Build a plausible 14-day series seeded from the workspace analytics volume.
    const totalViews = state.analytics.reduce((a, b) => a + b.views, 0)
    const dailyBase = totalViews / 14 || 1200
    const views: number[] = []
    const engagement: number[] = []
    const followers: number[] = []
    for (let i = 0; i < 14; i++) {
      const r = seeded(`reach-${i}`)
      // Gentle upward trend + weekday bump + noise.
      const trend = 0.78 + i * 0.035
      const noise = 0.65 + r() * 0.8
      views.push(Math.round(dailyBase * trend * noise))
      engagement.push(Number((0.05 + r() * 0.055 + i * 0.0009).toFixed(4)))
      followers.push(Math.round(dailyBase * 0.004 * (0.5 + r() * 1.1)))
    }
    return { views, engagement, followers }
  }, [state.analytics])

  const rangeFactor = Number(range) / 14

  const hour = today.getHours()
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam'
  const firstName = currentUser.name.split(' ')[0]!

  return (
    <>
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description={`${stats.total} konten di workspace - ${stats.active.length} sedang aktif - ${reviewQueue.length} menunggu approval`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate('/calendar')}>
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/content?create=1')}>
              <Plus className="h-3.5 w-3.5" />
              New Content
            </Button>
          </>
        }
      />

      <PageBody className="space-y-6">
        {/* KPI row */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SparklineCard
            label="Total Content"
            value={num(stats.total)}
            delta={12.4}
            series={[12, 15, 13, 18, 16, 19, 21, 22]}
            color="var(--color-brand-400)"
            icon={<FileText className="h-3.5 w-3.5" />}
            footnote={`${stats.published.length} published - ${stats.active.length} active`}
          />
          <SparklineCard
            label="Total Views"
            value={compact(stats.views)}
            delta={18.2}
            series={reachSeries.views}
            color="var(--color-brand-300)"
            icon={<Eye className="h-3.5 w-3.5" />}
            footnote={`14 hari terakhir`}
          />
          <SparklineCard
            label="Engagement"
            value={pct(stats.engagementRate)}
            delta={2.1}
            series={reachSeries.engagement}
            color="var(--color-emerald-400)"
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            footnote={`${compact(stats.engagements)} interaksi`}
          />
          <SparklineCard
            label="Followers"
            value={`+${compact(stats.followers)}`}
            delta={9.4}
            series={reachSeries.followers}
            color="var(--color-gold-400)"
            icon={<UsersIcon className="h-3.5 w-3.5" />}
            footnote="Growth organic"
          />
        </div>

        {/* Main grid */}
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            {/* Reach chart */}
            <Card>
              <CardHeader
                title="Reach & engagement"
                subtitle="Performa 14 hari terakhir dari konten yang dipublikasikan"
                icon={<TrendingUp className="h-4 w-4" />}
                action={
                  <div className="flex items-center gap-1">
                    {(['7', '14', '30'] as const).map((r) => (
                      <FilterChip key={r} active={range === r} onClick={() => setRange(r)}>
                        {r}d
                      </FilterChip>
                    ))}
                  </div>
                }
              />
              <div className="p-4">
                <LineChart
                  height={210}
                  yFormat={(v) => compact(v)}
                  y2Format={(v) => `${Math.round(v)}`}
                  series={[
                    {
                      key: 'views',
                      label: 'Views',
                      color: 'var(--color-brand-400)',
                      area: true,
                      points: reachSeries.views.map((v, i) => ({ x: i, y: v / rangeFactor })),
                    },
                    {
                      key: 'followers',
                      label: 'Followers',
                      color: 'var(--color-gold-400)',
                      dashed: true,
                      axis: 'right',
                      points: reachSeries.followers.map((v, i) => ({ x: i, y: v / rangeFactor })),
                    },
                  ]}
                />
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-800 pt-4 sm:grid-cols-4">
                  {[
                    { label: 'Published', value: stats.published.length, color: '#22c55e' },
                    { label: 'In review', value: reviewQueue.length, color: '#38bdf8' },
                    { label: 'Scheduled', value: pipeline.find((p) => p.label === 'Scheduled')?.value ?? 0, color: '#2dd4bf' },
                    { label: 'Ideas', value: pipeline.find((p) => p.label === 'Idea')?.value ?? 0, color: '#94a3b8' },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-500">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                        {s.label}
                      </div>
                      <div className="mt-0.5 text-lg font-bold tabular-nums text-ink-100">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* This week */}
            <Card>
              <CardHeader
                title="This week"
                subtitle="Jadwal publish dan deadline minggu ini"
                icon={<CalendarDays className="h-4 w-4" />}
                action={
                  <Button variant="ghost" size="xs" onClick={() => navigate('/calendar')}>
                    Lihat calendar
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                }
              />
              <div className="grid grid-cols-7 gap-px bg-ink-800">
                {week.map((d) => {
                  const isToday = sameDay(d.date, today)
                  return (
                    <button
                      key={d.date.toISOString()}
                      onClick={() => navigate('/calendar')}
                      className={cn(
                        'group min-h-[132px] bg-ink-900 p-2 text-left transition-colors hover:bg-ink-850',
                        isToday && 'bg-brand-950/25',
                      )}
                    >
                      <div className="mb-2 flex items-baseline justify-between">
                        <span
                          className={cn(
                            'text-[10px] font-medium uppercase tracking-wider',
                            isToday ? 'text-brand-300' : 'text-ink-500',
                          )}
                        >
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(d.date.getDay() + 6) % 7]}
                        </span>
                        <span
                          className={cn(
                            'text-[11px] font-semibold tabular-nums',
                            isToday ? 'text-brand-200' : 'text-ink-400',
                          )}
                        >
                          {d.date.getDate()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {d.items.slice(0, 2).map((c) => (
                          <div
                            key={c.id}
                            className="truncate rounded px-1.5 py-1 text-[10px] font-medium"
                            style={{
                              background: `color-mix(in oklab, ${c.thumbnailColor} 30%, transparent)`,
                              color: 'white',
                            }}
                            title={c.title}
                          >
                            {fmtTime(c.scheduledAt ?? c.publishedAt)} {c.title}
                          </div>
                        ))}
                        {d.items.length > 2 && (
                          <div className="text-[9px] text-ink-600">+{d.items.length - 2} lagi</div>
                        )}
                        {d.items.length === 0 && (
                          <span className="text-[10px] text-ink-700 group-hover:text-ink-600">-</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Top performing */}
            <div className="grid gap-5 md:grid-cols-2">
              <Card>
                <CardHeader
                  title="Top performing"
                  subtitle="Berdasarkan total views"
                  icon={<Flame className="h-4 w-4 text-orange-400" />}
                />
                <div className="p-4">
                  <RankedBar
                    items={topContent}
                    format={(v) => compact(v)}
                  />
                  <Link
                    to="/analytics"
                    className="mt-4 inline-flex items-center gap-1 text-[12px] text-brand-300 hover:underline"
                  >
                    Lihat analytics lengkap
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="Platform performance"
                  subtitle="Distribusi views per platform"
                  icon={<Eye className="h-4 w-4" />}
                />
                <div className="flex items-center gap-4 p-4">
                  <DonutChart
                    data={byPlatform}
                    size={140}
                    thickness={18}
                    centerValue={compact(stats.views)}
                    centerLabel="Total views"
                    format={(v) => compact(v)}
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {byPlatform.map((p) => (
                      <div key={p.label} className="flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
                        <span className="min-w-0 flex-1 truncate text-[11px] text-ink-300">{p.label}</span>
                        <span className="shrink-0 text-[11px] font-medium tabular-nums text-ink-100">
                          {compact(p.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Sidebar column */}
          <div className="space-y-5">
            {/* Production pipeline */}
            <Card>
              <CardHeader
                title="Production pipeline"
                subtitle="Distribusi konten per status"
                icon={<Clock className="h-4 w-4" />}
                action={
                  <Button variant="ghost" size="xs" onClick={() => navigate('/board')}>
                    Board
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                }
              />
              <div className="p-4">
                <Funnel steps={pipeline.filter((p) => p.value > 0)} />
              </div>
            </Card>

            {/* Needs attention */}
            <Card>
              <CardHeader
                title="Needs attention"
                subtitle="Deadline dekat atau overdue"
                icon={<Clock className="h-4 w-4 text-amber-400" />}
              />
              <div className="divide-y divide-ink-800">
                {needsAttention.length === 0 && (
                  <EmptyState title="Semua on track" description="Tidak ada deadline yang mepet." />
                )}
                {needsAttention.map((c) => {
                  const creator = userById(c.creatorId)
                  const due = dueLabel(c.deadline)
                  return (
                    <Link
                      key={c.id}
                      to={`/content/${c.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-850"
                    >
                      <ContentThumb content={c} className="w-14 shrink-0" ratio="aspect-square" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-ink-100">{c.title}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <StatusBadge status={c.status} size="xs" />
                          {creator && <Avatar name={creator.name} color={creator.avatarColor} size="xs" />}
                        </div>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 text-[10px] font-medium',
                          due?.tone === 'danger' ? 'text-red-400' : 'text-amber-400',
                        )}
                      >
                        {due?.text}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </Card>

            {/* Review queue */}
            <Card>
              <CardHeader
                title="Approval queue"
                subtitle={`${reviewQueue.length} konten menunggu review`}
                icon={<CheckCircle2 className="h-4 w-4 text-sky-400" />}
              />
              <div className="divide-y divide-ink-800">
                {reviewQueue.length === 0 && <EmptyState title="Queue kosong" description="Tidak ada konten menunggu approval." />}
                {reviewQueue.map((c) => {
                  const reviewer = userById(c.reviewerId)
                  const openComments = state.comments.filter((cm) => cm.contentId === c.id && !cm.resolved)
                  return (
                    <Link
                      key={c.id}
                      to={`/content/${c.id}`}
                      className="block px-4 py-3 transition-colors hover:bg-ink-850"
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12px] font-medium text-ink-100">{c.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <PlatformChip meta={platformMeta(c.type)} size="xs" showLabel={false} />
                            <span className="text-[10px] text-ink-500">
                              {reviewer ? `Reviewer: ${reviewer.name.split(' ')[0]}` : 'Belum ada reviewer'}
                            </span>
                            {openComments.length > 0 && (
                              <Badge color="#f59e0b" size="xs">
                                {openComments.length} catatan
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] text-ink-600">{relTime(c.updatedAt)}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </Card>

            {/* AI insight */}
            <Card className="overflow-hidden border-brand-800/40 bg-gradient-to-br from-brand-950/40 to-ink-900">
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-300" />
                  <span className="text-[13px] font-semibold text-ink-100">Content insight</span>
                </div>
                <p className="mt-2.5 text-[12px] leading-relaxed text-ink-300">
                  Konten dengan hook berupa angka Retention rata-rata{' '}
                  <span className="font-semibold text-brand-300">2.3x lebih tinggi</span> dibanding hook
                  deskriptif. TikTok menyumbang 47% views dengan engagement 9.1%.
                </p>
                <div className="mt-3 space-y-2">
                  <Button
                    size="xs"
                    variant="secondary"
                    className="w-full"
                    onClick={() => navigate('/ai')}
                  >
                    <Sparkles className="h-3 w-3" />
                    Generate ide baru
                  </Button>
                  <Button size="xs" variant="ghost" className="w-full" onClick={() => navigate('/reports')}>
                    Buka monthly report
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Recent activity */}
            <Card>
              <CardHeader title="Recent activity" subtitle="Audit log workspace" />
              <div className="p-4">
                <ol className="relative space-y-3.5 border-l border-ink-800 pl-4">
                  {state.activity.slice(0, 7).map((a) => {
                    const actor = userById(a.actorId)
                    return (
                      <li key={a.id} className="relative">
                        <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-ink-600 ring-4 ring-ink-900" />
                        <p className="text-[12px] leading-snug text-ink-200">{a.verb}</p>
                        <p className="mt-0.5 text-[10px] text-ink-500">
                          {actor?.name} - {relTime(a.at)}
                        </p>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </Card>
          </div>
        </div>

        {/* Status distribution */}
        <Card>
          <CardHeader title="Content by status" subtitle="Semua konten pada workspace aktif" />
          <div className="flex flex-wrap gap-3 p-4">
            {byStatus.map((s) => (
              <button
                key={s.label}
                onClick={() => navigate(`/content?status=${s.label.toLowerCase()}`)}
                className="group flex min-w-[140px] flex-1 items-center gap-3 rounded-lg border border-ink-800 bg-ink-850 px-3 py-2.5 text-left transition-colors hover:border-ink-600"
              >
                <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="min-w-0">
                  <span className="block text-[11px] text-ink-400">{s.label}</span>
                  <span className="block text-base font-bold tabular-nums text-ink-100">{s.value}</span>
                </span>
                <span className="ml-auto">
                  <Progress
                    value={(s.value / Math.max(...byStatus.map((x) => x.value))) * 100}
                    height={3}
                    color={s.color}
                    className="w-10"
                  />
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* Platform coverage */}
        <Card>
          <CardHeader
            title="Platform coverage"
            subtitle="Platform yang dipakai pada workspace ini"
            action={
              <Button variant="ghost" size="xs" onClick={() => navigate('/content')}>
                Lihat konten
                <ArrowRight className="h-3 w-3" />
              </Button>
            }
          />
          <div className="grid grid-cols-2 gap-px bg-ink-800 sm:grid-cols-3 lg:grid-cols-6">
            {PLATFORMS.filter((p) => p.id !== 'blog' && p.id !== 'ads').map((p) => {
              const count = workspaceContents.filter((c) =>
                c.platforms.some((v) => v.platform === p.id),
              ).length
              return (
                <button
                  key={p.id}
                  onClick={() => navigate(`/content?platform=${p.id}`)}
                  className="group bg-ink-900 p-3 text-left transition-colors hover:bg-ink-850"
                >
                  <div className="flex items-center justify-between">
                    <PlatformChip meta={p} size="xs" showLabel={false} />
                    <span className="text-base font-bold tabular-nums text-ink-100">{count}</span>
                  </div>
                  <div className="mt-1.5 truncate text-[11px] text-ink-400 group-hover:text-ink-300">{p.label}</div>
                  <Progress
                    value={(count / Math.max(workspaceContents.length, 1)) * 100}
                    height={3}
                    color={p.color}
                    className="mt-2"
                  />
                </button>
              )
            })}
          </div>
        </Card>
      </PageBody>
    </>
  )
}

