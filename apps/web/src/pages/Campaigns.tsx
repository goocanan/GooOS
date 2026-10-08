import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Target, Trash2, Pencil, Check, Megaphone } from 'lucide-react'
import { useStore, reportErrorHelper } from '@/lib/store'
import { PageBody, PageHeader, FilterChip } from '@/components/page'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Progress,
  Select,
  Textarea,
} from '@/components/ui'
import { PlatformChip, StatusBadge } from '@/components/content'
import { STATUS_META, type Campaign, type ContentStatus } from '@/lib/types'
import { cn, fmtDate } from '@/lib/utils'

const CAMPAIGN_STATUS_COLOR = {
  planning: '#818cf8',
  active: '#22c55e',
  completed: '#64748b',
} as const

export default function Campaigns() {
  const { workspaceCampaigns, workspaceContents, platformMeta, actions, toast } = useStore()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<'all' | 'planning' | 'active' | 'completed'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Campaign | null>(null)

  const campaigns = workspaceCampaigns.filter((c) => filter === 'all' || c.status === filter)
  const selectedId = params.get('id')
  const selected = workspaceCampaigns.find((c) => c.id === selectedId)

  return (
    <>
      <PageHeader
        title="Campaigns"
        description={`${workspaceCampaigns.length} campaign - ${workspaceCampaigns.filter((c) => c.status === 'active').length} sedang berjalan`}
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Campaign
          </Button>
        }
      />

      <PageBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'planning', 'active', 'completed'] as const).map((f) => (
            <FilterChip
              key={f}
              active={filter === f}
              onClick={() => setFilter(f)}
              count={f === 'all' ? workspaceCampaigns.length : workspaceCampaigns.filter((c) => c.status === f).length}
            >
              {f[0]!.toUpperCase() + f.slice(1)}
            </FilterChip>
          ))}
        </div>

        {campaigns.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Megaphone className="h-5 w-5" />}
              title="Belum ada campaign"
              description="Campaign mengelompokkan konten agargoal dan reporting lebih jelas."
              action={
                <Button size="sm" variant="primary" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Buat campaign
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {campaigns.map((c) => {
              const items = workspaceContents.filter((x) => x.campaignId === c.id)
              const published = items.filter((x) => x.status === 'published').length
              const scheduled = items.filter((x) => x.status === 'scheduled').length
              const progress = items.length ? (published / items.length) * 100 : 0
              const days = Math.max(
                1,
                Math.round(
                  (new Date(c.end).getTime() - new Date(c.start).getTime()) / 86400000,
                ),
              )
              const elapsed = Math.min(
                days,
                Math.max(
                  0,
                  Math.round((Date.now() - new Date(c.start).getTime()) / 86400000),
                ),
              )
              const timeline = (elapsed / days) * 100

              return (
                <Card key={c.id} className="group overflow-hidden">
                  <div className="h-1" style={{ background: c.color }} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-[14px] font-semibold text-ink-100">{c.name}</h3>
                          <Badge color={CAMPAIGN_STATUS_COLOR[c.status]} size="xs" dot>
                            {c.status}
                          </Badge>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
                          <span className="inline-flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {c.goal}
                          </span>
                          <span>
                            {fmtDate(c.start, { withYear: false })} - {fmtDate(c.end)}
                          </span>
                          {c.budget && <span>Budget Rp{(c.budget / 1000000).toFixed(1)}jt</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => setEditTarget(c)}
                          className="rounded p-1.5 text-ink-500 transition-colors hover:bg-ink-800 hover:text-ink-200"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            void actions.deleteCampaign(c.id)
                            toast('Campaign dihapus', 'warn')
                          }}
                          className="rounded p-1.5 text-ink-500 transition-colors hover:bg-ink-800 hover:text-red-400"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-[10px] text-ink-500">
                        <span>Timeline {Math.round(timeline)}%</span>
                        <span>
                          {days} hari
                        </span>
                      </div>
                      <Progress value={timeline} height={4} color={c.color} />
                    </div>

                    {/* Content stats */}
                    <div className="mt-4 grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-ink-800 bg-ink-800">
                      {[
                        { label: 'Konten', value: items.length },
                        { label: 'Published', value: published },
                        { label: 'Scheduled', value: scheduled },
                        { label: 'Completion', value: `${Math.round(progress)}%` },
                      ].map((s) => (
                        <div key={s.label} className="bg-ink-900 px-2 py-2 text-center">
                          <div className="text-[9px] uppercase tracking-wider text-ink-500">{s.label}</div>
                          <div className="mt-0.5 text-sm font-bold tabular-nums text-ink-100">{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Content list */}
                    <div className="mt-3 space-y-1">
                      {items.slice(0, 4).map((item) => (
                        <Link
                          key={item.id}
                          to={`/content/${item.id}`}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-ink-850"
                        >
                          <span
                            className="h-6 w-1 shrink-0 rounded-full"
                            style={{ background: STATUS_META[item.status].color }}
                          />
                          <span className="min-w-0 flex-1 truncate text-[11px] text-ink-300">{item.title}</span>
                          <PlatformChip meta={platformMeta(item.type)} size="xs" showLabel={false} />
                        </Link>
                      ))}
                      {items.length > 4 && (
                        <div className="px-2 text-[10px] text-ink-600">+{items.length - 4} konten lainnya</div>
                      )}
                      {items.length === 0 && (
                        <div className="rounded-lg border border-dashed border-ink-700 py-4 text-center text-[11px] text-ink-600">
                          Belum ada konten di campaign ini
                        </div>
                      )}
                    </div>

                    <Button
                      size="xs"
                      variant="ghost"
                      className="mt-3 w-full"
                      onClick={() => setParams({ id: c.id })}
                    >
                      Lihat detail campaign
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </PageBody>

      <CampaignModal
        open={createOpen || Boolean(editTarget)}
        onClose={() => {
          setCreateOpen(false)
          setEditTarget(null)
        }}
        campaign={editTarget}
      />

      <Modal
        open={Boolean(selected)}
        onClose={() => setParams({})}
        size="lg"
        title={selected?.name}
        subtitle={selected?.goal}
      >
        {selected && <CampaignDetail campaign={selected} />}
      </Modal>
    </>
  )
}

function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const { workspaceContents, platformMeta, actions, toast } = useStore()
  // The API denormalises the rollup onto the campaign (contentCount), but the
  // detail view needs the rows themselves to render the status breakdown.
  const items = workspaceContents.filter((x) => x.campaignId === campaign.id)
  const [newId, setNewId] = useState('')
  const byStatus = useMemo(() => {
    const map = new Map<ContentStatus, number>()
    items.forEach((i) => map.set(i.status, (map.get(i.status) ?? 0) + 1))
    return [...map.entries()]
  }, [items])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ink-700 bg-ink-700 sm:grid-cols-4">
        {byStatus.map(([status, count]) => (
          <div key={status} className="bg-ink-900 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-500">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_META[status].color }} />
              {STATUS_META[status].label}
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-ink-100">{count}</div>
          </div>
        ))}
      </div>

      <div>
        <h4 className="mb-2 text-[12px] font-semibold text-ink-200">Daftar konten</h4>
        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/content/${item.id}`}
              className="flex items-center gap-2.5 rounded-lg border border-ink-800 bg-ink-850/60 px-3 py-2 transition-colors hover:border-ink-600"
            >
              <PlatformChip meta={platformMeta(item.type)} size="xs" showLabel={false} />
              <span className="min-w-0 flex-1 truncate text-[12px] text-ink-200">{item.title}</span>
              <StatusBadge status={item.status} size="xs" />
              <span className="shrink-0 text-[10px] text-ink-600">#{item.ref}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-[12px] font-semibold text-ink-200">Tambah konten ke campaign</h4>
        <div className="flex gap-2">
          <Select value={newId} onChange={(e) => setNewId(e.target.value)} className="flex-1">
            <option value="">Pilih konten...</option>
            {workspaceContents
              .filter((c) => c.campaignId !== campaign.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.ref} {c.title}
                </option>
              ))}
          </Select>
          <Button
            size="md"
            variant="secondary"
            disabled={!newId}
            onClick={() => {
              void actions.attachContentToCampaign(campaign.id, newId).then(() => {
                toast('Konten ditambahkan ke campaign')
                setNewId('')
              })
            }}
          >
            <Check className="h-3.5 w-3.5" />
            Tambahkan
          </Button>
        </div>
      </div>
    </div>
  )
}

function CampaignModal({
  open,
  onClose,
  campaign,
}: {
  open: boolean
  onClose: () => void
  campaign: Campaign | null
}) {
  const { workspaceBrands, actions, toast } = useStore()
  const report = reportErrorHelper(toast)
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('Product Awareness')
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10))
  const [end, setEnd] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
  const [brandId, setBrandId] = useState('')
  const [color, setColor] = useState('#b81e51')
  const [budget, setBudget] = useState('')

  const colors = ['#b81e51', '#d4af37', '#38bdf8', '#34d399', '#f59e0b', '#a78bfa']

  const submit = async () => {
    if (!name.trim()) return
    const payload = {
      name: name.trim(),
      goal,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      color,
      budget: budget ? Number(budget) : undefined,
    }
    try {
      if (campaign) {
        await actions.updateCampaign(campaign.id, payload)
        toast('Campaign diperbarui')
      } else {
        await actions.createCampaign({
          ...payload,
          brandId: brandId || workspaceBrands[0]?.id || '',
          status: 'planning',
        })
        toast('Campaign dibuat')
      }
      setName('')
      setBudget('')
      onClose()
    } catch (err) {
      report(err, 'Gagal menyimpan campaign')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={campaign ? 'Edit campaign' : 'New campaign'}
      subtitle="Kelompokkan konten berdasarkan tujuan dan periode."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" onClick={submit} disabled={!name.trim()}>
            {campaign ? 'Simpan' : 'Buat campaign'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama campaign" required className="sm:col-span-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: October Product Launch"
          />
        </Field>
        <Field label="Goal">
          <Select value={goal} onChange={(e) => setGoal(e.target.value)}>
            {['Product Awareness', 'Education', 'Sales', 'Engagement', 'Traffic'].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Budget (IDR)" hint="Opsional">
          <Input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="4500000"
          />
        </Field>
        <Field label="Mulai">
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Selesai">
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
        {!campaign && (
          <Field label="Brand" className="sm:col-span-2">
            <Select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              {workspaceBrands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Warna" className="sm:col-span-2">
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  'h-7 w-7 rounded-lg border-2 transition-transform',
                  color === c ? 'border-ink-100 scale-110' : 'border-transparent',
                )}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>
        <Field label="Catatan" className="sm:col-span-2">
          <Textarea placeholder="Konteks campaign, asset siap, atau catatan penting." rows={2} />
        </Field>
      </div>
    </Modal>
  )
}