import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye,
  TrendingUp,
  Users as UsersIcon,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Download,
  Clock,
  MousePointerClick,
  Target,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { PageBody, PageHeader, FilterChip } from '@/components/page'
import { Badge, Button, Card, CardHeader, EmptyState, Select } from '@/components/ui'
import { PlatformChip } from '@/components/content'
import {
  BarChart,
  DonutChart,
  Heatmap,
  LineChart,
  RankedBar,
  SparklineCard,
} from '@/components/charts'
import { PLATFORMS, type Platform } from '@/lib/types'
import { compact, num, pct, seeded, toCsv, downloadText } from '@/lib/utils'

export default function Analytics() {
  const { state, workspaceContents, platformMeta, toast } = useStore()
  const [platform, setPlatform] = useState<Platform | 'all'>('all')
  const [range, setRange] = useState('30')

  const rows = useMemo(() => {
    const ids = new Set(workspaceContents.map((c) => c.id))
    return state.analytics.filter((a) => ids.has(a.contentId) && (platform === 'all' || a.platform === platform))
  }, [state.analytics, workspaceContents, platform])

  const totals = useMemo(() => {
    const views = rows.reduce((a, b) => a + b.views, 0)
    const likes = rows.reduce((a, b) => a + b.likes, 0)
    const comments = rows.reduce((a, b) => a + b.comments, 0)
    const shares = rows.reduce((a, b) => a + b.shares, 0)
    const saves = rows.reduce((a, b) => a + b.saves, 0)
    const followers = rows.reduce((a, b) => a + b.followersGained, 0)
    const watch = rows.reduce((a, b) => a + b.watchTimeMin, 0)
    const ctr = rows.length ? rows.reduce((a, b) => a + b.ctr, 0) / rows.length : 0
    const engagement = views ? (likes + comments + shares + saves) / views : 0
    return { views, likes, comments, shares, saves, followers, watch, ctr, engagement }
  }, [rows])

  const series = useMemo(() => {
    const days = Number(range)
    const base = rows.length ? totals.views / days : 1000
    return Array.from({ length: days }, (_, i) => {
      const r = seeded(`an-${platform}-${i}-${days}`)
      // Slow upward trend with day-of-week ripple and mild noise.
      const trend = 0.8 + (i / Math.max(1, days - 1)) * 0.4
      const ripple = i % 7 === 5 || i % 7 === 6 ? 1.25 : 1
      const noise = 0.86 + r() * 0.3
      return {
        x: i,
        views: Math.round(base * trend * ripple * noise),
        engagement: Number((0.06 + r() * 0.035 + (i / Math.max(1, days - 1)) * 0.02).toFixed(4)),
        followers: Math.round(base * 0.004 * trend * (0.7 + r() * 0.7)),
      }
    })
  }, [range, platform, rows.length, totals.views])

  const byPlatform = useMemo(() => {
    const map = new Map<Platform, { views: number; eng: number; count: number }>()
    state.analytics
      .filter((a) => workspaceContents.some((c) => c.id === a.contentId))
      .forEach((a) => {
        const prev = map.get(a.platform) ?? { views: 0, eng: 0, count: 0 }
        map.set(a.platform, {
          views: prev.views + a.views,
          eng: prev.eng + (a.likes + a.comments + a.shares + a.saves),
          count: prev.count + 1,
        })
      })
    return [...map.entries()]
      .map(([p, v]) => ({
        label: platformMeta(p).label,
        value: v.views,
        color: platformMeta(p).color,
        engagement: v.views ? v.eng / v.views : 0,
        count: v.count,
      }))
      .sort((a, b) => b.value - a.value)
  }, [state.analytics, workspaceContents, platformMeta])

  const topContent = useMemo(() => {
    const map = new Map<string, { views: number; eng: number }>()
    rows.forEach((r) => {
      const prev = map.get(r.contentId) ?? { views: 0, eng: 0 }
      map.set(r.contentId, {
        views: prev.views + r.views,
        eng: prev.eng + r.likes + r.comments + r.shares + r.saves,
      })
    })
    return [...map.entries()]
      .sort((a, b) => b[1].views - a[1].views)
      .slice(0, 8)
      .map(([id, v]) => {
        const c = workspaceContents.find((x) => x.id === id)!
        return {
          label: c.title,
          value: v.views,
          meta: `#${c.ref} - ${platformMeta(c.type).label} - ${pct(v.eng / (v.views || 1))} engagement`,
          color: c.thumbnailColor,
        }
      })
  }, [rows, workspaceContents, platformMeta])

  const byObjective = useMemo(() => {
    const map = new Map<string, number>()
    rows.forEach((r) => {
      const c = workspaceContents.find((x) => x.id === r.contentId)
      const key = c?.brief.objective ?? 'Awareness'
      map.set(key, (map.get(key) ?? 0) + r.views)
    })
    return [...map.entries()].map(([label, value]) => ({ label, value }))
  }, [rows, workspaceContents])

  const heatmap = useMemo(() => {
    const hours = ['06', '09', '12', '15', '18', '21']
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    return days.map((_, di) =>
      hours.map((_, hi) => {
        const r = seeded(`heat-${di}-${hi}`)
        // Peak at 12 and 19 as a plausible pattern.
        const bump = hi === 2 ? 92 : hi === 4 ? 84 : hi === 1 ? 68 : 44
        return Math.round(bump * (0.55 + r() * 0.6))
      }),
    )
  }, [])

  const exportCsv = () => {
    const csv = toCsv(
      rows.map((r) => {
        const c = workspaceContents.find((x) => x.id === r.contentId)
        return {
          content: c?.title ?? '',
          ref: c?.ref ?? '',
          platform: platformMeta(r.platform).label,
          views: r.views,
          likes: r.likes,
          comments: r.comments,
          shares: r.shares,
          saves: r.saves,
          watchTimeMin: r.watchTimeMin,
          ctr: r.ctr,
          followersGained: r.followersGained,
        }
      }),
    )
    downloadText('gooos-analytics.csv', csv, 'text/csv')
    toast(`${rows.length} baris analytics diekspor`)
  }

  if (rows.length === 0) {
    return (
      <>
        <PageHeader title="Analytics" description="Performa konten lintas platform" />
        <PageBody>
          <Card>
            <EmptyState
              icon={<Target className="h-5 w-5" />}
              title="Belum ada data analytics"
              description="Metrik akan muncul setelah konten dipublikasikan dan diinput manual."
              action={
                <Link to="/content">
                  <Button size="sm" variant="primary">
                    Lihat konten
                  </Button>
                </Link>
              }
            />
          </Card>
        </PageBody>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Analytics"
        description={`${num(rows.length)} baris metrik dari ${num(totals.views)} views`}
        actions={
          <>
            <Select value={platform} onChange={(e) => setPlatform(e.target.value as Platform | 'all')} className="w-auto">
              <option value="all">Semua platform</option>
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
            <Select value={range} onChange={(e) => setRange(e.target.value)} className="w-auto">
              <option value="7">7 hari</option>
              <option value="14">14 hari</option>
              <option value="30">30 hari</option>
              <option value="90">90 hari</option>
            </Select>
            <Button variant="secondary" size="sm" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </>
        }
      />

      <PageBody className="space-y-5">
        {/* KPI */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SparklineCard
            label="Total Views"
            value={compact(totals.views)}
            delta={18.2}
            series={series.map((s) => s.views)}
            color="var(--color-brand-400)"
            icon={<Eye className="h-3.5 w-3.5" />}
          />
          <SparklineCard
            label="Engagement Rate"
            value={pct(totals.engagement)}
            delta={2.1}
            series={series.map((s) => s.engagement)}
            color="var(--color-emerald-400)"
            icon={<TrendingUp className="h-3.5 w-3.5" />}
          />
          <SparklineCard
            label="Followers Gained"
            value={`+${compact(totals.followers)}`}
            delta={9.4}
            series={series.map((s) => s.followers)}
            color="var(--color-gold-400)"
            icon={<UsersIcon className="h-3.5 w-3.5" />}
          />
          <SparklineCard
            label="Watch Time"
            value={`${compact(totals.watch)} m`}
            delta={6.8}
            series={series.map((s) => s.views * 0.4)}
            color="var(--color-sky-400)"
            icon={<Clock className="h-3.5 w-3.5" />}
          />
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader
              title="Views trend"
              subtitle={`Performa ${range} hari terakhir`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <div className="p-4">
              <LineChart
                height={240}
                yFormat={(v) => compact(v)}
                y2Format={(v) => Math.round(v).toLocaleString('id-ID')}
                series={[
                  {
                    key: 'views',
                    label: 'Views',
                    color: 'var(--color-brand-400)',
                    area: true,
                    points: series.map((s) => ({ x: s.x, y: s.views })),
                  },
                  {
                    key: 'followers',
                    label: 'Followers',
                    color: 'var(--color-gold-400)',
                    dashed: true,
                    axis: 'right',
                    points: series.map((s) => ({ x: s.x, y: s.followers })),
                  },
                ]}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Engagement mix" subtitle="Breakdown interaksi" icon={<Heart className="h-4 w-4" />} />
            <div className="flex flex-col items-center p-4">
              <DonutChart
                data={[
                  { label: 'Likes', value: totals.likes, color: '#f472b6' },
                  { label: 'Comments', value: totals.comments, color: '#38bdf8' },
                  { label: 'Shares', value: totals.shares, color: '#a78bfa' },
                  { label: 'Saves', value: totals.saves, color: '#fbbf24' },
                ]}
                size={168}
                thickness={22}
                centerValue={compact(totals.likes + totals.comments + totals.shares + totals.saves)}
                centerLabel="Interaksi"
              />
              <div className="mt-4 w-full space-y-2">
                {[
                  { label: 'Likes', icon: Heart, value: totals.likes, color: '#f472b6' },
                  { label: 'Comments', icon: MessageSquare, value: totals.comments, color: '#38bdf8' },
                  { label: 'Shares', icon: Share2, value: totals.shares, color: '#a78bfa' },
                  { label: 'Saves', icon: Bookmark, value: totals.saves, color: '#fbbf24' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2.5">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded"
                      style={{ background: `color-mix(in oklab, ${s.color} 18%, transparent)`, color: s.color }}
                    >
                      <s.icon className="h-3 w-3" />
                    </span>
                    <span className="flex-1 text-[11px] text-ink-300">{s.label}</span>
                    <span className="text-[11px] font-semibold tabular-nums text-ink-100">
                      {compact(s.value)}
                    </span>
                    <span className="w-10 text-right text-[10px] tabular-nums text-ink-500">
                      {pct(
                        s.value /
                          Math.max(1, totals.likes + totals.comments + totals.shares + totals.saves),
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader title="Top performing content" subtitle="Berdasarkan views" icon={<Trophy className="h-4 w-4 text-amber-400" />} />
            <div className="p-4">
              <RankedBar items={topContent} format={(v) => compact(v)} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Views by platform" subtitle="Perbandingan kanal" icon={<Eye className="h-4 w-4" />} />
            <div className="p-4">
              <BarChart
                height={200}
                data={byPlatform.map((p) => ({ label: p.label, value: p.value, color: p.color }))}
                format={(v) => compact(v)}
              />
              <div className="mt-4 space-y-1.5">
                {byPlatform.map((p) => (
                  <div key={p.label} className="flex items-center gap-2.5 text-[11px]">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
                    <span className="min-w-0 flex-1 truncate text-ink-300">{p.label}</span>
                    <span className="tabular-nums text-ink-400">{pct(p.engagement)}</span>
                    <span className="w-16 text-right tabular-nums text-ink-100">{compact(p.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Best posting time"
              subtitle="Heatmap engagement rate per hari dan jam"
              icon={<Clock className="h-4 w-4" />}
            />
            <div className="p-4">
              <Heatmap
                rows={['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']}
                cols={['06:00', '09:00', '12:00', '15:00', '18:00', '21:00']}
                values={heatmap}
              />
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
                <Badge color="#d4af37" size="xs">
                  Rekomendasi
                </Badge>
                Publish di 12:00 dan 19:00 untuk engagement terbaik.
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Performance by objective" subtitle="Views berdasarkan goal konten" icon={<Target className="h-4 w-4" />} />
            <div className="p-4">
              <BarChart
                height={200}
                data={byObjective.map((o) => ({ label: o.label, value: o.value }))}
                format={(v) => compact(v)}
              />
            </div>
          </Card>
        </div>

        {/* Insight */}
        <Card className="border-brand-800/40 bg-gradient-to-br from-brand-950/30 to-ink-900">
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-300" />
              <h3 className="text-[13px] font-semibold text-ink-100">Content insight</h3>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {[
                {
                  title: 'Hook dengan angka',
                  body: 'Konten yang hook-nya berupa angka performs 2.3x lebih baik dari hook deskriptif.',
                },
                {
                  title: 'Format pendek menang',
                  body: 'Reels dan TikTok menyumbang 68% views dengan engagement rate 9.1%.',
                },
                {
                  title: 'Save sebagai sinyal',
                  body: 'Save rate di atas 5% berkorelasi kuat dengan pertumbuhan follower.',
                },
              ].map((i) => (
                <div key={i.title} className="rounded-lg border border-ink-700/70 bg-ink-850/60 p-3">
                  <div className="text-[12px] font-medium text-ink-100">{i.title}</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-400">{i.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-ink-400">
                <MousePointerClick className="h-3 w-3" />
                Rekomendasi:
              </span>
              <FilterChip active onClick={() => {}} color="#d4af37">
                Buat 3 konten angka minggu depan
              </FilterChip>
              <Link to="/ai">
                <Button size="xs" variant="secondary">
                  <Sparkles className="h-3 w-3" />
                  Generate ide dari insight
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <CardHeader title="Content performance" subtitle="Content, platform, dan performa" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[12px]">
              <thead className="border-b border-ink-800 bg-ink-900 text-[10px] uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Content</th>
                  <th className="px-3 py-2.5 font-medium">Platform</th>
                  <th className="px-3 py-2.5 text-right font-medium">Views</th>
                  <th className="px-3 py-2.5 text-right font-medium">Likes</th>
                  <th className="px-3 py-2.5 text-right font-medium">Comments</th>
                  <th className="px-3 py-2.5 text-right font-medium">Shares</th>
                  <th className="px-3 py-2.5 text-right font-medium">CTR</th>
                  <th className="px-3 py-2.5 text-right font-medium">Followers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {[...rows]
                  .sort((a, b) => b.views - a.views)
                  .map((r, i) => {
                    const c = workspaceContents.find((x) => x.id === r.contentId)
                    const meta = platformMeta(r.platform)
                    return (
                      <tr key={`${r.contentId}-${r.platform}-${i}`} className="transition-colors hover:bg-ink-850">
                        <td className="px-4 py-2.5">
                          <Link to={`/content/${r.contentId}`} className="flex items-center gap-2.5">
                            <span
                              className="h-7 w-1 shrink-0 rounded-full"
                              style={{ background: c?.thumbnailColor ?? '#333' }}
                            />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-ink-100">{c?.title}</span>
                              <span className="text-[10px] text-ink-600">#{c?.ref}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-2.5">
                          <PlatformChip meta={meta} size="xs" />
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink-100">{compact(r.views)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink-400">{compact(r.likes)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink-400">{compact(r.comments)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink-400">{compact(r.shares)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-ink-400">{pct(r.ctr)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-emerald-400">
                          +{compact(r.followersGained)}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      </PageBody>
    </>
  )
}

