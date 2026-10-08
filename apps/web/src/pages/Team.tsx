import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users as UsersIcon,
  Plus,
  Mail,
  Shield,
  MoreVertical,
  Check,
  X,
  Clock,
  BarChart3,
  Crown,
  KeyRound,
  UserPlus,
} from 'lucide-react'
import { useStore, reportErrorHelper } from '@/lib/store'
import { PageBody, PageHeader, FilterChip } from '@/components/page'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Dropdown,
  EmptyState,
  Field,
  Input,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  Modal,
  Progress,
  Select,
  AvatarStack,
} from '@/components/ui'
import { RankedBar } from '@/components/charts'
import { ROLE_LABEL, type Member, type Role } from '@/lib/types'
import { cn, compact, fmtDate, hashColor } from '@/lib/utils'

const ROLE_COLOR: Record<Role, string> = {
  owner: '#d4af37',
  admin: '#a78bfa',
  manager: '#38bdf8',
  creator: '#34d399',
  reviewer: '#f59e0b',
  client: '#fb923c',
}

const ROLE_DESC: Record<Role, string> = {
  owner: 'Akses penuh ke semua workspace dan billing.',
  admin: 'Kelola user, workspace, brand, dan settings.',
  manager: 'Kelola konten, kalender, approval, analytics, dan tim.',
  creator: 'Kerjakan konten yang diberikan: draft, script, asset.',
  reviewer: 'Lihat konten, beri komentar, approve atau reject.',
  client: 'Lihat konten tertentu, komentar, approve atau reject.',
}

const ROLE_PERMS: Record<Role, string[]> = {
  owner: ['*'],
  admin: ['content', 'calendar', 'analytics', 'team', 'settings', 'brand'],
  manager: ['content', 'calendar', 'analytics', 'team', 'approval'],
  creator: ['content:assigned', 'script', 'asset'],
  reviewer: ['content:review', 'comment', 'approve'],
  client: ['content:shared', 'comment', 'approve'],
}

