import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Save } from 'lucide-react'
import { Button, Modal, Field, Input, Select, Textarea } from './ui'
import { PLATFORM_LIST } from '@/lib/types'
import type { ContentStatus, Platform, Priority } from '@/lib/types'
import { useStore, reportErrorHelper } from '@/lib/store'
import { toLocalInput } from '@/lib/utils'

export function CreateContentModal({
  open,
  onClose,
  prefillTitle,
}: {
  open: boolean
  onClose: () => void
  prefillTitle?: string
}) {
  const { state, currentWorkspace, currentUser, actions, toast } = useStore()
  const navigate = useNavigate()
  const report = reportErrorHelper(toast)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<Platform>('tiktok')
  const [status, setStatus] = useState<ContentStatus>('idea')
  const [priority, setPriority] = useState<Priority>('medium')
  const [brandId, setBrandId] = useState(currentWorkspace.id)
  const [campaignId, setCampaignId] = useState('')
  const [creatorId, setCreatorId] = useState(currentUser.id)
  const [reviewerId, setReviewerId] = useState('')
  const [tags, setTags] = useState('')
  const [deadline, setDeadline] = useState(toLocalInput(new Date(Date.now() + 3 * 86400000).toISOString()))
  const [extraPlatforms, setExtraPlatforms] = useState<Platform[]>([])
  const [saving, setSaving] = useState(false)

  const members = state.members

  useEffect(() => {
    if (open) {
      setTitle(prefillTitle ?? '')
      setDescription('')
      setStatus('idea')
      setPriority('medium')
      setBrandId(state.brands[0]?.id ?? brandId)
      setCampaignId('')
      setCreatorId(currentUser.id)
      setReviewerId('')
      setTags('')
      setDeadline(toLocalInput(new Date(Date.now() + 3 * 86400000).toISOString()))
      setExtraPlatforms([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillTitle])

  const campaigns = state.campaigns.filter(
    (c) => !brandId || c.brandId === brandId,
  )

  const submit = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const platforms = [type, ...extraPlatforms.filter((p) => p !== type)]
      const content = await actions.createContent({
        title: title.trim(),
        description: description.trim(),
        type,
        status,
        priority,
        brandId: brandId || undefined,
        campaignId: campaignId || null,
        creatorId,
        reviewerId: reviewerId || null,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        deadline: deadline ? new Date(deadline).toISOString() : null,
        platforms: platforms.map((platform) => ({
          platform,
          caption: '',
          hashtags: [],
        })),
        brief: {
          objective: 'Awareness',
          audience: state.brands.find((b) => b.id === brandId)?.audience ?? '',
          topic: title.trim(),
          hook: '',
          keyMessage: description.trim(),
          cta: '',
          reference: [],
          expectedDuration: '30-45 sec',
        },
        productionProgress: status === 'idea' ? 0 : 10,
      })
      toast(`Content #${content.ref} dibuat`)
      onClose()
      navigate(`/content/${content.id}`)
    } catch (err) {
      report(err, 'Gagal membuat konten')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Buat konten baru"
      subtitle={`Content akan dibuat di workspace ${currentWorkspace.name} dengan nomor otomatis.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" onClick={submit} loading={saving} disabled={!title.trim()}>
            <Save className="h-3.5 w-3.5" />
            Buat konten
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Judul konten" required className="sm:col-span-2">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Testing PLA di bawah matahari"
          />
        </Field>

        <Field label="Deskripsi" className="sm:col-span-2">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ringkasan singkat, angle, dan referensi utama."
            rows={3}
          />
        </Field>

        <Field label="Platform utama" required>
          <Select value={type} onChange={(e) => setType(e.target.value as Platform)}>
            {PLATFORM_LIST.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status awal">
          <Select value={status} onChange={(e) => setStatus(e.target.value as ContentStatus)}>
            {(['idea', 'planned', 'script', 'production', 'editing'] as ContentStatus[]).map((s) => (
              <option key={s} value={s}>
                {s[0]!.toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Brand">
          <Select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
            {state.brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Campaign" hint={campaigns.length === 0 ? 'Belum ada campaign aktif' : undefined}>
          <Select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            <option value="">Tanpa campaign</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
              <option key={p} value={p}>
                {p[0]!.toUpperCase() + p.slice(1)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Deadline">
          <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>

        <Field label="Creator (assignee)">
          <Select value={creatorId} onChange={(e) => setCreatorId(e.target.value)}>
            {members.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} - {u.title ?? u.role}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Reviewer">
          <Select value={reviewerId} onChange={(e) => setReviewerId(e.target.value)}>
            <option value="">Belum ditentukan</option>
            {members
              .filter((u) => ['reviewer', 'manager', 'owner', 'admin', 'client'].includes(u.role))
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </Select>
        </Field>

        <Field label="Tags" hint="Pisahkan dengan koma" className="sm:col-span-2">
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="PLA, outdoor, edukasi"
          />
        </Field>

        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-ink-400">
            Multi-platform (PRD 24)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PLATFORM_LIST.filter((p) => p.id !== type).map((p) => {
              const on = extraPlatforms.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    setExtraPlatforms((prev) =>
                      prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                    )
                  }
                  className={on ? 'rounded-md border px-2 py-1 text-[11px] font-medium text-white' : 'border border-ink-700 px-2 py-1 text-[11px] text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-200'}
                  style={
                    on
                      ? { borderColor: p.color, background: `color-mix(in oklab, ${p.color} 18%, transparent)` }
                      : undefined
                  }
                >
                  {p.label}
                </button>
              )
            })}
          </div>
          {extraPlatforms.length > 0 && (
            <p className="mt-2 text-[11px] text-ink-500">
              {extraPlatforms.length + 1} platform akan dibuat dari satu master content, masing-masing
              dengan caption, hashtag, dan jadwal sendiri.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

export function DeleteConfirmModal({
  open,
  onClose,
  title,
  description,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  title: string
  description: string
  onConfirm: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </Button>
        </>
      }
    >
      <p className="text-[13px] leading-relaxed text-ink-300">{description}</p>
    </Modal>
  )
}

