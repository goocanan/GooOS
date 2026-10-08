import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Wand2,
  Lightbulb,
  MessageSquareQuote,
  FileText,
  Repeat,
  Gauge,
  Plus,
  Check,
  ArrowRight,
  History,
  Coins,
  Bot,
} from 'lucide-react'
import { useStore, reportErrorHelper } from '@/lib/store'
import { PageBody, PageHeader } from '@/components/page'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CopyButton,
  EmptyState,
  Field,
  Input,
  Progress,
  Select,
} from '@/components/ui'
import { RadialGauge } from '@/components/charts'
import { PLATFORMS, type AIScore, type Platform } from '@/lib/types'
import { cn, relTime } from '@/lib/utils'

type ToolId =
  | 'idea'
  | 'hook'
  | 'script'
  | 'caption'
  | 'repurpose'
  | 'score'
  | 'plan'

const TOOLS: { id: ToolId; label: string; icon: typeof Sparkles; desc: string; cost: number }[] = [
  { id: 'idea', label: 'Idea Generator', icon: Lightbulb, desc: '10 ide konten dari satu topik', cost: 2 },
  { id: 'hook', label: 'Hook Generator', icon: MessageSquareQuote, desc: '10 hook untuk 3 detik pertama', cost: 1 },
  { id: 'script', label: 'Script Generator', icon: FileText, desc: 'Script 30 detik lengkap', cost: 3 },
  { id: 'caption', label: 'Caption Generator', icon: Wand2, desc: 'Caption per platform dengan brand voice', cost: 1 },
  { id: 'repurpose', label: 'Repurpose', icon: Repeat, desc: 'Satu video jadi banyak konten', cost: 5 },
  { id: 'score', label: 'Content Score', icon: Gauge, desc: 'Cek kualitas konten', cost: 0 },
  { id: 'plan', label: 'Content Planner', icon: Bot, desc: 'Rencana 30 hari dari performa', cost: 4 },
]

