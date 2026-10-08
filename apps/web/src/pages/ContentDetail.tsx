import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  X,
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Copy,
  Clock,
  Sparkles,
  ChevronRight,
  CalendarClock,
  Upload,
  Play,
  Paperclip,
  AlertTriangle,
  MoreHorizontal,
  Wand2,
  ExternalLink,
  Archive,
  Pencil,
} from 'lucide-react'
import { useStore, reportErrorHelper } from '@/lib/store'
import type { AIScore } from '@/lib/types'
import { PageBody } from '@/components/page'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Avatar,
  Dropdown,
  EmptyState,
  Field,
  Input,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  Modal,
  Select,
  Tabs,
  Tab,
  TabList,
  Textarea,
  CopyButton,
  Progress,
  IconButton,
  Divider,
} from '@/components/ui'
import { ContentThumb, PlatformChip, StatusBadge, PriorityBadge } from '@/components/content'
import { RadialGauge, RankedBar, BarChart } from '@/components/charts'
import { STATUS_META, STATUS_ORDER, ROLE_LABEL, type Comment, type Content, type Platform } from '@/lib/types'
import {
  bytes,
  cn,
  compact,
  duration,
  fmtDate,
  fmtDateTime,
  pct,
  relTime,
  toLocalInput,
} from '@/lib/utils'

// ---------------------------------------------------------------------------
// AI Content Score (PRD §28)
// ---------------------------------------------------------------------------

/**
 * The `score` tool returns a JSON object. Older/mock providers may return prose,
 * so parsing degrades to null rather than throwing.
 */
function parseAiScore(output: string): AIScore | null {
  const start = output.indexOf('{')
  const end = output.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const parsed = JSON.parse(output.slice(start, end + 1)) as Partial<AIScore>
    if (typeof parsed.hookClarity !== 'number') return null
    return {
      total: parsed.total,
      hookClarity: parsed.hookClarity,
      ctaClarity: parsed.ctaClarity ?? 0,
      readability: parsed.readability ?? 0,
      platformFit: parsed.platformFit ?? 0,
      advice: parsed.advice ?? [],
    }
  } catch {
    return null
  }
}

