import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Download,
  Printer,
  TrendingUp,
  CalendarDays,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { PageBody, PageHeader, FilterChip } from '@/components/page'
import { Badge, Button, Card, CardHeader, Divider, Progress } from '@/components/ui'
import { BarChart, DonutChart, LineChart, RankedBar } from '@/components/charts'
import { monthName, compact, num, pct, seeded, toCsv, downloadText, fmtDate } from '@/lib/utils'

const PRESETS = [
  { id: 'month', label: 'Monthly Content Report' },
  { id: 'quarter', label: 'Quarterly Performance' },
  { id: 'campaign', label: 'Campaign Wrap-up' },
  { id: 'platform', label: 'Platform Breakdown' },
]

export default function Reports() {
  const { state, workspaceContents, workspaceCampaigns, platformMeta, toast } = useStore()
  const [preset, setPreset] = useState('month')
  const [monthOffset, setMonthOffset] = useState(0)

  const reportDate = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])

  const monthKey = `${reportDate.getFullYear()}-${reportDate.getMonth()}`
  const label = `${monthName(reportDate.getMonth())} ${reportDate.getFullYear()}`

  const inMonth = useMemo(() => {
    return workspaceContents.filter((c) => {
      const d = c.publishedAt ?? c.scheduledAt
      if (!d) return false
      const dt = new Date(d)
      return `${dt.getFullYear()}-${dt.getMonth()}` === monthKey && c.status !== 'archived'
    })
  }, [workspaceContents, monthKey])

  const published = inMonth.filter((c) => c.status === 'published')
  const ids = new Set(inMonth.map((c) => c.id))
  const rows = state.analytics.filter((a) => ids.has(a.contentId))

  const totals = useMemo(() => {
    const views = rows.reduce((a, b) => a + b.views, 0)
    const engagement = rows.reduce((a, b) => a + b.likes + b.comments + b.shares + b.saves, 0)
    const followers = rows.reduce((a, b) => a + b.followersGained, 0)
    return { views, engagement, followers, er: views ? engagement / views : 0 }
  }, [rows])

  const topContent = useMemo(() => {
    const map = new Map<string, number>()
    rows.forEach((r) => map.set(r.contentId, (map.get(r.contentId) ?? 0) + r.views))
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, v]) => {
        const c = workspaceContents.find((x) => x.id === id)!
        return { label: c.title, value: v, meta: `#${c.ref} - ${platformMeta(c.type).label}` }
      })
  }, [rows, workspaceContents, platformMeta])

  const byPlatform = useMemo(() => {
    const map = new Map<string, number>()
    rows.forEach((r) => map.set(r.platform, (map.get(r.platform) ?? 0) + r.views))
    return [...map.entries()]
      .map(([p, v]) => ({
        label: platformMeta(p as never).label,
        value: v,
        color: platformMeta(p as never).color,
      }))
      .sort((a, b) => b.value - a.value)
  }, [rows, platformMeta])

  const byTopic = useMemo(() => {
    const map = new Map<string, number>()
    inMonth.forEach((c) => {
      const key = c.tags[0] ?? 'lainnya'
      const views = rows.filter((r) => r.contentId === c.id).reduce((a, b) => a + b.views, 0)
      map.set(key, (map.get(key) ?? 0) + views)
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [inMonth, rows])

  const series = useMemo(() => {
    const days = 30
    return Array.from({ length: days }, (_, i) => {
      const r = seeded(`rep-${monthKey}-${i}`)
      const base = totals.views / days || 500
      return { x: i, views: Math.round(base * (0.4 + r() * 1.3)), er: 0.04 + r() * 0.07 }
    })
  }, [monthKey, totals.views])

  const byStatus = useMemo(() => {
    const map = new Map<string, number>()
    inMonth.forEach((c) => map.set(c.status, (map.get(c.status) ?? 0) + 1))
    return [...map.entries()]
  }, [inMonth])

  const activeCampaigns = workspaceCampaigns.filter((c) => {
    const s = new Date(c.start)
    const e = new Date(c.end)
    return e >= reportDate && s <= new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0)
  })

  const exportReport = (format: 'csv' | 'md') => {
    if (format === 'csv') {
      downloadText(
        `gooos-report-${monthKey}.csv`,
        toCsv(
          rows.map((r) => {
            const c = workspaceContents.find((x) => x.id === r.contentId)
            return {
              title: c?.title ?? '',
              ref: c?.ref ?? '',
              platform: platformMeta(r.platform).label,
              views: r.views,
              likes: r.likes,
              comments: r.comments,
              shares: r.shares,
              saves: r.saves,
              followersGained: r.followersGained,
            }
          }),
        ),
        'text/csv',
      )
      toast('Report diekspor sebagai CSV')
    } else {
      const md = buildMarkdown()
      downloadText(`gooos-report-${monthKey}.md`, md, 'text/markdown')
      toast('Report diekspor sebagai Markdown (bisa dikonversi ke PDF)')
    }
  }

  const buildMarkdown = () => {
    return [
      `# ${PRESETS.find((p) => p.id === preset)?.label} - ${label}`,
      ``,
      `Workspace: ${state.workspaces.find((w) => w.id === state.currentWorkspaceId)?.name}`,
      `Generated: ${fmtDate(new Date().toISOString())}`,
      ``,
      `## Ringkasan`,
      `- Content Published: ${published.length}`,
      `- Total Content: ${inMonth.length}`,
      `- Total Views: ${compact(totals.views)}`,
      `- Engagement: ${pct(totals.er)}`,
      `- Followers Gained: +${compact(totals.followers)}`,
      ``,
      `## Top Performing Content`,
      ...topContent.map((t, i) => `${i + 1}. ${t.label} (${t.meta}) - ${compact(t.value)} views`),
      ``,
      `## Platform Performance`,
      ...byPlatform.map((p) => `- ${p.label}: ${compact(p.value)} views`),
      ``,
      `## Most Used Topic`,
      ...byTopic.map(([t, v]) => `- ${t}: ${compact(v)} views`),
      ``,
      `## Campaigns`,
      ...activeCampaigns.map((c) => `- ${c.name} (${c.goal}) - ${c.contentCount} konten`),
    ].join('\n')
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate laporan bulanan, export PDF, CSV, atau Excel"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
              Print / PDF
            </Button>
            <Dropdown2 onExport={exportReport} />
          </>
        }
      />

      <PageBody className="space-y-5">
        {/* Controls */}
        <Card className="no-print">
          <div className="flex flex-wrap items-center gap-2 p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESETS.map((p) => (
                <FilterChip key={p.id} active={preset === p.id} onClick={() => setPreset(p.id)}>
                  {p.label}
                </FilterChip>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Button size="xs" variant="ghost" onClick={() => setMonthOffset((m) => m - 1)}>
                <CalendarDays className="h-3 w-3" />
                Bulan lalu
              </Button>
              <span className="min-w-32 text-center text-[12px] font-medium text-ink-100">{label}</span>
              <Button
                size="xs"
                variant="ghost"
                disabled={monthOffset >= 0}
                onClick={() => setMonthOffset((m) => m + 1)}
              >
                Bulan ini
              </Button>
            </div>
          </div>
        </Card>

        {/* Report body */}
        <div className="rounded-xl border border-ink-700/70 bg-ink-900">
          {/* Cover */}
          <div className="border-b border-ink-800 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-400">
                  {state.workspaces.find((w) => w.id === state.currentWorkspaceId)?.name}
                </p>
                <h2 className="mt-1 text-[22px] font-bold tracking-tight text-ink-100">
                  {PRESETS.find((p) => p.id === preset)?.label}
                </h2>
                <p className="mt-1 text-[13px] text-ink-400">{label}</p>
              </div>
              <div className="text-right text-[11px] text-ink-500">
                <p>Dibuat {fmtDate(new Date().toISOString())}</p>
                <p>Periode {monthOffset === 0 ? 'berjalan' : 'selesai'}</p>
              </div>
            </div>
          </div>

          {/* Headline numbers */}
          <div className="grid grid-cols-2 gap-px bg-ink-800 lg:grid-cols-5">
            {[
              { label: 'Content published', value: published.length },
              { label: 'Total content', value: inMonth.length },
              { label: 'Total views', value: compact(totals.views) },
              { label: 'Engagement', value: pct(totals.er) },
              { label: 'Followers gained', value: `+${compact(totals.followers)}` },
            ].map((s) => (
              <div key={s.label} className="bg-ink-900 px-5 py-4">
                <p className="text-[10px] font-medium uppercase tracking-wider text-ink-500">{s.label}</p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-ink-100">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6 p-6">
            {/* Chart */}
            <div>
              <h3 className="mb-3 text-[13px] font-semibold text-ink-100">Views harian</h3>
              <LineChart
                height={200}
                yFormat={(v) => compact(v)}
                series={[
                  {
                    key: 'views',
                    label: 'Views',
                    color: 'var(--color-brand-400)',
                    area: true,
                    points: series.map((s) => ({ x: s.x, y: s.views })),
                  },
                ]}
              />
            </div>

            <Divider />

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-[13px] font-semibold text-ink-100">Top performing content</h3>
                {topContent.length ? (
                  <RankedBar items={topContent} format={(v) => compact(v)} />
                ) : (
                  <p className="text-[12px] text-ink-600">Belum ada data pada periode ini.</p>
                )}
              </div>

              <div>
                <h3 className="mb-3 text-[13px] font-semibold text-ink-100">Platform performance</h3>
                {byPlatform.length ? (
                  <div className="flex items-center gap-5">
                    <DonutChart
                      data={byPlatform}
                      size={150}
                      thickness={20}
                      centerValue={compact(totals.views)}
                      centerLabel="Views"
                    />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      {byPlatform.map((p) => (
                        <div key={p.label} className="flex items-center gap-2">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
                          <span className="min-w-0 flex-1 truncate text-[11px] text-ink-300">{p.label}</span>
                          <span className="shrink-0 text-[11px] tabular-nums text-ink-100">
                            {compact(p.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-ink-600">Belum ada data pada periode ini.</p>
                )}
              </div>
            </div>

            <Divider />

            <div className="grid gap-6 lg:grid-cols-3">
              <div>
                <h3 className="mb-3 text-[13px] font-semibold text-ink-100">Most used topic</h3>
                {byTopic.length ? (
                  <BarChart
                    height={160}
                    data={byTopic.map(([t, v]) => ({ label: t, value: v }))}
                    format={(v) => compact(v)}
                  />
                ) : (
                  <p className="text-[12px] text-ink-600">Belum ada data.</p>
                )}
              </div>

              <div>
                <h3 className="mb-3 text-[13px] font-semibold text-ink-100">Content by status</h3>
                <div className="space-y-2">
                  {byStatus.length === 0 && <p className="text-[12px] text-ink-600">Belum ada data.</p>}
                  {byStatus.map(([status, count]) => (
                    <div key={status} className="flex items-center gap-2.5">
                      <span className="w-24 shrink-0 text-[11px] capitalize text-ink-400">{status}</span>
                      <Progress
                        value={(count / Math.max(...byStatus.map(([, c]) => c))) * 100}
                        height={5}
                        className="flex-1"
                      />
                      <span className="w-5 shrink-0 text-right text-[11px] tabular-nums text-ink-200">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-[13px] font-semibold text-ink-100">Campaigns on period</h3>
                <div className="space-y-1.5">
                  {activeCampaigns.length === 0 && <p className="text-[12px] text-ink-600">Tidak ada campaign aktif.</p>}
                  {activeCampaigns.map((c) => {
                    const items = workspaceContents.filter((x) => x.campaignId === c.id)
                    const done = items.filter((x) => x.status === 'published').length
                    return (
                      <Link
                        key={c.id}
                        to="/campaigns"
                        className="block rounded-lg border border-ink-800 bg-ink-850/60 p-2.5 transition-colors hover:border-ink-600"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-ink-100">
                            {c.name}
                          </span>
                          <Badge color={c.color} size="xs">
                            {c.goal}
                          </Badge>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Progress
                            value={items.length ? (done / items.length) * 100 : 0}
                            height={3}
                            color={c.color}
                            className="flex-1"
                          />
                          <span className="text-[10px] tabular-nums text-ink-500">
                            {done}/{items.length}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Insight */}
            <div className="rounded-lg border border-brand-800/40 bg-brand-950/20 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-300" />
                <h3 className="text-[13px] font-semibold text-ink-100">Ringkasan insight</h3>
              </div>
              <ul className="mt-2 space-y-1.5">
                {[
                  `${num(published.length)} konten tayang bulan ini dengan ${compact(totals.views)} total views.`,
                  `Engagement rate ${pct(totals.er)} - ${totals.er >= 0.07 ? 'di atas benchmark industri 6%.' : 'masih di bawah benchmark industri 6%.'}`,
                  `${byPlatform[0] ? `${byPlatform[0].label} menyumbang ${pct((byPlatform[0].value || 0) / (totals.views || 1))} dari total views.` : 'Belum ada dominasi platform.'}`,
                  `Topik "${byTopic[0]?.[0] ?? '-'}" paling banyak memberi views pada periode ini.`,
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-ink-300">
                    <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-brand-400" />
                    {t}
                  </li>
                ))}
              </ul>
              <Link
                to="/analytics"
                className="mt-3 inline-flex items-center gap-1 text-[12px] text-brand-300 hover:underline"
              >
                Buka analytics detail
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Scheduled reports */}
        <Card className="no-print">
          <CardHeader
            title="Scheduled reports"
            subtitle="Otomatis kirim laporan ke email tim"
            icon={<FileText className="h-4 w-4" />}
          />
          <div className="divide-y divide-ink-800">
            {[
              { name: 'Monthly Content Report', to: 'Setiap tanggal 1, 08:00', recipients: 'james, krisda' },
              { name: 'Weekly Performance Digest', to: 'Setiap Senin, 07:00', recipients: 'tim marketing' },
              { name: 'Campaign Wrap-up', to: 'Manual per campaign', recipients: 'client' },
            ].map((r) => (
              <div key={r.name} className="flex items-center gap-3 px-4 py-3">
                <FileText className="h-4 w-4 shrink-0 text-ink-500" />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-ink-100">{r.name}</div>
                  <div className="text-[10px] text-ink-500">
                    {r.to} - kirim ke {r.recipients}
                  </div>
                </div>
                <Badge color="#34d399" size="xs" dot>
                  Aktif
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </PageBody>
    </>
  )
}

function Dropdown2({ onExport }: { onExport: (format: 'csv' | 'md') => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <Button variant="primary" size="sm" onClick={() => setOpen((v) => !v)}>
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>
      {open && (
        <div
          className="animate-scale-in absolute right-0 z-40 mt-1.5 w-48 overflow-hidden rounded-xl border border-ink-700 bg-ink-850 p-1 shadow-2xl"
          onMouseLeave={() => setOpen(false)}
        >
          {[
            { f: 'csv' as const, label: 'Export CSV', desc: 'Raw data per konten' },
            { f: 'md' as const, label: 'Export Markdown', desc: 'Siap dikonversi ke PDF' },
          ].map((o) => (
            <button
              key={o.f}
              onClick={() => {
                onExport(o.f)
                setOpen(false)
              }}
              className="flex w-full flex-col items-start rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-ink-750"
            >
              <span className="text-[12px] text-ink-100">{o.label}</span>
              <span className="text-[10px] text-ink-500">{o.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

