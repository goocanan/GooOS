import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  GripVertical,
  Wand2,
  History,
  Save,
  Clock,
  ChevronRight,
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
  Input,
  Select,
  Textarea,
} from '@/components/ui'
import { StatusBadge } from '@/components/content'
import type { Script, ScriptBlock } from '@/lib/types'
import { cn, relTime, uid, wordCount } from '@/lib/utils'

const KIND_COLOR: Record<ScriptBlock['kind'], string> = {
  hook: '#f43f5e',
  intro: '#f59e0b',
  body: '#818cf8',
  broll: '#38bdf8',
  voiceover: '#a78bfa',
  cta: '#22c55e',
}

const KIND_OPTIONS: { value: ScriptBlock['kind']; label: string }[] = [
  { value: 'hook', label: 'Hook' },
  { value: 'intro', label: 'Intro' },
  { value: 'body', label: 'Body' },
  { value: 'broll', label: 'B-Roll' },
  { value: 'voiceover', label: 'Voice over' },
  { value: 'cta', label: 'CTA' },
]

export default function Scripts() {
  const { workspaceScripts, workspaceContents, actions, toast } = useStore()
  const report = reportErrorHelper(toast)
  const [params] = useSearchParams()
  const contentFilter = params.get('content')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const scripts = useMemo(() => {
    const list = contentFilter
      ? workspaceScripts.filter((s) => s.contentId === contentFilter)
      : workspaceScripts
    return [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [workspaceScripts, contentFilter])

  const active = scripts.find((s) => s.id === selectedId) ?? scripts[0]

  useEffect(() => {
    if (active && active.id !== selectedId) setSelectedId(active.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id])

  const createScript = async () => {
    const content = workspaceContents.find((c) => !workspaceScripts.some((s) => s.contentId === c.id))
    if (!content) {
      toast('Semua konten sudah punya script', 'info')
      return
    }
    try {
      // The server creates the script row and its v1 snapshot (PRD 15/18).
      const script = await actions.createScript({
        contentId: content.id,
        title: content.title,
        blocks: [
          {
            id: `blk_${Date.now()}_1`,
            kind: 'hook',
            heading: 'HOOK',
            body: content.brief.hook || content.title,
          },
          {
            id: `blk_${Date.now()}_2`,
            kind: 'voiceover',
            heading: 'VOICEOVER',
            body: content.brief.keyMessage || content.description,
          },
          {
            id: `blk_${Date.now()}_3`,
            kind: 'cta',
            heading: 'CTA',
            body: content.cta || content.brief.cta,
          },
        ],
      })
      setSelectedId(script.id)
      toast('Script baru dibuat dari content brief')
    } catch (err) {
      report(err, 'Gagal membuat script')
    }
  }

  return (
    <>
      <PageHeader
        title="Scripts"
        description={`${workspaceScripts.length} script - versi dan revisi tersimpan`}
        actions={
          <>
            <Link to="/ai">
              <Button variant="secondary" size="sm">
                <Wand2 className="h-3.5 w-3.5" />
                Generate dengan AI
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={createScript}>
              <Plus className="h-3.5 w-3.5" />
              New Script
            </Button>
          </>
        }
      />

      <PageBody>
        {scripts.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title="Belum ada script"
              description="Script memberi acuan yang sama untuk writer, editor, dan voice over artist."
              action={
                <Button size="sm" variant="primary" onClick={createScript}>
                  <Plus className="h-3.5 w-3.5" />
                  Buat script
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
            {/* Script list */}
            <div className="space-y-2">
              {scripts.map((s) => {
                const content = workspaceContents.find((c) => c.id === s.contentId)
                const words = s.blocks.reduce((a, b) => a + wordCount(b.body), 0)
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={cn(
                      'w-full rounded-xl border p-3 text-left transition-colors',
                      active?.id === s.id
                        ? 'border-brand-600/50 bg-brand-950/20'
                        : 'border-ink-700/70 bg-ink-900 hover:border-ink-600',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-ink-100">{s.title}</div>
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-ink-500">
                          <Badge color="#6b6b85" size="xs">
                            v{s.version}
                          </Badge>
                          <span>{s.blocks.length} blocks</span>
                          <span>{words} words</span>
                        </div>
                      </div>
                      <ChevronRight
                        className={cn(
                          'mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-600',
                          active?.id === s.id && 'text-brand-400',
                        )}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-ink-600">
                      {content && <span>#{content.ref}</span>}
                      <span>{relTime(s.updatedAt)}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Editor */}
            {active && <ScriptEditor script={active} />}
          </div>
        )}
      </PageBody>
    </>
  )
}

function ScriptEditor({ script }: { script: Script }) {
  const { state, actions, toast } = useStore()
  const report = reportErrorHelper(toast)
  const [draft, setDraft] = useState<ScriptBlock[]>(script.blocks)
  const [dirty, setDirty] = useState(false)
  const content = state.contents.find((c) => c.id === script.contentId)

  useEffect(() => {
    setDraft(script.blocks)
    setDirty(false)
  }, [script.id, script.blocks])

  const update = (id: string, patch: Partial<ScriptBlock>) => {
    setDraft((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
    setDirty(true)
  }

  const save = async () => {
    try {
      await actions.updateScript(script.id, { blocks: draft })
      setDirty(false)
      toast('Script disimpan')
    } catch (err) {
      report(err, 'Gagal menyimpan script')
    }
  }

  const words = draft.reduce((a, b) => a + wordCount(b.body), 0)
  const fullText = draft.map((b) => b.body).join(' ')
  const estSec = Math.round(words / 2.5)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={script.title}
          subtitle={content ? `#${content.ref} - ${content.title}` : ''}
          icon={<FileText className="h-4 w-4" />}
          action={
            <div className="flex items-center gap-1.5">
              {content && <StatusBadge status={content.status} size="xs" />}
              <Button size="xs" variant="ghost">
                <History className="h-3 w-3" />
                v{script.version}
              </Button>
            </div>
          }
        />
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-800 px-4 py-2.5 text-[11px] text-ink-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Estimasi {Math.floor(estSec / 60)}:{String(estSec % 60).padStart(2, '0')}
          </span>
          <span>{words} words</span>
          <span>{draft.length} blocks</span>
          {content && (
            <Link to={`/content/${content.id}`} className="ml-auto text-brand-300 hover:underline">
              Buka content
            </Link>
          )}
        </div>
      </Card>

      <div className="space-y-2.5">
        {draft.map((block, i) => (
          <div
            key={block.id}
            className="group rounded-xl border border-ink-700/70 bg-ink-900 transition-colors hover:border-ink-600"
          >
            <div className="flex items-center gap-2 border-b border-ink-800 px-3 py-2">
              <GripVertical className="h-3.5 w-3.5 cursor-grab text-ink-700" />
              <span className="font-mono text-[10px] text-ink-600">{String(i + 1).padStart(2, '0')}</span>
              <Select
                value={block.kind}
                onChange={(e) => update(block.id, { kind: e.target.value as ScriptBlock['kind'] })}
                className="h-6 w-auto px-2 text-[10px] font-semibold uppercase"
              >
                {KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: KIND_COLOR[block.kind] }}
              />
              <Input
                value={block.heading}
                onChange={(e) => update(block.id, { heading: e.target.value })}
                className="ml-1 h-6 max-w-32 px-2 font-mono text-[10px] uppercase"
              />
              <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <CopyButton value={block.body} size="xs" variant="ghost" />
                <button
                  onClick={() => {
                    setDraft((prev) => prev.filter((b) => b.id !== block.id))
                    setDirty(true)
                  }}
                  className="rounded p-1 text-ink-600 transition-colors hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <Textarea
              value={block.body}
              onChange={(e) => update(block.id, { body: e.target.value })}
              rows={block.kind === 'broll' ? 2 : 4}
              className="rounded-none border-0 focus:ring-0"
              placeholder={
                block.kind === 'hook'
                  ? 'Hook 3 detik pertama...'
                  : block.kind === 'broll'
                    ? 'Deskripsi visual...'
                    : block.kind === 'cta'
                      ? 'Ajakan aksi...'
                      : 'Tulis naskah...'
              }
            />
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-2">
          {KIND_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                setDraft((prev) => [
                  ...prev,
                  { id: uid('blk'), kind: o.value, heading: o.label.toUpperCase(), body: '' },
                ])
                setDirty(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-900 px-2.5 py-1.5 text-[11px] text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-200"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: KIND_COLOR[o.value] }} />
              {o.label}
              <Plus className="h-3 w-3" />
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader
          title="Preview"
          subtitle="Tampilan siap produksi"
          icon={<Copy className="h-4 w-4" />}
          action={
            <div className="flex gap-1.5">
              <CopyButton value={fullText} label="Copy semua" size="xs" variant="ghost" />
              <Button
                size="xs"
                variant="primary"
                disabled={!dirty}
                onClick={save}
              >
                <Save className="h-3 w-3" />
                Simpan
              </Button>
            </div>
          }
        />
        <div className="p-4">
          <pre className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-ink-200">
            {draft.map((b) => `[${b.heading}]\n${b.body}\n`).join('\n')}
          </pre>
        </div>
      </Card>
    </div>
  )
}