export default function Team() {
  const { state, workspaceContents, actions, toast } = useStore()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  const [viewAs, setViewAs] = useState<Member | null>(null)

  const members = state.members.filter((u) => roleFilter === 'all' || u.role === roleFilter)

  const workload = useMemo(() => {
    return state.members
      .map((u) => {
        const items = workspaceContents.filter((c) => c.creatorId === u.id)
        const overdue = items.filter((c) => c.deadline && c.deadline < new Date().toISOString() && c.status !== 'published')
        const published = items.filter((c) => c.status === 'published')
        const views = state.analytics
          .filter((a) => items.some((c) => c.id === a.contentId))
          .reduce((acc, a) => acc + a.views, 0)
        return {
          user: u,
          total: items.length,
          active: items.filter((c) => !['published', 'archived'].includes(c.status)).length,
          overdue: overdue.length,
          published: published.length,
          views,
        }
      })
      .filter((w) => w.total > 0)
      .sort((a, b) => b.active - a.active)
  }, [state.members, workspaceContents, state.analytics])

  const capacity = state.workspaces.find((w) => w.id === state.currentWorkspaceId)?.seats ?? 5

  return (
    <>
      <PageHeader
        title="Team"
        description={`${state.members.length} anggota - ${capacity} slot terpakai`}
        actions={
          <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" />
            Invite member
          </Button>
        }
      />

      <PageBody className="space-y-5">
        {/* Role filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip active={roleFilter === 'all'} onClick={() => setRoleFilter('all')} count={state.members.length}>
            Semua
          </FilterChip>
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
            <FilterChip
              key={r}
              active={roleFilter === r}
              color={ROLE_COLOR[r]}
              onClick={() => setRoleFilter(r)}
              count={state.members.filter((u) => u.role === r).length}
            >
              {ROLE_LABEL[r]}
            </FilterChip>
          ))}
        </div>

        {/* Member grid */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((u) => {
            const load = workload.find((w) => w.user.id === u.id)
            return (
              <Card key={u.id} className="group p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={u.name} color={u.avatarColor} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-semibold text-ink-100">{u.name}</span>
                      {!u.active && (
                        <Badge color="#64748b" size="xs">
                          Nonaktif
                        </Badge>
                      )}
                    </div>
                    <div className="truncate text-[11px] text-ink-500">{u.title}</div>
                    <Badge color={ROLE_COLOR[u.role]} size="xs" className="mt-1.5">
                      {ROLE_LABEL[u.role]}
                    </Badge>
                  </div>
                  <Dropdown
                    width={190}
                    trigger={({ toggle }) => (
                      <button
                        onClick={toggle}
                        aria-label="Menu"
                        className="shrink-0 rounded p-1 text-ink-500 transition-colors hover:bg-ink-800 hover:text-ink-200"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    )}
                  >
                    {(close) => (
                      <>
                        <MenuLabel>{u.email}</MenuLabel>
                        <MenuItem icon={<Mail className="h-3.5 w-3.5" />} onClick={close}>
                          Kirim email
                        </MenuItem>
                        <MenuItem
                          icon={<KeyRound className="h-3.5 w-3.5" />}
                          onClick={() => {
                            setViewAs(u)
                            close()
                          }}
                        >
                          Lihat detail
                        </MenuItem>
                        <MenuSeparator />
                        <MenuLabel>Ganti role</MenuLabel>
                        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                          <MenuItem
                            key={r}
                            icon={
                              u.role === r ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <span className="h-2 w-2 rounded-full" style={{ background: ROLE_COLOR[r] }} />
                              )
                            }
                            onClick={() => {
                              void actions.updateMember(u.id, { role: r })
                              toast(`${u.name} sekarang ${ROLE_LABEL[r]}`)
                              close()
                            }}
                          >
                            {ROLE_LABEL[r]}
                          </MenuItem>
                        ))}
                        <MenuSeparator />
                        <MenuItem
                          icon={u.active ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                          onClick={() => {
                            void actions.updateMember(u.id, { active: !u.active })
                            toast(u.active ? 'Member dinonaktifkan' : 'Member diaktifkan', 'info')
                            close()
                          }}
                        >
                          {u.active ? 'Nonaktifkan' : 'Aktifkan'}
                        </MenuItem>
                      </>
                    )}
                  </Dropdown>
                </div>

                {load ? (
                  <div className="mt-3 border-t border-ink-800 pt-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Assigned', value: load.total, tone: 'text-ink-100' },
                        { label: 'Active', value: load.active, tone: 'text-brand-300' },
                        { label: 'Published', value: load.published, tone: 'text-emerald-300' },
                      ].map((s) => (
                        <div key={s.label}>
                          <div className={cn('text-base font-bold tabular-nums', s.tone)}>{s.value}</div>
                          <div className="text-[9px] uppercase tracking-wider text-ink-500">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {load.overdue > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400">
                        <Clock className="h-3 w-3" />
                        {load.overdue} konten melewati deadline
                      </div>
                    )}
                    {load.views > 0 && (
                      <div className="mt-2 flex items-center justify-between text-[10px] text-ink-500">
                        <span className="inline-flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          Total views kontennya
                        </span>
                        <span className="tabular-nums text-ink-300">{compact(load.views)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 border-t border-ink-800 pt-3 text-[11px] text-ink-600">
                    Belum ada konten yang ditugaskan.
                  </p>
                )}
              </Card>
            )
          })}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Workload */}
          <Card>
            <CardHeader
              title="Workload"
              subtitle="Konten aktif per anggota tim"
              icon={<UsersIcon className="h-4 w-4" />}
            />
            <div className="p-4">
              <RankedBar
                items={workload.map((w) => ({
                  label: w.user.name,
                  value: w.active,
                  color: w.user.avatarColor,
                  meta: `${w.total} total - ${w.overdue} overdue - ${compact(w.views)} views`,
                }))}
                format={(v) => `${v} aktif`}
              />
            </div>
          </Card>

          {/* Roles matrix */}
          <Card>
            <CardHeader title="Roles & permissions" subtitle="RBAC workspace" icon={<Shield className="h-4 w-4" />} />
            <div className="divide-y divide-ink-800">
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <div key={r} className="flex items-start gap-3 px-4 py-2.5">
                  <Badge color={ROLE_COLOR[r]} size="sm" className="mt-0.5 w-20 justify-center">
                    {ROLE_LABEL[r]}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] leading-relaxed text-ink-300">{ROLE_DESC[r]}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {ROLE_PERMS[r].map((p) => (
                        <span
                          key={p}
                          className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[9px] text-ink-400"
                        >
                          {p === '*' ? 'all' : p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] tabular-nums text-ink-500">
                    {state.members.filter((u) => u.role === r).length}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Seats */}
        <Card>
          <CardHeader title="Workspace seats" subtitle="Pemakaian kursi" icon={<Crown className="h-4 w-4 text-gold-400" />} />
          <div className="p-4">
            <div className="flex items-center gap-3">
              <AvatarStack
                names={state.members.map((u) => ({ name: u.name, color: hashColor(u.id, 52, 45) }))}
                max={6}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-ink-400">Seats used</span>
                  <span className="tabular-nums text-ink-200">
                    {state.members.filter((u) => u.active).length} /{' '}
                    {state.workspaces.find((w) => w.id === state.currentWorkspaceId)?.seatLimit}
                  </span>
                </div>
                <Progress
                  value={
                    (state.members.filter((u) => u.active).length /
                      (state.workspaces.find((w) => w.id === state.currentWorkspaceId)?.seatLimit ?? 1)) *
                    100
                  }
                  height={5}
                  color="#d4af37"
                  className="mt-1.5"
                />
              </div>
              <Button size="sm" variant="secondary" onClick={() => setInviteOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Tambah
              </Button>
            </div>
          </div>
        </Card>
      </PageBody>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <MemberModal user={viewAs} onClose={() => setViewAs(null)} />
    </>
  )
}

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { actions, toast } = useStore()
  const report = reportErrorHelper(toast)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('creator')

  const submit = async () => {
    if (!email.trim() || !name.trim()) return
    try {
      await actions.inviteMember({ email: email.trim(), role, name: name.trim() })
      toast(`${name.trim()} ditambahkan ke workspace`)
      setEmail('')
      setName('')
      onClose()
    } catch (err) {
      report(err, 'Gagal menambahkan member')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Invite team member"
      subtitle="Akses diberikan sesuai role."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" onClick={submit} disabled={!email.trim() || !name.trim()}>
            <Mail className="h-3.5 w-3.5" />
            Kirim undangan
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Nama">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
          />
        </Field>
        <Field label="Role" hint={ROLE_DESC[role]}>
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  )
}

