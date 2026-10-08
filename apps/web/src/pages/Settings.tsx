import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Building2,
  Palette,
  Bell,
  Plug,
  CreditCard,
  KeyRound,
  Shield,
  Check,
  Plus,
  Trash2,
  Copy,
  Webhook,
  Mail,
  Send,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { PageBody, PageHeader } from '@/components/page'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CopyButton,
  Divider,
  Field,
  Input,
  Progress,
  Select,
  Textarea,
  Toggle,
} from '@/components/ui'
import { PlatformChip } from '@/components/content'
import { billingPlans, platformAccounts } from '@/lib/meta'
import { PLATFORMS, type Brand } from '@/lib/types'
import { cn, fmtDate } from '@/lib/utils'

const TABS = [
  { id: 'workspace', label: 'Workspace', icon: Building2 },
  { id: 'brand', label: 'Brand', icon: Palette },
  { id: 'platforms', label: 'Platforms', icon: Plug },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'api', label: 'API', icon: KeyRound },
  { id: 'security', label: 'Security', icon: Shield },
]

export default function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'workspace'
  const { currentWorkspace } = useStore()

  return (
    <>
      <PageHeader title="Settings" description={currentWorkspace.name} />
      <PageBody>
        <div className="grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">
          <nav className="space-y-0.5">
            {TABS.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setParams({ tab: t.id })}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
                    tab === t.id
                      ? 'bg-ink-800 font-medium text-ink-100'
                      : 'text-ink-400 hover:bg-ink-850 hover:text-ink-200',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {t.label}
                </button>
              )
            })}
          </nav>

          <div className="space-y-5">
            {tab === 'workspace' && <WorkspaceTab />}
            {tab === 'brand' && <BrandTab />}
            {tab === 'platforms' && <PlatformsTab />}
            {tab === 'notifications' && <NotificationsTab />}
            {tab === 'billing' && <BillingTab />}
            {tab === 'api' && <ApiTab />}
            {tab === 'security' && <SecurityTab />}
          </div>
        </div>
      </PageBody>
    </>
  )
}