export default function AIStudio() {
  const { state, workspaceBrands, workspaceContents, actions, toast } = useStore()
  const report = reportErrorHelper(toast)
  const navigate = useNavigate()
  const [tool, setTool] = useState<ToolId>('idea')
  const [topic, setTopic] = useState('PLA untuk outdoor')
  const [platform, setPlatform] = useState<Platform>('tiktok')
  const [tone, setTone] = useState('Professional + Friendly')
  const [duration, setDuration] = useState('30')
  const [brandId, setBrandId] = useState(workspaceBrands[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<string | null>(null)

  const brand = workspaceBrands.find((b) => b.id === brandId)
  const active = TOOLS.find((t) => t.id === tool)!
  const Icon = active.icon

  const [credits, setCredits] = useState(128)

  /** Generation runs on the API so runs are persisted and auditable (PRD 27). */
  const generate = async () => {
    setLoading(true)
    setOutput(null)
    try {
      const res = await actions.generate({
        tool,
        prompt: topic,
        platform: platform || undefined,
        brandId: brand?.id,
        duration: duration ? Number(duration) : undefined,
      })
      setOutput(res.output)
      setCredits((c) => Math.max(0, c - res.creditsUsed))
      toast(`${active.label} selesai`)
    } catch (err) {
      report(err, 'Generate gagal')
    } finally {
      setLoading(false)
    }
  }

  const items = useMemo(() => (output ? parseBlocks(output) : []), [output])

  return (
    <>
      <PageHeader
        title="AI Studio"
        description="Lapisan opsional untuk mempercepat produksi konten"
        actions={
          <div className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-2.5 py-1.5">
            <Coins className="h-3.5 w-3.5 text-gold-400" />
            <span className="text-[11px] tabular-nums text-ink-300">{credits} credits</span>
          </div>
        }
      />

      <PageBody>
        <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
          {/* Tool picker */}
          <div className="space-y-2">
            {TOOLS.map((t) => {
              const TIcon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTool(t.id)
                    setOutput(null)
                  }}
                  className={cn(
                    'flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-colors',
                    tool === t.id
                      ? 'border-brand-600/50 bg-brand-950/20'
                      : 'border-ink-700/70 bg-ink-900 hover:border-ink-600',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                      tool === t.id ? 'bg-brand-600/20 text-brand-300' : 'bg-ink-800 text-ink-400',
                    )}
                  >
                    <TIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-medium text-ink-100">{t.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-ink-500">{t.desc}</span>
                    {t.cost > 0 && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[9px] text-gold-400">
                        <Coins className="h-2.5 w-2.5" />
                        {t.cost} credit{t.cost === 1 ? '' : 's'}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}

            {state.aiRuns.length > 0 && (
              <Card>
                <CardHeader title="History" subtitle={`${state.aiRuns.length} run terakhir`} icon={<History className="h-4 w-4" />} />
                <div className="divide-y divide-ink-800">
                  {state.aiRuns.slice(0, 6).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setOutput(r.output)
                        setTopic(r.prompt)
                      }}
                      className="block w-full px-3 py-2.5 text-left transition-colors hover:bg-ink-850"
                    >
                      <div className="truncate text-[11px] font-medium text-ink-200">{r.tool}</div>
                      <div className="mt-0.5 truncate text-[10px] text-ink-500">{r.prompt}</div>
                      <div className="text-[9px] text-ink-600">{relTime(r.at)}</div>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Main */}
          <div className="space-y-5">
            <Card>
              <CardHeader
                title={active.label}
                subtitle={active.desc}
                icon={<Icon className="h-4 w-4 text-brand-300" />}
                action={
                  brand && (
                    <Badge color={brand.guidelines.secondaryColor} size="xs">
                      {brand.name} context
                    </Badge>
                  )
                }
              />
              <div className="space-y-4 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {tool !== 'score' && (
                    <Field label="Topik / brief" className="sm:col-span-2">
                      <Input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Contoh: apakah PLA bisa dipakai untuk outdoor?"
                      />
                    </Field>
                  )}

                  <Field label="Platform">
                    <Select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
                      {PLATFORMS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Tone of voice">
                    <Select value={tone} onChange={(e) => setTone(e.target.value)}>
                      {(brand?.guidelines.tone.split(' - ')[0] ?? 'Professional')
                        .split('+')
                        .map((t) => t.trim())
                        .concat(['Casual', 'Edukasi', 'Promosi keras', 'Storytelling'])
                        .filter((v, i, arr) => arr.indexOf(v) === i)
                        .map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                    </Select>
                  </Field>

                  {(tool === 'script' || tool === 'repurpose') && (
                    <Field label="Durasi (detik)">
                      <Input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      />
                    </Field>
                  )}

                  <Field label="Brand">
                    <Select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                      {workspaceBrands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                {brand && (
                  <div className="rounded-lg border border-ink-800 bg-ink-850/60 p-3">
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      <span className="font-semibold uppercase tracking-wider text-ink-500">
                        Brand guidelines dipakai AI
                      </span>
                      <Badge color={brand.color} size="xs">
                        {brand.name}
                      </Badge>
                      {brand.guidelines.keywords.slice(0, 3).map((k) => (
                        <span key={k} className="text-ink-400">
                          {k}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11px] text-ink-500">{brand.guidelines.tone}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="primary" onClick={generate} loading={loading} disabled={!topic && tool !== 'score'}>
                    <Sparkles className="h-3.5 w-3.5" />
                    {loading ? 'Generating...' : 'Generate'}
                  </Button>
                  {active.cost > 0 && (
                    <span className="text-[11px] text-ink-500">
                      Biaya {active.cost} credit{active.cost === 1 ? '' : 's'} - sisa {credits - active.cost}
                    </span>
                  )}
                </div>
              </div>
            </Card>

            {loading && (
              <Card>
                <div className="space-y-2 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-6 w-6 shrink-0 animate-pulse rounded-md bg-ink-800" />
                      <div className="h-3 flex-1 animate-pulse rounded bg-ink-800" style={{ animationDelay: `${i * 90}ms` }} />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {output && tool === 'score' && <ScoreOutput output={output} contentId={topic} />}

            {output && tool !== 'score' && (
              <Card>
                <CardHeader
                  title="Hasil"
                  subtitle={`${active.label} untuk "${topic}"`}
                  icon={<Check className="h-4 w-4 text-emerald-400" />}
                  action={
                    <div className="flex gap-1.5">
                      <CopyButton value={output} label="Copy all" size="xs" variant="ghost" />
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => {
                          toast('Disimpan sebagai ide di Ideas board')
                          navigate('/ideas')
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        Simpan
                      </Button>
                    </div>
                  }
                />
                <div className="divide-y divide-ink-800">
                  {items.map((item, i) => (
                    <div key={i} className="group flex items-start gap-3 px-4 py-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-800 font-mono text-[10px] text-ink-400">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        {item.title && (
                          <p className="text-[13px] font-medium leading-snug text-ink-100">{item.title}</p>
                        )}
                        <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-300">
                          {item.body}
                        </p>
                      </div>
                      <CopyButton
                        value={item.body}
                        size="xs"
                        variant="ghost"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {!output && !loading && (
              <Card>
                <EmptyState
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Siap generate"
                  description="Isi topik, pilih platform, lalu klik Generate. AI memakai brand guidelines sebagai konteks."
                  action={
                    <Button size="sm" variant="primary" onClick={generate}>
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate sekarang
                    </Button>
                  }
                />
              </Card>
            )}

            {/* Related content shortcuts */}
            <Card>
              <CardHeader title="Shortcuts" subtitle="Terapkan AI pada konten yang ada" />
              <div className="grid gap-2 p-3 sm:grid-cols-2">
                {workspaceContents
                  .slice(0, 4)
                  .map((c) => (
                    <Link
                      key={c.id}
                      to={`/content/${c.id}`}
                      className="flex items-center gap-2.5 rounded-lg border border-ink-800 bg-ink-850/60 p-2.5 transition-colors hover:border-ink-600"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
                        style={{ background: `color-mix(in oklab, ${c.thumbnailColor} 25%, transparent)` }}
                      >
                        <Sparkles className="h-3.5 w-3.5 text-white/80" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-medium text-ink-100">{c.title}</span>
                        <span className="block text-[10px] text-ink-600">#{c.ref}</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-600" />
                    </Link>
                  ))}
              </div>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  )
}

function ScoreOutput({ output, contentId }: { output: string; contentId: string }) {
  const scores = JSON.parse(output) as AIScore & { total: number; advice: string[] }
  const tone = scores.total >= 82 ? '#22c55e' : scores.total >= 70 ? '#f59e0b' : '#ef4444'

  return (
    <Card>
      <CardHeader title="Content Score" subtitle="Pemeriksaan kualitas konten" icon={<Gauge className="h-4 w-4" />} />
      <div className="flex flex-wrap items-center gap-6 p-4">
        <RadialGauge value={scores.total} size={92} color={tone} thickness={8}>
          <span className="text-xl font-bold tabular-nums text-ink-100">{scores.total}</span>
          <span className="text-[9px] uppercase tracking-wider text-ink-500">dari 100</span>
        </RadialGauge>
        <div className="min-w-[240px] flex-1 space-y-2.5">
          {(
            [
              ['Hook clarity', scores.hookClarity, 'Hook menyebut angka atau konflik dalam 3 detik pertama'],
              ['CTA clarity', scores.ctaClarity, 'Ajakan aksi spesifik dan mudah dilakukan'],
              ['Readability', scores.readability, 'Bahasa pendek, kalimat jelas, tanpa jargon berlebihan'],
              ['Platform fit', scores.platformFit, 'Format dan durasi sesuai platform'],
            ] as [string, number, string][]
          ).map(([label, value, advice]) => (
            <div key={label}>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-ink-300">{label}</span>
                <span className="tabular-nums text-ink-100">{value}%</span>
              </div>
              <Progress
                value={value}
                height={4}
                color={value >= 82 ? '#22c55e' : value >= 70 ? '#f59e0b' : '#ef4444'}
              />
              <p className="mt-1 text-[10px] text-ink-600">{advice}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-ink-800 p-4">
        <h4 className="mb-2 text-[12px] font-semibold text-ink-200">Saran perbaikan</h4>
        <ul className="space-y-1.5">
          {scores.advice.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-ink-300">
              <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-brand-400" />
              {a}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[10px] text-ink-600">Skoring untuk konten: {contentId}</p>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Output parsers
// ---------------------------------------------------------------------------

interface Block {
  title: string
  body: string
}

function parseBlocks(text: string): Block[] {
  return text
    .split(/\n\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const idx = chunk.indexOf('\n')
      if (idx === -1) return { title: '', body: chunk }
      return { title: chunk.slice(0, idx).trim(), body: chunk.slice(idx + 1).trim() }
    })
}

// ---------------------------------------------------------------------------
// Deterministic mock generation (no network)
// ---------------------------------------------------------------------------