function MemberModal({ user, onClose }: { user: Member | null; onClose: () => void }) {
  const { workspaceContents, state } = useStore()
  if (!user) return null
  const items = workspaceContents.filter((c) => c.creatorId === user.id)
  const reviewerOf = workspaceContents.filter((c) => c.reviewerId === user.id)

  return (
    <Modal open={Boolean(user)} onClose={onClose} size="md" title={user.name} subtitle={`${user.title} - ${user.email}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} color={user.avatarColor} size="xl" />
          <div>
            <Badge color={ROLE_COLOR[user.role]}>{ROLE_LABEL[user.role]}</Badge>
            <p className="mt-1.5 text-[11px] text-ink-400">{ROLE_DESC[user.role]}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-ink-700 bg-ink-700">
          {[
            { label: 'Created', value: items.length },
            { label: 'Reviewing', value: reviewerOf.length },
            { label: 'Comments', value: state.comments.filter((c) => c.authorId === user.id).length },
          ].map((s) => (
            <div key={s.label} className="bg-ink-900 px-3 py-2.5 text-center">
              <div className="text-base font-bold tabular-nums text-ink-100">{s.value}</div>
              <div className="text-[9px] uppercase tracking-wider text-ink-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div>
          <h4 className="mb-2 text-[12px] font-semibold text-ink-200">Konten terbaru</h4>
          {items.length === 0 ? (
            <EmptyState title="Belum ada konten" />
          ) : (
            <div className="space-y-1">
              {items.slice(0, 6).map((c) => (
                <Link
                  key={c.id}
                  to={`/content/${c.id}`}
                  className="flex items-center gap-2 rounded-lg border border-ink-800 bg-ink-850/60 px-2.5 py-2 transition-colors hover:border-ink-600"
                >
                  <span className="h-6 w-1 shrink-0 rounded-full" style={{ background: c.thumbnailColor }} />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-ink-200">{c.title}</span>
                  <span className="shrink-0 text-[10px] text-ink-600">{fmtDate(c.updatedAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