function WorkspaceTab() {
  const { currentWorkspace, state, actions, toast } = useStore()
  const [name, setName] = useState(currentWorkspace.name)
  const [timezone, setTimezone] = useState('Asia/Jakarta')
  const [language, setLanguage] = useState('id-ID')
  const [weekStart, setWeekStart] = useState('monday')

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="General" subtitle="Identitas dan preferensi workspace" icon={<Building2 className="h-4 w-4" />} />
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Nama workspace" className="sm:col-span-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Slug">
            <Input value={currentWorkspace.slug} readOnly className="font-mono text-[12px]" />
          </Field>
          <Field label="Timezone" hint="Dipakai untuk semua jadwal publish">
            <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {['Asia/Jakarta', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/Amsterdam', 'UTC'].map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Bahasa">
            <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="id-ID">Bahasa Indonesia</option>
              <option value="en-US">English</option>
            </Select>
          </Field>
          <Field label="Minggu mulai">
            <Select value={weekStart} onChange={(e) => setWeekStart(e.target.value)}>
              <option value="monday">Senin</option>
              <option value="sunday">Minggu</option>
            </Select>
          </Field>
        </div>
        <div className="flex justify-end border-t border-ink-800 px-4 py-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              void actions.updateWorkspace(currentWorkspace.id, { name })
              toast('Workspace diperbarui')
            }}
          >
            <Check className="h-3.5 w-3.5" />
            Simpan
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Usage & limits" subtitle="Kapasitas plan saat ini" />
        <div className="space-y-4 p-4">
          {[
            {
              label: 'Konten',
              used: currentWorkspace.contentUsage,
              limit: currentWorkspace.contentLimit,
              color: 'var(--color-brand-500)',
            },
            {
              label: 'Storage',
              used: currentWorkspace.storageUsedMb,
              limit: currentWorkspace.storageLimitMb,
              color: '#d4af37',
              fmt: (v: number) => `${(v / 1024).toFixed(1)} GB`,
            },
            {
              label: 'Seats',
              used: currentWorkspace.seats,
              limit: currentWorkspace.seatLimit,
              color: '#38bdf8',
            },
            {
              label: 'AI credits',
              used: 92,
              limit: 200,
              color: '#a78bfa',
            },
          ].map((u) => (
            <div key={u.label}>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="text-ink-400">{u.label}</span>
                <span className="tabular-nums text-ink-200">
                  {u.fmt ? u.fmt(u.used) : u.used} / {u.fmt ? u.fmt(u.limit) : u.limit}
                </span>
              </div>
              <Progress value={(u.used / u.limit) * 100} color={u.color} height={5} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Workspaces" subtitle={`${state.workspaces.length} workspace pada akun ini`} />
        <div className="divide-y divide-ink-800">
          {state.workspaces.map((w) => (
            <div key={w.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                style={{ background: 'linear-gradient(145deg, #b81e51, #681634)' }}
              >
                {w.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-ink-100">{w.name}</div>
                <div className="text-[10px] capitalize text-ink-500">
                  {w.plan} plan - {w.contentUsage} konten
                </div>
              </div>
              {w.id === currentWorkspace.id && (
                <Badge color="#22c55e" size="xs" dot>
                  Aktif
                </Badge>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-ink-800 p-3">
          <Button size="xs" variant="secondary">
            <Plus className="h-3 w-3" />
            Tambah workspace
          </Button>
        </div>
      </Card>
    </div>
  )
}

function BrandTab() {
  const { workspaceBrands, actions, toast } = useStore()
  const [activeId, setActiveId] = useState(workspaceBrands[0]?.id ?? '')
  const [newBrand, setNewBrand] = useState(false)
  const brand = workspaceBrands.find((b) => b.id === activeId)
  const [draft, setDraft] = useState<Brand | null>(brand ?? null)

  const value = draft && draft.id === activeId ? draft : brand

  const patch = (p: Partial<Brand>) => setDraft((d) => ({ ...(d ?? brand!), ...p }))
  const patchGuidelines = (p: Partial<Brand['guidelines']>) =>
    setDraft((d) => ({ ...(d ?? brand!), guidelines: { ...(d ?? brand!).guidelines, ...p } }))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-1.5">
        {workspaceBrands.map((b) => (
          <button
            key={b.id}
            onClick={() => {
              setActiveId(b.id)
              setDraft(null)
              setNewBrand(false)
            }}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors',
              activeId === b.id && !newBrand
                ? 'border-ink-600 bg-ink-750 text-ink-100'
                : 'border-ink-700 text-ink-400 hover:border-ink-600',
            )}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold text-white"
              style={{ background: b.color }}
            >
              {b.logoText}
            </span>
            {b.name}
          </button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setNewBrand(true)
            setDraft(null)
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Brand baru
        </Button>
      </div>

      {newBrand ? (
        <NewBrandForm
          onClose={() => setNewBrand(false)}
          onCreate={(b) => {
            void actions.createBrand(b).then((created) => {
              setActiveId(created.id)
              setNewBrand(false)
              toast('Brand dibuat')
            })
          }}
        />
      ) : value ? (
        <>
          <Card>
            <CardHeader title="Brand profile" subtitle="Digunakan AI untuk caption dan script" />
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Nama brand">
                <Input value={value.name} onChange={(e) => patch({ name: e.target.value })} />
              </Field>
              <Field label="Website">
                <Input value={value.website} onChange={(e) => patch({ website: e.target.value })} />
              </Field>
              <Field label="Deskripsi" className="sm:col-span-2">
                <Textarea
                  value={value.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  rows={2}
                />
              </Field>
              <Field label="Industry">
                <Input value={value.industry} onChange={(e) => patch({ industry: e.target.value })} />
              </Field>
              <Field label="Target audience">
                <Input value={value.audience} onChange={(e) => patch({ audience: e.target.value })} />
              </Field>
              <Field label="Brand color">
                <div className="flex gap-2">
                  <Input
                    value={value.color}
                    onChange={(e) => patch({ color: e.target.value })}
                    className="font-mono text-[12px]"
                  />
                  <span
                    className="h-9 w-12 shrink-0 rounded-lg border border-ink-700"
                    style={{ background: value.color }}
                  />
                </div>
              </Field>
              <Field label="Logo text" hint="2-3 huruf untuk identitas visual">
                <Input value={value.logoText} onChange={(e) => patch({ logoText: e.target.value })} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Brand guidelines" subtitle="Konteks yang dibaca AI Studio" />
            <div className="space-y-4 p-4">
              <Field label="Tone of voice">
                <Textarea
                  value={value.guidelines.tone}
                  onChange={(e) => patchGuidelines({ tone: e.target.value })}
                  rows={2}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Primary color">
                  <div className="flex gap-2">
                    <Input
                      value={value.guidelines.primaryColor}
                      onChange={(e) => patchGuidelines({ primaryColor: e.target.value })}
                      className="font-mono text-[12px]"
                    />
                    <span
                      className="h-9 w-10 shrink-0 rounded-lg border border-ink-700"
                      style={{ background: value.guidelines.primaryColor }}
                    />
                  </div>
                </Field>
                <Field label="Secondary color">
                  <div className="flex gap-2">
                    <Input
                      value={value.guidelines.secondaryColor}
                      onChange={(e) => patchGuidelines({ secondaryColor: e.target.value })}
                      className="font-mono text-[12px]"
                    />
                    <span
                      className="h-9 w-10 shrink-0 rounded-lg border border-ink-700"
                      style={{ background: value.guidelines.secondaryColor }}
                    />
                  </div>
                </Field>
                <Field label="Fonts">
                  <Input
                    value={value.guidelines.fonts}
                    onChange={(e) => patchGuidelines({ fonts: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Keywords" hint="Pisahkan dengan koma">
                <Input
                  value={value.guidelines.keywords.join(', ')}
                  onChange={(e) => patchGuidelines({ keywords: e.target.value.split(',').map((k) => k.trim()) })}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Do list" hint="Satu item per baris">
                  <Textarea
                    value={value.guidelines.doList.join('\n')}
                    onChange={(e) => patchGuidelines({ doList: e.target.value.split('\n') })}
                    rows={4}
                  />
                </Field>
                <Field label="Dont list" hint="Satu item per baris">
                  <Textarea
                    value={value.guidelines.dontList.join('\n')}
                    onChange={(e) => patchGuidelines({ dontList: e.target.value.split('\n') })}
                    rows={4}
                  />
                </Field>
              </div>
            </div>
            <div className="flex justify-end border-t border-ink-800 px-4 py-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  void actions.updateBrand(value.id, value)
                  toast('Brand guidelines disimpan')
                  setDraft(null)
                }}
              >
                <Check className="h-3.5 w-3.5" />
                Simpan brand
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Social accounts" subtitle="Akun yang dimiliki brand ini" />
            <div className="divide-y divide-ink-800">
              {value.socials.map((s) => {
                const meta = PLATFORMS.find((p) => p.id === s.platform)
                return (
                  <div key={s.platform} className="flex items-center gap-3 px-4 py-2.5">
                    {meta && <PlatformChip meta={meta} size="xs" showLabel={false} />}
                    <span className="min-w-0 flex-1 truncate text-[12px] text-ink-200">{s.handle}</span>
                    <Badge color="#34d399" size="xs" dot>
                      Connected
                    </Badge>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <p className="p-6 text-center text-[13px] text-ink-500">Pilih atau buat brand terlebih dahulu.</p>
        </Card>
      )}
    </div>
  )
}

function NewBrandForm({
  onClose,
  onCreate,
}: {
  onClose: () => void
  /** Only the writable fields: the API assigns id, workspaceId and createdAt. */
  onCreate: (b: Omit<Brand, 'id' | 'workspaceId' | 'createdAt'>) => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#b81e51')
  const [description, setDescription] = useState('')

  return (
    <Card>
      <CardHeader title="Brand baru" subtitle="Satu brand punya guidelines sendiri" />
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <Field label="Nama brand" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: GOOCANAN 3D" />
        </Field>
        <Field label="Warna brand">
          <Input value={color} onChange={(e) => setColor(e.target.value)} className="font-mono text-[12px]" />
        </Field>
        <Field label="Deskripsi" className="sm:col-span-2">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-ink-800 px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={!name.trim()}
          onClick={() =>
            onCreate({
              name: name.trim(),
              description,
              website: '',
              logoText: name.slice(0, 3).toUpperCase(),
              color,
              industry: '',
              audience: '',
              socials: [],
              guidelines: {
                tone: 'Professional + Friendly',
                primaryColor: color,
                secondaryColor: '#D4AF37',
                keywords: [],
                doList: [],
                dontList: [],
                fonts: 'Inter',
              },
            })
          }
        >
          Buat brand
        </Button>
      </div>
    </Card>
  )
}

function PlatformsTab() {
  const { toast } = useStore()

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Connected accounts"
          subtitle="Integrasi publishing dan sync analytics"
          icon={<Plug className="h-4 w-4" />}
        />
        <div className="divide-y divide-ink-800">
          {platformAccounts.map((a) => {
            const meta = PLATFORMS.find((p) => p.id === a.platform)
            return (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                {meta && <PlatformChip meta={meta} size="xs" showLabel={false} />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[12px] font-medium text-ink-100">{a.handle}</span>
                    <Badge color="#6b6b85" size="xs">
                      {a.accountType}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-ink-500">
                    {a.connected ? `${a.followers.toLocaleString('id-ID')} followers - ter-sync 5 menit lalu` : 'Belum terhubung'}
                  </div>
                </div>
                {a.connected ? (
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => toast(`${a.handle} diputus`, 'warn')}
                  >
                    Putuskan
                  </Button>
                ) : (
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() => toast(`Menghubungkan ${a.handle}...`, 'info')}
                  >
                    Hubungkan
                  </Button>
                )}
              </div>
            )
          })}
        </div>
        <div className="border-t border-ink-800 p-3">
          <Button size="xs" variant="secondary">
            <Plus className="h-3 w-3" />
            Hubungkan platform lain
          </Button>
        </div>
      </Card>

      <Card className="border-amber-700/30 bg-amber-950/10">
        <div className="p-4">
          <h3 className="text-[13px] font-semibold text-amber-200">Publishing API belum aktif</h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-400">
            Integrasi YouTube, Meta, TikTok, dan LinkedIn API masuk roadmap Phase 2 (V2). Sampai saat itu,
            GooOS menyediakan mode <span className="text-ink-200">Copy &amp; publish</span>: sistem
            menyiapkan caption, hashtag, dan jadwal agar bisa di-paste manual ke aplikasi platform.
          </p>
        </div>
      </Card>
    </div>
  )
}

function NotificationsTab() {
  const { state, actions, } = useStore()
  const [prefs, setPrefs] = useState({
    task: true,
    approval: true,
    schedule: true,
    publish: true,
    insight: false,
    email: true,
    whatsapp: false,
    telegram: false,
    inApp: true,
    digest: true,
  })

  const rows: { group: string; icon: typeof Bell; items: { key: keyof typeof prefs; label: string; desc: string }[] }[] = [
    {
      group: 'In-app',
      icon: Bell,
      items: [
        { key: 'inApp', label: 'Notifikasi in-app', desc: 'Tampil di lonceng notifikasi' },
        { key: 'task', label: 'Task & deadline', desc: 'Content #1024 deadline besok' },
        { key: 'approval', label: 'Approval', desc: 'Content perlu approval Anda' },
        { key: 'schedule', label: 'Schedule', desc: 'Pengingat sebelum publish' },
        { key: 'publish', label: 'Publishing', desc: 'Konten berhasil tayang' },
        { key: 'insight', label: 'Insight', desc: 'Rekomendasi dan anomali performa' },
      ],
    },
    {
      group: 'Channels',
      icon: Send,
      items: [
        { key: 'email', label: 'Email', desc: 'Kirim ke james@goocanan3d.com' },
        { key: 'whatsapp', label: 'WhatsApp', desc: 'Nomor +62 812 xxx (V2)' },
        { key: 'telegram', label: 'Telegram', desc: 'Bot GooOS (V2)' },
        { key: 'digest', label: 'Daily digest', desc: 'Ringkasan setiap pukul 08:00' },
      ],
    },
  ]

  return (
    <div className="space-y-5">
      {rows.map((r) => {
        const Icon = r.icon
        return (
          <Card key={r.group}>
            <CardHeader title={r.group} icon={<Icon className="h-4 w-4" />} />
            <div className="divide-y divide-ink-800">
              {r.items.map((i) => (
                <div key={i.key} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-ink-100">{i.label}</div>
                    <div className="text-[11px] text-ink-500">{i.desc}</div>
                  </div>
                  <Toggle
                    checked={prefs[i.key]}
                    onChange={(v) => setPrefs((p) => ({ ...p, [i.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </Card>
        )
      })}

      <Card>
        <CardHeader title="Notification center" subtitle={`${state.notifications.filter((n) => !n.read).length} belum dibaca`} />
        <div className="divide-y divide-ink-800">
          {state.notifications.map((n) => (
            <div key={n.id} className="flex items-start gap-3 px-4 py-3">
              <span
                className={cn(
                  'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                  n.read ? 'bg-ink-700' : 'bg-brand-500',
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-ink-100">{n.title}</div>
                <div className="text-[11px] text-ink-500">{n.body}</div>
              </div>
              <span className="shrink-0 text-[10px] text-ink-600">{fmtDate(n.at)}</span>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => void actions.readNotification(n.id, !n.read)}
              >
                {n.read ? 'Unread' : 'Read'}
              </Button>
            </div>
          ))}
        </div>
        <div className="border-t border-ink-800 p-3">
          <Button
            size="xs"
            variant="secondary"
            onClick={() => void actions.readAllNotifications()}
          >
            <Check className="h-3 w-3" />
            Tandai semua sudah dibaca
          </Button>
        </div>
      </Card>
    </div>
  )
}

function BillingTab() {
  const { currentWorkspace, toast } = useStore()

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Current plan" subtitle={currentWorkspace.name} icon={<CreditCard className="h-4 w-4" />} />
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold capitalize text-ink-100">{currentWorkspace.plan}</span>
              <Badge color="#d4af37" size="sm" dot>
                Active
              </Badge>
            </div>
            <p className="mt-1 text-[12px] text-ink-500">
              Billing berikutnya pada {fmtDate(new Date(Date.now() + 20 * 86400000).toISOString())}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-ink-100">Rp199K</div>
            <div className="text-[11px] text-ink-500">per bulan</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {billingPlans.map((p) => (
          <Card
            key={p.id}
            className={cn('relative p-4', p.current && 'border-brand-600/50 bg-brand-950/15')}
          >
            {p.current && (
              <span className="absolute right-3 top-3">
                <Badge color="#d4af37" size="xs">
                  Current
                </Badge>
              </span>
            )}
            <h3 className="text-[14px] font-semibold text-ink-100">{p.name}</h3>
            <div className="mt-1.5">
              <span className="text-xl font-bold text-ink-100">{p.price}</span>
              <span className="text-[11px] text-ink-500"> {p.period}</span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-[11px] text-ink-400">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              variant={p.current ? 'secondary' : 'outline'}
              className="mt-4 w-full"
              disabled={p.current}
              onClick={() => toast(`Upgrade ke ${p.name} dipilih`, 'info')}
            >
              {p.current ? 'Plan aktif' : `Pilih ${p.name}`}
            </Button>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Payment history" subtitle="Invoice 12 bulan terakhir" />
        <div className="divide-y divide-ink-800">
          {[3, 2, 1, 0].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-800 text-ink-400">
                <CreditCard className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-ink-100">Invoice #{2026 - i}-CF</div>
                <div className="text-[10px] text-ink-500">{fmtDate(new Date(Date.now() - i * 30 * 86400000).toISOString())}</div>
              </div>
              <span className="text-[12px] tabular-nums text-ink-200">Rp199.000</span>
              <Badge color="#22c55e" size="xs">
                Paid
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function ApiTab() {
  const { toast } = useStore()
  const keys = [
    { name: 'Production', prefix: 'cf_live_', created: fmtDate(new Date(Date.now() - 40 * 86400000).toISOString()), lastUsed: '2 jam lalu' },
    { name: 'Development', prefix: 'cf_test_', created: fmtDate(new Date(Date.now() - 12 * 86400000).toISOString()), lastUsed: 'hari ini' },
  ]

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="API keys" subtitle="Untuk integrasi custom dan automation" icon={<KeyRound className="h-4 w-4" />} />
        <div className="divide-y divide-ink-800">
          {keys.map((k) => (
            <div key={k.name} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-ink-100">{k.name}</div>
                <div className="font-mono text-[10px] text-ink-500">
                  {k.prefix}****************{k.name.slice(0, 4).toLowerCase()}
                </div>
                <div className="text-[10px] text-ink-600">
                  Dibuat {k.created} - terakhir dipakai {k.lastUsed}
                </div>
              </div>
              <CopyButton value={`${k.prefix}demo-key-for-prototype`} size="xs" variant="ghost" />
              <Button size="xs" variant="danger" onClick={() => toast(`Key ${k.name} dicabut`, 'warn')}>
                <Trash2 className="h-3 w-3" />
                Cabut
              </Button>
            </div>
          ))}
        </div>
        <div className="border-t border-ink-800 p-3">
          <Button size="xs" variant="secondary" onClick={() => toast('Key baru dibuat', 'info')}>
            <Plus className="h-3 w-3" />
            Buat API key
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Webhooks" subtitle="Kirim event ke endpoint Anda" icon={<Webhook className="h-4 w-4" />} />
        <div className="grid gap-4 p-4">
          <Field label="Endpoint URL">
            <Input placeholder="https://your-app.com/api/webhooks/gooos" className="font-mono text-[12px]" />
          </Field>
          <div>
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-ink-400">
              Events
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'content.created',
                'content.published',
                'content.approved',
                'comment.created',
                'schedule.due',
              ].map((e) => (
                <span
                  key={e}
                  className="rounded-md border border-ink-700 bg-ink-850 px-2 py-1 font-mono text-[10px] text-ink-300"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end border-t border-ink-800 px-4 py-3">
          <Button variant="primary" size="sm" onClick={() => toast('Webhook diuji, respons 200 OK')}>
            <Send className="h-3.5 w-3.5" />
            Simpan dan test
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Rate limits" subtitle="Plan Pro" />
        <div className="grid grid-cols-2 gap-px bg-ink-800 sm:grid-cols-4">
          {[
            { label: 'Requests', value: '1.000 / min' },
            { label: 'Storage', value: '50 GB' },
            { label: 'AI credits', value: '200 / bulan' },
            { label: 'Seats', value: '10' },
          ].map((s) => (
            <div key={s.label} className="bg-ink-900 px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-ink-500">{s.label}</div>
              <div className="mt-1 text-[13px] font-semibold text-ink-100">{s.value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function SecurityTab() {
  const { toast } = useStore()
  const [sso, setSso] = useState(false)
  const [twoFa, setTwoFa] = useState(true)

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Authentication" subtitle="Metode login workspace" icon={<Shield className="h-4 w-4" />} />
        <div className="divide-y divide-ink-800">
          {[
            { label: 'Email dan password', desc: 'Aktif - reset password via email', on: true, locked: true },
            { label: 'Google OAuth', desc: 'Aktif untuk seluruh anggota tim', on: true, locked: false },
            { label: 'Magic link', desc: 'Login tanpa password', on: false, locked: false },
            { label: 'SAML SSO', desc: 'Untuk tim besar atau enterprise', on: sso, locked: false, setter: setSso },
            { label: 'Two-factor authentication', desc: 'Wajib untuk role Owner dan Admin', on: twoFa, locked: false, setter: setTwoFa },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-ink-100">{r.label}</div>
                <div className="text-[11px] text-ink-500">{r.desc}</div>
              </div>
              {r.setter ? (
                <Toggle checked={r.on} onChange={r.setter} />
              ) : (
                <Badge color={r.on ? '#22c55e' : '#64748b'} size="xs" dot>
                  {r.on ? 'Active' : 'Off'}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Active sessions" subtitle="Perangkat yang sedang login" />
        <div className="divide-y divide-ink-800">
          {[
            { device: 'Chrome - Windows 11', location: 'Jakarta, ID', ip: '103.28.14.xx', current: true },
            { device: 'Safari - iPhone 15', location: 'Jakarta, ID', ip: '103.28.14.yy', current: false },
            { device: 'Chrome - macOS', location: 'Surabaya, ID', ip: '182.61.xx.xx', current: false },
          ].map((s) => (
            <div key={s.device} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-ink-400">
                <Shield className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-ink-100">{s.device}</span>
                  {s.current && (
                    <Badge color="#22c55e" size="xs">
                      This device
                    </Badge>
                  )}
                </div>
                <div className="text-[10px] text-ink-500">
                  {s.location} - IP {s.ip}
                </div>
              </div>
              {!s.current && (
                <Button size="xs" variant="ghost" onClick={() => toast('Sesi dicabut', 'warn')}>
                  Cabut
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Audit log" subtitle="Semua perubahan penting tercatat" />
        <div className="divide-y divide-ink-800">
          {[
            ['James mengubah brand guidelines', '2 jam lalu'],
            ['Krisda menbyter role Raka menjadi creator', '1 hari lalu'],
            ['Login baru dari perangkat baru', '2 hari lalu'],
            ['API key Development dibuat', '12 hari lalu'],
          ].map(([a, b]) => (
            <div key={a} className="flex items-center gap-3 px-4 py-2.5">
              <Copy className="h-3.5 w-3.5 shrink-0 text-ink-600" />
              <span className="min-w-0 flex-1 truncate text-[12px] text-ink-200">{a}</span>
              <span className="shrink-0 text-[10px] text-ink-600">{b}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-brand-800/40 bg-brand-950/15">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <Mail className="h-4 w-4 text-brand-300" />
          <p className="min-w-0 flex-1 text-[12px] text-ink-300">
            Semua credential/API key dienkripsi at rest. Akses backend dibatasi dengan signed URL.
          </p>
          <Badge color="#d4af37" size="sm">
            Encryption on
          </Badge>
        </div>
      </Card>

      <Divider />

      <Card>
        <CardHeader title="Danger zone" subtitle="Tindakan yang tidak dapat dibatalkan" />
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium text-ink-100">Hapus workspace</div>
            <div className="text-[11px] text-ink-500">
              Menghapus seluruh konten, asset, dan analytics workspace ini secara permanen.
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={() => toast('Workspace deletion membutuhkan konfirmasi Owner', 'warn')}>
            <Trash2 className="h-3.5 w-3.5" />
            Hapus workspace
          </Button>
        </div>
      </Card>
    </div>
  )
}