function ScoreBreakdown({ output }: { output: string }) {
  const score = useMemo(() => parseAiScore(output), [output])

  if (!score) {
    return <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-ink-300">{output}</pre>
  }

  const rows: [string, number][] = [
    ['Hook clarity', score.hookClarity],
    ['CTA clarity', score.ctaClarity],
    ['Readability', score.readability],
    ['Platform fit', score.platformFit],
  ]

  return (
    <div>
      {score.total != null && (
        <div className="mb-2 flex items-baseline gap-1.5">
          <span className="text-[22px] font-bold tabular-nums text-gold-400">{score.total}</span>
          <span className="text-[11px] text-ink-500">/ 100</span>
        </div>
      )}
      <div className="space-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-[10px] text-ink-400">{label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full rounded-full bg-gold-500"
                style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-ink-300">{value}</span>
          </div>
        ))}
      </div>
      {score.advice && score.advice.length > 0 && (
        <ul className="mt-2.5 space-y-1 border-t border-ink-800 pt-2">
          {score.advice.map((a) => (
            <li key={a} className="flex gap-1.5 text-[11px] leading-relaxed text-ink-400">
              <span className="text-gold-500">•</span>
              {a}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ContentDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    state,
    actions,
    platformMeta,
    userById,
    toast,
    refreshContent,
  } = useStore()
  const report = reportErrorHelper(toast)

  const [tab, setTab] = useState('brief')
  const [comment, setComment] = useState('')
  const [commentTs, setCommentTs] = useState('')
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [scoreOutput, setScoreOutput] = useState<string | null>(null)

  const content = state.contents.find((c) => c.id === id)

  // Comments, approvals, analytics and the script are only in the detail
  // payload (PRD 8), so fetch them once per content id.
  const detail = state.detail[id]
  useEffect(() => {
    void refreshContent(id).catch(() => undefined)
  }, [id, refreshContent])

  const comments = useMemo(
    () => (detail?.comments ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [detail],
  )

  const metrics = useMemo(() => detail?.analytics ?? [], [detail])

  const assets = useMemo(
    () => state.assets.filter((a) => (content?.assetIds ?? []).includes(a.id)),
    [state.assets, content],
  )

  const script = detail?.script ?? state.scripts.find((s) => s.contentId === id)

  if (!content) {
    return (
      <PageBody>
        <EmptyState
          title="Konten tidak ditemukan"
          description="Konten ini mungkin sudah dihapus atau ID salah."
          action={
            <Button size="sm" variant="primary" onClick={() => navigate('/content')}>
              Kembali ke daftar
            </Button>
          }
        />
      </PageBody>
    )
  }

  const creator = userById(content.creatorId)
  const owner = userById(content.ownerId)
  const reviewer = userById(content.reviewerId)
  const campaign = state.campaigns.find((c) => c.id === content.campaignId)
  const brand = state.brands.find((b) => b.id === content.brandId)
  const openNotes = comments.filter((c) => !c.resolved)
  const totalViews = metrics.reduce((a, b) => a + b.views, 0)
  const totalEng = metrics.reduce((a, b) => a + b.likes + b.comments + b.shares + b.saves, 0)

  const move = (status: Content['status']) => {
    void actions.moveContent(content.id, status)
    toast(`#${content.ref} -> ${STATUS_META[status].label}`)
  }

  /**
   * Comments, approvals and the resulting status change all happen on the
   * server: posting a change_request moves the content back to production and
   * notifies the creator, and an approval records an approval row.
   */
  const addComment = async (kind: Comment['kind']) => {
    if (!comment.trim()) return
    const body = comment.trim()
    const timestampSec = commentTs ? Number(commentTs) : undefined
    try {
      if (kind === 'approval') {
        await actions.approve(content.id, 'approved', body, timestampSec)
      } else {
        await actions.addComment(content.id, body, timestampSec, kind)
      }
      setComment('')
      setCommentTs('')
      toast(
        kind === 'approval'
          ? 'Konten disetujui'
          : kind === 'change_request'
            ? 'Permintaan revisi dikirim'
            : 'Komentar ditambahkan',
      )
    } catch (err) {
      report(err, 'Gagal menyimpan')
    }
  }

  /**
   * Quick approval from the header button, without going through the comment
   * box. The server records the approval row and the status change (PRD 19).
   */
  const approve = async () => {
    try {
      await actions.approve(content.id, 'approved')
      toast('Konten disetujui')
    } catch (err) {
      report(err, 'Gagal menyetujui konten')
    }
  }

  return (
    <>
      {/* Header bar */}
      <div className="sticky top-0 z-20 border-b border-ink-800 bg-ink-950/90 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3">
          <Link
            to="/content"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-850 hover:text-ink-100"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-ink-500">#{content.ref}</span>
              <StatusBadge status={content.status} size="xs" />
              <PriorityBadge priority={content.priority} size="xs" />
              {campaign && (
                <Badge color={campaign.color} size="xs">
                  {campaign.name}
                </Badge>
              )}
            </div>
            <h1 className="mt-1 truncate text-[15px] font-semibold tracking-tight text-ink-100">
              {content.title}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {content.status === 'review' && (
              <>
                <Button size="sm" variant="ghost" onClick={() => setAssignOpen(true)}>
                  <MessageSquare className="h-3.5 w-3.5" />
                  Revisi
                </Button>
                <Button size="sm" variant="primary" onClick={approve}>
                  <Check className="h-3.5 w-3.5" />
                  Approve
                </Button>
              </>
            )}
            {content.status === 'approved' && (
              <Button size="sm" variant="primary" onClick={() => setScheduleOpen(true)}>
                <CalendarClock className="h-3.5 w-3.5" />
                Jadwalkan
              </Button>
            )}
            {content.status === 'scheduled' && (
              <Button size="sm" variant="primary" onClick={() => move('published')}>
                <Send className="h-3.5 w-3.5" />
                Publish sekarang
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Dropdown
              width={216}
              trigger={({ toggle }) => (
                <Button size="icon" variant="secondary" onClick={toggle} aria-label="Menu">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              )}
            >
              {(close) => (
                <>
                  <MenuLabel>Pindahkan status</MenuLabel>
                  {STATUS_ORDER.filter((s) => s !== 'archived').map((s) => (
                    <MenuItem
                      key={s}
                      icon={
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: STATUS_META[s].color }}
                        />
                      }
                      onClick={() => {
                        move(s)
                        close()
                      }}
                    >
                      {STATUS_META[s].label}
                    </MenuItem>
                  ))}
                  <MenuSeparator />
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
                  <MenuItem
                    icon={<Archive className="h-3.5 w-3.5" />}
                    onClick={() => {
                      move('archived')
                      close()
                    }}
                  >
                    Archive
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem
                    danger
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setDeleteOpen(true)
                      close()
                    }}
                  >
                    Hapus konten
                  </MenuItem>
                </>
              )}
            </Dropdown>
          </div>
        </div>

        {/* Status progress strip */}
        <div className="mx-auto mt-3 flex max-w-[1500px] items-center gap-1 overflow-x-auto no-scrollbar">
          {STATUS_ORDER.filter((s) => s !== 'archived').map((s) => {
            const idx = STATUS_ORDER.indexOf(content.status)
            const step = STATUS_ORDER.indexOf(s)
            const done = step <= idx
            return (
              <button
                key={s}
                onClick={() => move(s)}
                className={cn(
                  'group flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
                  content.status === s ? 'text-ink-100' : done ? 'text-ink-400' : 'text-ink-600',
                )}
                style={
                  content.status === s
                    ? { background: `color-mix(in oklab, ${STATUS_META[s].color} 18%, transparent)` }
                    : undefined
                }
              >
                <span
                  className="h-1.5 w-1.5 rounded-full transition-colors"
                  style={{ background: done ? STATUS_META[s].color : 'var(--color-ink-600)' }}
                />
                {STATUS_META[s].label}
                {s === 'review' && openNotes.length > 0 && (
                  <span className="rounded bg-amber-500/20 px-1 text-[9px] text-amber-300">
                    {openNotes.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <PageBody>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Main column */}
          <div className="space-y-5">
            {/* Preview */}
            <Card>
              <CardHeader
                title="Preview"
                subtitle={`${content.platforms.length} platform - caption terpisah per platform`}
                icon={<Play className="h-4 w-4" />}
                action={
                  <div className="flex gap-1.5">
                    {content.platforms.map((p) => (
                      <PlatformChip key={p.platform} meta={platformMeta(p.platform)} size="xs" />
                    ))}
                  </div>
                }
              />
              <div className="grid gap-4 p-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="space-y-2">
                  <ContentThumb content={content} ratio="aspect-[9/16]" className="mx-auto max-w-[240px]" />
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {content.platforms.map((p) => (
                      <span
                        key={p.platform}
                        className="rounded border border-ink-700 px-1.5 py-0.5 text-[9px] text-ink-500"
                      >
                        {p.mediaAssetIds.length} media
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {content.platforms.map((p) => {
                    const meta = platformMeta(p.platform)
                    const len = p.caption.length
                    const over = len > meta.maxCaption && meta.maxCaption > 0
                    return (
                      <div key={p.platform} className="rounded-lg border border-ink-800 bg-ink-850/60 p-3">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <PlatformChip meta={meta} size="xs" />
                          <span className="text-[10px] tabular-nums text-ink-500">
                            {len} karakter{meta.maxCaption > 0 && ` / ${meta.maxCaption}`}
                          </span>
                          {over && (
                            <Badge color="#ef4444" size="xs">
                              Melebihi batas
                            </Badge>
                          )}
                          <div className="ml-auto flex gap-1">
                            <CopyButton
                              value={p.caption}
                              label="Copy caption"
                              copiedLabel="Tersalin"
                              size="xs"
                              variant="subtle"
                            />
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-ink-200">
                          {p.caption || (
                            <span className="italic text-ink-600">Caption belum diisi untuk platform ini.</span>
                          )}
                        </p>
                        {p.hashtags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {p.hashtags.map((h) => (
                              <span key={h} className="text-[10px] text-sky-400">
                                #{h}
                              </span>
                            ))}
                          </div>
                        )}
                        {p.scheduledAt && (
                          <div className="mt-2 flex items-center gap-1.5 border-t border-ink-800 pt-2 text-[10px] text-ink-500">
                            <Clock className="h-3 w-3" />
                            Terjadwal {fmtDateTime(p.scheduledAt)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <Card>
              <div className="border-b border-ink-800 px-4 pt-3">
                <Tabs value={tab} onChange={setTab}>
                  <TabList>
                    <Tab value="brief">Content Brief</Tab>
                    <Tab value="script" count={script?.blocks.length}>
                      Script
                    </Tab>
                    <Tab value="captions" count={content.platforms.length}>
                      Captions
                    </Tab>
                    <Tab value="comments" count={openNotes.length}>
                      Comments
                    </Tab>
                    <Tab value="analytics" count={metrics.length}>
                      Analytics
                    </Tab>
                    <Tab value="activity">Activity</Tab>
                  </TabList>
                </Tabs>
              </div>

              {tab === 'brief' && (
                <div className="p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <BriefItem label="Objective" value={content.brief.objective} />
                    <BriefItem label="Target Audience" value={content.brief.audience} />
                    <BriefItem label="Topic" value={content.brief.topic} />
                    <BriefItem label="Expected Duration" value={content.brief.expectedDuration} />
                    <div className="md:col-span-2">
                      <BriefItem label="Hook" value={content.brief.hook} highlight />
                    </div>
                    <div className="md:col-span-2">
                      <BriefItem label="Key Message" value={content.brief.keyMessage} />
                    </div>
                    <BriefItem label="CTA" value={content.cta || content.brief.cta} />
                    <div className="md:col-span-2">
                      <BriefItem
                        label="Reference"
                        value={content.brief.reference.join('\n')}
                        mono
                      />
                    </div>
                  </div>

                  <Divider label="Production" className="my-5" />

                  <div className="grid gap-4 md:grid-cols-3">
                    <BriefItem label="Description" value={content.description} />
                    <div>
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                        Progress
                      </span>
                      <Progress value={content.productionProgress} className="mt-2" />
                      <div className="mt-1.5 flex gap-1.5">
                        {[0, 25, 50, 75, 100].map((v) => (
                          <button
                            key={v}
                            onClick={() =>
                              void actions.updateContent(content.id, { productionProgress: v })
                            }
                            className="rounded border border-ink-700 px-1.5 py-0.5 text-[10px] text-ink-500 transition-colors hover:border-ink-500 hover:text-ink-200"
                          >
                            {v}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <BriefItem label="Notes" value={content.notes || 'Belum ada catatan internal.'} />
                  </div>

                  {brand && (
                    <>
                      <Divider label="Brand context (untuk AI)" className="my-5" />
                      <div className="rounded-lg border border-ink-800 bg-ink-850/60 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded text-[9px] font-bold text-white"
                            style={{ background: brand.color }}
                          >
                            {brand.logoText}
                          </span>
                          <span className="text-[12px] font-semibold text-ink-100">{brand.name}</span>
                          <span className="text-[11px] text-ink-500">{brand.industry}</span>
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-ink-400">{brand.guidelines.tone}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {brand.guidelines.keywords.map((k) => (
                            <Badge key={k} color={brand.guidelines.secondaryColor} size="xs">
                              {k}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/ai">
                      <Button size="sm" variant="secondary">
                        <Wand2 className="h-3.5 w-3.5" />
                        Generate script dengan AI
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        void actions
                          .generate({ tool: 'score', prompt: content.title, contentId: content.id })
                          .then((res) => {
                            setScoreOutput(res.output)
                            toast('AI score dihitung ulang')
                          })
                          .catch(() => toast('Gagal menghitung AI score', 'danger'))
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Hitung ulang AI score
                    </Button>
                  </div>

                  {scoreOutput && (
                    <div className="mt-3 rounded-lg border border-gold-700/40 bg-gold-900/10 p-3">
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-gold-400">
                        <Sparkles className="h-3 w-3" />
                        Content Score
                      </div>
                      <ScoreBreakdown output={scoreOutput} />
                    </div>
                  )}
                </div>
              )}

              {tab === 'script' && (
                <ScriptTab content={content} scriptId={script?.id} />
              )}

              {tab === 'captions' && <CaptionsTab content={content} />}

              {tab === 'comments' && (
                <div>
                  <div className="border-b border-ink-800 p-4">
                    <div className="rounded-lg border border-ink-800 bg-ink-850/60 p-2">
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tulis komentar, atau gunakan timestamp untuk review video..."
                        rows={3}
                        className="border-0 bg-transparent focus:ring-0"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-ink-500">@</span>
                          <Input
                            value={commentTs}
                            onChange={(e) => setCommentTs(e.target.value.replace(/\D/g, ''))}
                            placeholder="00:17"
                            className="h-7 w-20 px-2 font-mono text-[11px]"
                          />
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => addComment('comment')}>
                          <MessageSquare className="h-3.5 w-3.5" />
                          Comment
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => addComment('change_request')}>
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Request changes
                        </Button>
                        <Button size="sm" variant="primary" onClick={approve}>
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-ink-800">
                    {comments.length === 0 && (
                      <EmptyState title="Belum ada komentar" description="Komentar review akan muncul di sini." />
                    )}
                    {comments.map((cm) => {
                      const author = userById(cm.authorId)
                      return (
                        <div key={cm.id} className={cn('flex gap-3 p-4', cm.resolved && 'opacity-60')}>
                          <Avatar name={author?.name ?? '?'} color={author?.avatarColor} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[12px] font-medium text-ink-100">{author?.name}</span>
                              <span className="text-[10px] text-ink-600">{relTime(cm.createdAt)}</span>
                              {cm.kind === 'change_request' && (
                                <Badge color="#f59e0b" size="xs">
                                  Request changes
                                </Badge>
                              )}
                              {cm.kind === 'approval' && (
                                <Badge color="#22c55e" size="xs">
                                  Approval
                                </Badge>
                              )}
                              {cm.timestampSec != null && (
                                <span className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-sky-400">
                                  {duration(cm.timestampSec)}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[12px] leading-relaxed text-ink-300">{cm.body}</p>
                            <div className="mt-1.5 flex gap-2">
                              <button
                                onClick={() => void actions.updateComment(cm.id, { resolved: !cm.resolved })}
                                className="text-[10px] text-ink-500 transition-colors hover:text-ink-300"
                              >
                                {cm.resolved ? 'Buka lagi' : 'Tandai resolved'}
                              </button>
                              <button
                                onClick={() => setCommentTs(cm.timestampSec?.toString() ?? '')}
                                className="text-[10px] text-ink-600 transition-colors hover:text-ink-300"
                              >
                                Balas di {duration(cm.timestampSec ?? 0)}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {tab === 'analytics' && (
                <div className="p-4">
                  {metrics.length === 0 ? (
                    <EmptyState
                      icon={<Sparkles className="h-5 w-5" />}
                      title="Analytics belum tersedia"
                      description="Konten ini belum dipublikasikan atau metrik belum diinput."
                    />
                  ) : (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ink-700 bg-ink-700 sm:grid-cols-4">
                        {[
                          { label: 'Views', value: compact(totalViews) },
                          { label: 'Likes', value: compact(metrics.reduce((a, b) => a + b.likes, 0)) },
                          { label: 'Comments', value: compact(metrics.reduce((a, b) => a + b.comments, 0)) },
                          { label: 'Engagement', value: pct(totalEng / (totalViews || 1)) },
                        ].map((s) => (
                          <div key={s.label} className="bg-ink-900 px-3 py-3">
                            <div className="text-[10px] uppercase tracking-wider text-ink-500">{s.label}</div>
                            <div className="mt-1 text-lg font-bold tabular-nums text-ink-100">{s.value}</div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4 className="mb-3 text-[12px] font-semibold text-ink-200">Per platform</h4>
                        <RankedBar
                          items={metrics.map((m) => ({
                            label: platformMeta(m.platform).label,
                            value: m.views,
                            color: platformMeta(m.platform).color,
                            meta: `${pct((m.likes + m.comments + m.shares + m.saves) / (m.views || 1))} engagement - ${compact(m.followersGained)} followers`,
                          }))}
                          format={(v) => compact(v)}
                        />
                      </div>

                      <div className="rounded-lg border border-ink-800 bg-ink-850/60 p-3">
                        <div className="flex items-center gap-2">
                          <Upload className="h-3.5 w-3.5 text-ink-400" />
                          <span className="text-[12px] font-medium text-ink-200">Input metrik manual</span>
                        </div>
                        <p className="mt-1 text-[11px] text-ink-500">
                          Pada MVP, metrik diinput manual. Integrasi API platform ada di Phase 2 (V2).
                        </p>
                        <AnalyticsInput rows={metrics} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'activity' && (
                <div className="p-4">
                  <ol className="relative space-y-4 border-l border-ink-800 pl-5">
                    {state.activity
                      .filter((a) => a.targetId === content.id)
                      .map((a) => {
                        const actor = userById(a.actorId)
                        return (
                          <li key={a.id} className="relative">
                            <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-brand-600 ring-4 ring-ink-900" />
                            <p className="text-[12px] leading-snug text-ink-200">{a.verb}</p>
                            <p className="mt-0.5 text-[10px] text-ink-500">
                              {actor?.name} - {fmtDateTime(a.at)}
                            </p>
                          </li>
                        )
                      })}
                    {state.activity.filter((a) => a.targetId === content.id).length === 0 && (
                      <EmptyState title="Belum ada aktivitas" />
                    )}
                  </ol>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Meta */}
            <Card>
              <CardHeader title="Details" action={<IconButton label="Edit" onClick={() => setEditOpen(true)}><Pencil className="h-3.5 w-3.5" /></IconButton>} />
              <div className="divide-y divide-ink-800 text-[12px]">
                <MetaRow label="Content type">
                  <PlatformChip meta={platformMeta(content.type)} size="xs" />
                </MetaRow>
                <MetaRow label="Brand">{brand?.name ?? '-'}</MetaRow>
                <MetaRow label="Campaign">
                  {campaign ? (
                    <Badge color={campaign.color} size="xs">
                      {campaign.name}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </MetaRow>
                <MetaRow label="Creator">
                  <button
                    onClick={() => setAssignOpen(true)}
                    className="flex items-center gap-1.5 transition-colors hover:text-ink-100"
                  >
                    <Avatar name={creator?.name ?? '?'} color={creator?.avatarColor} size="xs" />
                    {creator?.name}
                    <ChevronRight className="h-3 w-3 text-ink-600" />
                  </button>
                </MetaRow>
                <MetaRow label="Reviewer">
                  {reviewer ? (
                    <span className="flex items-center gap-1.5">
                      <Avatar name={reviewer.name} color={reviewer.avatarColor} size="xs" />
                      {reviewer.name}
                    </span>
                  ) : (
                    <button onClick={() => setAssignOpen(true)} className="text-brand-300 hover:underline">
                      Assign reviewer
                    </button>
                  )}
                </MetaRow>
                <MetaRow label="Owner">{owner?.name ?? '-'}</MetaRow>
                <MetaRow label="Deadline">
                  {content.deadline ? (
                    <span className={cn(content.deadline < new Date().toISOString() && 'text-red-400')}>
                      {fmtDateTime(content.deadline)}
                    </span>
                  ) : (
                    '-'
                  )}
                </MetaRow>
                <MetaRow label="Scheduled">{fmtDateTime(content.scheduledAt)}</MetaRow>
                <MetaRow label="Published">{fmtDateTime(content.publishedAt)}</MetaRow>
                <MetaRow label="Created">{fmtDateTime(content.createdAt)}</MetaRow>
                <MetaRow label="Updated">{relTime(content.updatedAt)}</MetaRow>
              </div>
              {content.tags.length > 0 && (
                <div className="border-t border-ink-800 p-3">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {content.tags.map((t) => (
                      <Badge key={t} color="#6b6b85" size="xs">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* AI score */}
            <AIScoreCard content={content} />

            {/* Assets */}
            <Card>
              <CardHeader
                title="Assets"
                subtitle={`${assets.length} file terlampir`}
                icon={<Paperclip className="h-4 w-4" />}
                action={
                  <Button size="xs" variant="ghost" onClick={() => navigate('/assets')}>
                    Library
                  </Button>
                }
              />
              <div className="p-3">
                {assets.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-ink-700 py-6 text-center">
                    <p className="text-[11px] text-ink-600">Belum ada asset</p>
                    <Link to="/assets" className="mt-1 inline-block text-[11px] text-brand-300 hover:underline">
                      Upload dari library
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {assets.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-2.5 rounded-lg border border-ink-800 bg-ink-850/60 p-2"
                      >
                        <AssetThumb asset={a} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[11px] font-medium text-ink-100">{a.name}</div>
                          <div className="text-[10px] text-ink-500">
                            {a.ext.toUpperCase()} - {bytes(a.sizeKb)}
                            {a.durationSec ? ` - ${duration(a.durationSec)}` : ''}
                          </div>
                        </div>
                        <IconButton label="Hapus dari konten" onClick={() => {
                          void actions.updateContent(content.id, { assetIds: content.assetIds.filter((x) => x !== a.id) })
                          toast('Asset dilepas dari konten', 'info')
                        }}>
                          <X className="h-3.5 w-3.5" />
                        </IconButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Multi platform summary */}
            <Card>
              <CardHeader title="Multi-platform" subtitle="Satu master, banyak kanal" />
              <div className="divide-y divide-ink-800">
                {content.platforms.map((p) => {
                  const meta = platformMeta(p.platform)
                  return (
                    <div key={p.platform} className="flex items-center gap-2.5 px-4 py-2.5">
                      <PlatformChip meta={meta} size="xs" showLabel={false} />
                      <span className="min-w-0 flex-1 truncate text-[12px] text-ink-200">{meta.label}</span>
                      {p.publishedAt ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                          <Check className="h-3 w-3" /> Live
                        </span>
                      ) : p.scheduledAt ? (
                        <span className="text-[10px] tabular-nums text-teal-400">
                          {fmtDate(p.scheduledAt, { withYear: false })}
                        </span>
                      ) : (
                        <span className="text-[10px] text-ink-600">-</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>

            {totalViews > 0 && (
              <Card>
                <CardHeader title="Quick stats" />
                <div className="p-4">
                  <BarChart
                    height={90}
                    data={metrics.map((m) => ({
                      label: platformMeta(m.platform).short,
                      value: m.views,
                      color: platformMeta(m.platform).color,
                    }))}
                    format={(v) => compact(v)}
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      </PageBody>

      {/* Modals */}
      <EditContentModal open={editOpen} onClose={() => setEditOpen(false)} content={content} />
      <AssignModal open={assignOpen} onClose={() => setAssignOpen(false)} content={content} />
      <QuickScheduleModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} content={content} />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        size="sm"
        title="Hapus konten"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                void actions.deleteContent(content.id)
                toast('Konten dihapus', 'warn')
                navigate('/content')
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus permanen
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-300">
          Hapus <span className="font-medium text-ink-100">#{content.ref} {content.title}</span>? Komentar,
          script, dan analytics terkait juga akan dihapus.
        </p>
      </Modal>
    </>
  )
}

// ---------------------------------------------------------------------------
// Sub components
// ---------------------------------------------------------------------------

function BriefItem({
  label,
  value,
  highlight,
  mono,
}: {
  label: string
  value: string
  highlight?: boolean
  mono?: boolean
}) {
  return (
    <div>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">{label}</span>
      <p
        className={cn(
          'whitespace-pre-wrap text-[12px] leading-relaxed',
          highlight ? 'text-brand-200' : 'text-ink-200',
          mono && 'font-mono text-[11px] text-sky-400',
          !value && 'italic text-ink-600',
        )}
      >
        {value || 'Belum diisi'}
      </p>
    </div>
  )
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="shrink-0 text-[11px] text-ink-500">{label}</span>
      <span className="min-w-0 truncate text-right text-ink-200">{children}</span>
    </div>
  )
}

function AssetThumb({ asset }: { asset: { kind: string; ext: string; color: string } }) {
  const icons = {
    video: Play,
    image: Upload,
    model: Plus,
    document: Paperclip,
    audio: Play,
  } as const
  const Icon = icons[asset.kind as keyof typeof icons] ?? Paperclip
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
      style={{ background: `color-mix(in oklab, ${asset.color} 25%, transparent)`, color: asset.color }}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  )
}

function AIScoreCard({ content }: { content: Content }) {
  // Deterministic pseudo-score derived from the content itself.
  const hash = content.title.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const scores = [
    { label: 'Hook clarity', value: 68 + (hash % 28) },
    { label: 'CTA clarity', value: 62 + (hash % 34) },
    { label: 'Readability', value: 60 + (hash % 30) },
    { label: 'Platform fit', value: 70 + (hash % 26) },
  ]
  const avg = Math.round(scores.reduce((a, b) => a + b.value, 0) / scores.length)
  const tone = avg >= 82 ? '#22c55e' : avg >= 70 ? '#f59e0b' : '#ef4444'

  return (
    <Card>
      <CardHeader
        title="AI Content Score"
        subtitle="Pemeriksaan kualitas, bukan ranking"
        icon={<Sparkles className="h-4 w-4 text-brand-300" />}
        action={
          <Link to="/ai" className="text-[11px] text-brand-300 hover:underline">
            Buka AI Studio
          </Link>
        }
      />
      <div className="flex items-center gap-4 p-4">
        <RadialGauge value={avg} size={64} color={tone} thickness={6}>
          <span className="text-sm font-bold tabular-nums text-ink-100">{avg}</span>
        </RadialGauge>
        <div className="min-w-0 flex-1 space-y-2">
          {scores.map((s) => (
            <div key={s.label}>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-ink-400">{s.label}</span>
                <span className="tabular-nums text-ink-300">{s.value}%</span>
              </div>
              <Progress
                value={s.value}
                height={3}
                color={s.value >= 82 ? '#22c55e' : s.value >= 70 ? '#f59e0b' : '#ef4444'}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-ink-800 px-4 py-2.5">
        <p className="text-[11px] leading-relaxed text-ink-500">
          Saran: hook menyebut angka spesifik akan menaikkan retention. Tambahkan klaim berbasis data di 3
          detik pertama.
        </p>
      </div>
    </Card>
  )
}

function ScriptTab({ content, scriptId }: { content: Content; scriptId?: string }) {
  const { state, actions, toast } = useStore()
  const script = state.scripts.find((s) => s.id === scriptId)

  if (!script) {
    return (
      <EmptyState
        icon={<Pencil className="h-5 w-5" />}
        title="Belum ada script"
        description="Buat script untuk konten ini agar tim produksi punya acuan."
        action={
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              void actions
                .createScript({
                  contentId: content.id,
                  title: content.title,
                  blocks: [
                    {
                      id: `blk_${content.ref}_1`,
                      kind: 'hook',
                      heading: 'HOOK',
                      body: content.brief.hook || content.title,
                    },
                    {
                      id: `blk_${content.ref}_2`,
                      kind: 'voiceover',
                      heading: 'VOICEOVER',
                      body: content.brief.keyMessage || content.description,
                    },
                    {
                      id: `blk_${content.ref}_3`,
                      kind: 'cta',
                      heading: 'CTA',
                      body: content.cta || content.brief.cta,
                    },
                  ],
                })
                .then(() => toast('Script dibuat dari content brief'))
                .catch(() => toast('Gagal membuat script', 'danger'))
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Buat dari brief
          </Button>
        }
      />
    )
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-ink-200">{script.title}</span>
          <Badge color="#6b6b85" size="xs">
            v{script.version}
          </Badge>
        </div>
        <div className="flex gap-1.5">
          <Link to={`/scripts?content=${content.id}`}>
            <Button size="xs" variant="secondary">
              <ExternalLink className="h-3 w-3" />
              Editor penuh
            </Button>
          </Link>
          <CopyButton value={() => script.blocks.map((b) => `[${b.heading}]\n${b.body}`).join('\n\n')} label="Copy script" size="xs" variant="ghost" />
        </div>
      </div>
      <div className="space-y-2">
        {script.blocks.map((b) => (
          <div key={b.id} className="rounded-lg border border-ink-800 bg-ink-850/60 p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="rounded bg-brand-600/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand-300">
                {b.heading}
              </span>
              <span className="text-[10px] capitalize text-ink-600">{b.kind}</span>
            </div>
            <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-ink-200">{b.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CaptionsTab({ content }: { content: Content }) {
  const { actions, platformMeta, toast } = useStore()
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(content.platforms.map((p) => [p.platform, p.caption])),
  )

  const save = async () => {
    try {
      await actions.updateContent(content.id, {
        platforms: content.platforms.map((p) => ({
          platform: p.platform,
          caption: drafts[p.platform] ?? p.caption,
          hashtags: p.hashtags,
          scheduledAt: p.scheduledAt,
          publishedAt: p.publishedAt,
        })),
      })
      toast('Caption disimpan untuk semua platform')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menyimpan caption', 'danger')
    }
  }

  /** Replaces one platform's draft caption, used by the AI caption button. */
  const setCaption = (platform: string, caption: string) =>
    setDrafts((prev) => ({ ...prev, [platform]: caption }))

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] text-ink-500">
          Setiap platform punya caption sendiri. Edit di bawah lalu simpan.
        </p>
        <Button size="xs" variant="primary" onClick={save}>
          Simpan semua
        </Button>
      </div>
      <div className="space-y-4">
        {content.platforms.map((p) => {
          const meta = platformMeta(p.platform)
          const text = drafts[p.platform] ?? ''
          const over = meta.maxCaption > 0 && text.length > meta.maxCaption
          return (
            <div key={p.platform}>
              <div className="mb-1.5 flex items-center gap-2">
                <PlatformChip meta={meta} size="xs" />
                <span className={cn('text-[10px] tabular-nums', over ? 'text-red-400' : 'text-ink-500')}>
                  {text.length}/{meta.maxCaption || '-'}
                </span>
                <div className="ml-auto flex gap-1">
                  <CopyButton value={text} size="xs" variant="ghost" />
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      void actions
                        .generate({
                          tool: 'caption',
                          prompt: content.brief.topic || content.title,
                          platform: p.platform,
                          brandId: content.brandId,
                          contentId: content.id,
                        })
                        .then((res) => {
                          setCaption(p.platform, res.output)
                          toast('Caption di-generate ulang dengan brand voice', 'info')
                        })
                        .catch(() => toast('Gagal generate caption', 'danger'))
                    }}
                  >
                    <Sparkles className="h-3 w-3" />
                    AI
                  </Button>
                </div>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setDrafts((d) => ({ ...d, [p.platform]: e.target.value }))}
                rows={5}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AnalyticsInput({
  rows,
}: {
  rows: {
    contentId: string
    platform: Platform
    views: number
    likes: number
    comments: number
    shares: number
    saves: number
    watchTimeMin: number
    ctr: number
    followersGained: number
  }[]
}) {
  const { actions, toast, platformMeta } = useStore()
  if (!rows.length) return null
  const row = rows[0]!

  return (
    <div className="mt-3">
      <span className="mb-2 block text-[10px] text-ink-600">
        Form untuk {platformMeta(row.platform).label}. Tabel analytics harian terupdate pada sinkron
        berikutnya.
      </span>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ['views', 'Views'],
            ['likes', 'Likes'],
            ['comments', 'Comments'],
            ['shares', 'Shares'],
            ['saves', 'Saves'],
            ['watchTimeMin', 'Watch time (min)'],
            ['ctr', 'CTR (%)'],
            ['followersGained', 'Followers gained'],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label}>
            <Input
              type="number"
              defaultValue={row[key]}
              onBlur={(e) => {
                const val = Number(e.target.value) || 0
                const next = rows.map((r) =>
                  r.contentId === row.contentId && r.platform === row.platform
                    ? { ...r, [key]: key === 'ctr' ? val / 100 : val }
                    : r,
                )
                void actions
                  .saveContentAnalytics(row.contentId, next)
                  .then(() => toast(`Metrik ${label} diperbarui`))
                  .catch(() => toast('Gagal menyimpan metrik', 'danger'))
              }}
            />
          </Field>
        ))}
      </div>
    </div>
  )
}

function EditContentModal({
  open,
  onClose,
  content,
}: {
  open: boolean
  onClose: () => void
  content: Content
}) {
  const { actions, toast } = useStore()
  const [title, setTitle] = useState(content.title)
  const [description, setDescription] = useState(content.description)
  const [priority, setPriority] = useState(content.priority)
  const [deadline, setDeadline] = useState(toLocalInput(content.deadline))
  const [notes, setNotes] = useState(content.notes)
  const [hook, setHook] = useState(content.brief.hook)
  const [cta, setCta] = useState(content.cta)
  const [tags, setTags] = useState(content.tags.join(', '))

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Edit Content #${content.ref}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              void actions.updateContent(content.id, {
                  title,
                  description,
                  priority,
                  deadline: deadline ? new Date(deadline).toISOString() : undefined,
                  dueDate: deadline ? new Date(deadline).toISOString() : undefined,
                  notes,
                  cta,
                  tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
                  brief: { ...content.brief, hook },
                })
              toast('Perubahan disimpan')
              onClose()
            }}
          >
            Simpan
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Judul" className="sm:col-span-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Deskripsi" className="sm:col-span-2">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </Field>
        <Field label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Content['priority'])}>
            {['low', 'medium', 'high', 'urgent'].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Deadline">
          <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label="Hook" className="sm:col-span-2">
          <Textarea value={hook} onChange={(e) => setHook(e.target.value)} rows={2} />
        </Field>
        <Field label="CTA" className="sm:col-span-2">
          <Input value={cta} onChange={(e) => setCta(e.target.value)} />
        </Field>
        <Field label="Tags" className="sm:col-span-2" hint="Pisahkan dengan koma">
          <Input value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
        <Field label="Internal notes" className="sm:col-span-2">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </Field>
      </div>
    </Modal>
  )
}

function AssignModal({
  open,
  onClose,
  content,
}: {
  open: boolean
  onClose: () => void
  content: Content
}) {
  const { state, actions, toast } = useStore()
  const [creatorId, setCreatorId] = useState(content.creatorId)
  const [reviewerId, setReviewerId] = useState(content.reviewerId ?? '')

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Assignment"
      subtitle={`#${content.ref} ${content.title}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              // The assignment change is recorded in the activity log by the API.
              void actions
                .updateContent(content.id, { creatorId, reviewerId: reviewerId || null })
                .then(() => {
                  toast('Assignment diperbarui')
                  onClose()
                })
                .catch(() => toast('Gagal menyimpan assignment', 'danger'))
            }}
          >
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Creator">
          <Select value={creatorId} onChange={(e) => setCreatorId(e.target.value)}>
            {state.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} - {u.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Reviewer">
          <Select value={reviewerId} onChange={(e) => setReviewerId(e.target.value)}>
            <option value="">Belum ditentukan</option>
            {state.members.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} - {ROLE_LABEL[u.role]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  )
}

function QuickScheduleModal({
  open,
  onClose,
  content,
}: {
  open: boolean
  onClose: () => void
  content: Content
}) {
  const { actions, toast, platformMeta } = useStore()
  const [dateTime, setDateTime] = useState(() => toLocalInput(new Date(Date.now() + 86400000).toISOString()))

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Jadwalkan publish"
      subtitle={content.title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              const iso = new Date(dateTime).toISOString()
              void actions.updateContent(content.id, {
                  scheduledAt: iso,
                  status: 'scheduled',
                  platforms: content.platforms.map((p, i) => (i === 0 ? { ...p, scheduledAt: iso } : p)),
                })
              toast('Konten dijadwalkan')
              onClose()
            }}
          >
            <Clock className="h-3.5 w-3.5" />
            Jadwalkan
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Tanggal dan waktu" hint="Timezone: Asia/Jakarta">
          <Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
        </Field>
        <div>
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-ink-400">
            Akan tayang di
          </span>
          <div className="flex flex-wrap gap-1.5">
            {content.platforms.map((p) => (
              <PlatformChip key={p.platform} meta={platformMeta(p.platform)} size="xs" />
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-ink-800 bg-ink-850/60 p-3">
          <p className="text-[11px] leading-relaxed text-ink-400">
            Setelah dijadwalkan, gunakan tombol <span className="text-ink-200">Copy &amp; publish</span> di
            calendar untuk memindahkan konten ke aplikasi platform sampai API tersedia.
          </p>
        </div>
      </div>
    </Modal>
  )
}

