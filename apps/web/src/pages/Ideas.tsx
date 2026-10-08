import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Lightbulb,
  Plus,
  ThumbsUp,
  ArrowRight,
  Sparkles,
  Trash2,
  Search,
  LayoutGrid,
  Rows3,
} from 'lucide-react'
import { useStore, reportErrorHelper } from '@/lib/store'
import { PageBody, PageHeader, FilterChip } from '@/components/page'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/components/ui'
import { PlatformChip } from '@/components/content'
import { PLATFORMS, PRIORITY_META, type Idea, type Platform } from '@/lib/types'
import { cn, relTime } from '@/lib/utils'

export default function Ideas() {
  const { state, platformMeta, actions, toast } = useStore()
  const report = reportErrorHelper(toast)
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [platform, setPlatform] = useState<Platform | 'all'>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [createOpen, setCreateOpen] = useState(false)

  const ideas = useMemo(() => {
    let list = state.ideas
    if (q) {
      const term = q.toLowerCase()
      list = list.filter((i) => `${i.title} ${i.description} ${i.tags.join(' ')}`.toLowerCase().includes(term))
    }
    if (platform !== 'all') list = list.filter((i) => i.platform === platform)
    return [...list].sort((a, b) => b.votes - a.votes)
  }, [state.ideas, q, platform])

  const unconverted = ideas.filter((i) => !i.convertedContentId).length

  /**
   * The server owns the whole idea -> content conversion (PRD 13): it creates
   * the content with the next ref number, stamps the brief, and marks the idea
   * as converted, all in one transaction.
   */
  const convert = async (idea: Idea) => {
    try {
      const content = await actions.convertIdea(idea.id)
      toast(`Ide dikonversi menjadi Content #${content.ref}`)
      navigate(`/content/${content.id}`)
    } catch (err) {
      report(err, 'Gagal mengonversi ide')
    }
  }

  return (
    <>
      <PageHeader
        title="Ideas"
        description={`${unconverted} ide belum jadi konten - ${state.ideas.length - unconverted} sudah dikonversi`}
        actions={
          <>
            <Link to="/ai">
              <Button variant="secondary" size="sm">
                <Sparkles className="h-3.5 w-3.5" />
                Generate ideas
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              New Idea
            </Button>
          </>
        }
      />

      <PageBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-500" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ideas..." className="pl-9" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChip active={platform === 'all'} onClick={() => setPlatform('all')}>
              Semua
            </FilterChip>
            {PLATFORMS.slice(0, 8).map((p) => (
              <FilterChip
                key={p.id}
                active={platform === p.id}
                color={p.color}
                onClick={() => setPlatform(p.id)}
                count={state.ideas.filter((i) => i.platform === p.id).length}
              >
                {p.label}
              </FilterChip>
            ))}
          </div>
          <div className="ml-auto flex items-center rounded-lg border border-ink-700 bg-ink-900 p-0.5">
            <button
              onClick={() => setView('grid')}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md',
                view === 'grid' ? 'bg-ink-750 text-ink-100' : 'text-ink-400',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md',
                view === 'list' ? 'bg-ink-750 text-ink-100' : 'text-ink-400',
              )}
            >
              <Rows3 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {ideas.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Lightbulb className="h-5 w-5" />}
              title="Belum ada ide"
              description="Tambahkan ide cepat lalu konversi menjadi konten."
              action={
                <Button size="sm" variant="primary" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Tambah ide
                </Button>
              }
            />
          </Card>
        ) : view === 'grid' ? (
          <div className="columns-1 gap-3 sm:columns-2 xl:columns-3">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onConvert={() => convert(idea)} />
            ))}
          </div>
        ) : (
          <Card className="divide-y divide-ink-800">
            {ideas.map((idea) => {
              const creator = state.users.find((u) => u.id === idea.createdBy)
              return (
                <div key={idea.id} className="flex items-center gap-3 p-3.5 transition-colors hover:bg-ink-850">
                  <button
                    onClick={() => void actions.voteIdea(idea.id, 1)}
                    className="flex w-11 shrink-0 flex-col items-center rounded-lg border border-ink-700 py-1.5 transition-colors hover:border-brand-600"
                  >
                    <ThumbsUp className="h-3 w-3 text-ink-500" />
                    <span className="text-[11px] font-semibold tabular-nums text-ink-200">{idea.votes}</span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink-100">{idea.title}</div>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-500">{idea.description}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <PlatformChip meta={platformMeta(idea.platform)} size="xs" />
                      <Badge color={PRIORITY_META[idea.priority].color} size="xs">
                        {PRIORITY_META[idea.priority].label}
                      </Badge>
                      {idea.tags.map((t) => (
                        <span key={t} className="text-[10px] text-ink-600">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    {creator && <Avatar name={creator.name} color={creator.avatarColor} size="sm" />}
                    <span className="text-[10px] text-ink-600">{relTime(idea.createdAt)}</span>
                  </div>
                  {idea.convertedContentId ? (
                    <Link
                      to={`/content/${idea.convertedContentId}`}
                      className="shrink-0 text-[11px] text-brand-300 hover:underline"
                    >
                      Dibuka
                    </Link>
                  ) : (
                    <Button size="xs" variant="secondary" onClick={() => convert(idea)}>
                      Convert
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )
            })}
          </Card>
        )}
      </PageBody>

      <QuickIdeaModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(idea) => {
          void actions.createIdea(idea).then(() => toast('Ide disimpan'))
        }}
      />
    </>
  )
}

function IdeaCard({ idea, onConvert }: { idea: Idea; onConvert: () => void }) {
  const { state, platformMeta, actions, } = useStore()
  const creator = state.users.find((u) => u.id === idea.createdBy)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mb-3 break-inside-avoid rounded-xl border border-ink-700/70 bg-ink-900 p-3.5 transition-colors hover:border-ink-600">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-medium leading-snug text-ink-100">{idea.title}</h3>
          <p
            className={cn(
              'mt-1.5 text-[12px] leading-relaxed text-ink-400',
              !expanded && 'line-clamp-3',
            )}
          >
            {idea.description}
          </p>
          {idea.description.length > 120 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-[11px] text-brand-300 hover:underline"
            >
              {expanded ? 'Less' : 'More'}
            </button>
          )}
        </div>
        <button
          onClick={() => void actions.voteIdea(idea.id, 1)}
          className="flex shrink-0 flex-col items-center rounded-lg border border-ink-700 px-2 py-1 transition-colors hover:border-brand-600 hover:text-brand-300"
          title="Vote"
        >
          <ThumbsUp className="h-3 w-3" />
          <span className="text-[11px] font-semibold tabular-nums">{idea.votes}</span>
        </button>
      </div>

      {idea.reference && (
        <a
          href={idea.reference}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block truncate text-[10px] text-sky-400 hover:underline"
        >
          {idea.reference}
        </a>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <PlatformChip meta={platformMeta(idea.platform)} size="xs" />
        <Badge color={PRIORITY_META[idea.priority].color} size="xs">
          {PRIORITY_META[idea.priority].label}
        </Badge>
        {idea.tags.map((t) => (
          <span key={t} className="text-[10px] text-ink-600">
            #{t}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-ink-800 pt-2.5">
        <div className="flex items-center gap-1.5">
          {creator && <Avatar name={creator.name} color={creator.avatarColor} size="xs" />}
          <span className="text-[10px] text-ink-600">{relTime(idea.createdAt)}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => void actions.deleteIdea(idea.id)}
            className="rounded p-1 text-ink-600 transition-colors hover:text-red-400"
            title="Hapus ide"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {idea.convertedContentId ? (
            <Link
              to={`/content/${idea.convertedContentId}`}
              className="rounded px-2 py-1 text-[11px] text-brand-300 hover:underline"
            >
              Dibuka
            </Link>
          ) : (
            <Button size="xs" variant="secondary" onClick={onConvert}>
              Convert
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function QuickIdeaModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  /** Writable fields only - the API assigns id, workspaceId, createdBy, votes. */
  onCreated: (
    idea: Omit<Idea, 'id' | 'workspaceId' | 'createdBy' | 'createdAt' | 'votes' | 'convertedContentId'>,
  ) => void
}) {
  const { platformMeta } = useStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [platform, setPlatform] = useState<Platform>('tiktok')
  const [tags, setTags] = useState('')
  const [priority, setPriority] = useState<Idea['priority']>('medium')

  const submit = () => {
    if (!title.trim()) return
    onCreated({
      title: title.trim(),
      description: description.trim(),
      reference: reference.trim(),
      platform,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      priority,
    })
    setTitle('')
    setDescription('')
    setReference('')
    setTags('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Quick add ide"
      subtitle="Simpan ide cepat, kembangkan jadi konten nanti."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" onClick={submit} disabled={!title.trim()}>
            <Plus className="h-3.5 w-3.5" />
            Simpan ide
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Judul ide" required className="sm:col-span-2">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Apakah PLA bisa dipakai untuk outdoor?"
          />
        </Field>
        <Field label="Deskripsi" className="sm:col-span-2">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Angle konten, hipotesis, atau pertanyaan yang mau dijawab."
          />
        </Field>
        <Field label="Platform">
          <Select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Idea['priority'])}>
            {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Reference URL" className="sm:col-span-2">
          <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="https://" />
        </Field>
        <Field label="Tags" hint="Pisahkan dengan koma" className="sm:col-span-2">
          <Input value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-ink-800 bg-ink-850/60 p-3">
        <Sparkles className="h-3.5 w-3.5 text-brand-300" />
        <span className="text-[11px] text-ink-400">
          Setelah disimpan, buka AI Studio untuk mengembangkan hook, script, dan caption.
        </span>
        <span className="ml-auto text-[10px] text-ink-600">
          {platformMeta(platform).label} - {PLATFORMS.find((p) => p.id === platform)?.maxCaption} karakter
        </span>
      </div>
    </Modal>
  )
}

