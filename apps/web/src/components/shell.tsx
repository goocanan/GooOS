import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Lightbulb,
  Megaphone,
  Images,
  FileText,
  BarChart3,
  Sparkles,
  Users,
  Settings,
  Search,
  Bell,
  Plus,
  ChevronDown,
  Check,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  AlertCircle,
  CalendarClock,
  Rocket,
  Wand2,
  RotateCcw,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn, relTime } from '@/lib/utils'
import { Avatar, Badge, Button, Dropdown, IconButton, Kbd, MenuItem, MenuLabel, MenuSeparator, Modal, Input, Progress } from './ui'

// ---------------------------------------------------------------------------
// Navigation config (PRD §45)
// ---------------------------------------------------------------------------

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  {
    to: '/content',
    label: 'Content',
    icon: FolderKanban,
    children: [
      { to: '/content', label: 'All Content', end: true },
      { to: '/board', label: 'Board' },
      { to: '/calendar', label: 'Calendar' },
      { to: '/content?view=archived', label: 'Archived' },
    ],
  },
  { to: '/ideas', label: 'Ideas', icon: Lightbulb, badge: 'ideas' as const },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/assets', label: 'Assets', icon: Images },
  { to: '/scripts', label: 'Scripts', icon: FileText },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/ai', label: 'AI Studio', icon: Sparkles },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/reports', label: 'Reports', icon: FileText },
]

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export function Sidebar({
  collapsed,
  onToggle,
  onCreate,
}: {
  collapsed: boolean
  onToggle: () => void
  onCreate: () => void
}) {
  const { state, currentWorkspace, workspaceContents, currentUser, dispatch, toast } = useStore()
  const location = useLocation()
  const [expanded, setExpanded] = useState<string[]>(['/content'])

  useEffect(() => {
    for (const n of NAV) {
      if (n.children && location.pathname.startsWith(n.to)) {
        setExpanded((prev) => (prev.includes(n.to) ? prev : [...prev, n.to]))
      }
    }
  }, [location.pathname])

  const reviewCount = workspaceContents.filter((c) => c.status === 'review').length

  return (
    <aside
      className={cn(
        'z-30 flex h-full shrink-0 flex-col border-r border-ink-800 bg-ink-900/80 backdrop-blur-xl transition-[width] duration-200',
        collapsed ? 'w-[60px]' : 'w-[228px]',
      )}
    >
      {/* Brand */}
      <div className={cn('flex h-14 items-center gap-2.5 border-b border-ink-800 px-3', collapsed && 'justify-center px-0')}>
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-800 shadow-lg shadow-brand-900/40">
          <span className="text-[13px] font-extrabold tracking-tight text-white">CF</span>
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold tracking-tight text-ink-100">GooOS</div>
            <div className="truncate text-[10px] text-ink-500">Content OS</div>
          </div>
        )}
      </div>

      {/* Workspace switcher */}
      {!collapsed && (
        <div className="px-2.5 pt-3">
          <WorkspaceSwitcher />
        </div>
      )}

      {/* Create button */}
      <div className={cn('px-2.5 pt-3', collapsed && 'px-2')}>
        <Button
          variant="primary"
          size={collapsed ? 'icon' : 'md'}
          onClick={onCreate}
          className={cn(collapsed ? 'w-full' : 'w-full')}
          title="Buat konten baru"
        >
          <Plus className="h-4 w-4" />
          {!collapsed && 'New Content'}
        </Button>
      </div>

      {/* Nav */}
      <nav className="no-scrollbar mt-3 flex-1 overflow-y-auto px-2 pb-4">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon
            const badge =
              item.badge === 'ideas'
                ? state.ideas.filter((i) => !i.convertedContentId).length
                : item.to === '/content'
                  ? reviewCount
                  : 0

            if (item.children) {
              const isOpen = expanded.includes(item.to)
              const active = location.pathname.startsWith(item.to)
              return (
                <li key={item.to}>
                  <div
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors',
                      active ? 'bg-ink-800 text-ink-100' : 'text-ink-400 hover:bg-ink-850 hover:text-ink-200',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((p) => (p.includes(item.to) ? p.filter((x) => x !== item.to) : [...p, item.to]))
                      }
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate font-medium">{item.label}</span>}
                    </button>
                    {!collapsed && (
                      <>
                        {badge > 0 && <Badge color="#f59e0b" size="xs">{badge}</Badge>}
                        <ChevronDown
                          className={cn('h-3.5 w-3.5 shrink-0 text-ink-500 transition-transform', isOpen && 'rotate-180')}
                        />
                      </>
                    )}
                  </div>
                  {!collapsed && isOpen && (
                    <ul className="ml-[22px] mt-0.5 space-y-0.5 border-l border-ink-800 pl-2">
                      {item.children.map((c) => (
                        <li key={c.to}>
                          <NavLink
                            to={c.to}
                            end={c.end}
                            className={({ isActive }) =>
                              cn(
                                'block rounded-md px-2.5 py-1.5 text-[12px] transition-colors',
                                isActive && !c.to.includes('?')
                                  ? 'bg-brand-600/15 font-medium text-brand-200'
                                  : 'text-ink-400 hover:bg-ink-850 hover:text-ink-200',
                              )
                            }
                          >
                            {c.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            }

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors',
                      isActive
                        ? 'bg-ink-800 font-medium text-ink-100'
                        : 'text-ink-400 hover:bg-ink-850 hover:text-ink-200',
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && badge > 0 && (
                    <span className="ml-auto rounded bg-ink-750 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-ink-300">
                      {badge}
                    </span>
                  )}
                  {collapsed && badge > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>

        {/* Secondary links */}
        <ul className="mt-4 space-y-0.5 border-t border-ink-800 pt-3">
          <li>
            <NavLink
              to="/settings"
              title={collapsed ? 'Settings' : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors',
                  isActive ? 'bg-ink-800 font-medium text-ink-100' : 'text-ink-400 hover:bg-ink-850 hover:text-ink-200',
                )
              }
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Settings</span>}
            </NavLink>
          </li>
        </ul>

        {/* Usage meter */}
        {!collapsed && (
          <div className="mx-2.5 mt-4 rounded-lg border border-ink-800 bg-ink-850/60 p-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-500">
              <span>{currentWorkspace.plan} plan</span>
              <span className="tabular-nums">
                {currentWorkspace.contentUsage}/{currentWorkspace.contentLimit}
              </span>
            </div>
            <Progress
              value={(currentWorkspace.contentUsage / currentWorkspace.contentLimit) * 100}
              height={4}
              className="mt-2"
            />
            <div className="mt-2 flex items-center justify-between text-[10px] text-ink-500">
              <span>Storage</span>
              <span className="tabular-nums">
                {(currentWorkspace.storageUsedMb / 1024).toFixed(1)}/
                {(currentWorkspace.storageLimitMb / 1024).toFixed(0)} GB
              </span>
            </div>
            <Progress
              value={(currentWorkspace.storageUsedMb / currentWorkspace.storageLimitMb) * 100}
              height={4}
              className="mt-1.5"
              color="#d4af37"
            />
            <Button
              size="xs"
              variant="subtle"
              className="mt-2.5 w-full"
              onClick={() => {
                dispatch({ type: 'reset' })
                toast('Data demo direset ke kondisi awal', 'info')
              }}
            >
              <RotateCcw className="h-3 w-3" />
              Reset data demo
            </Button>
          </div>
        )}
      </nav>

      {/* Collapse + user */}
      <div className={cn('flex items-center gap-1 border-t border-ink-800 p-2', collapsed && 'flex-col')}>
        <IconButton label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'} onClick={onToggle}>
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </IconButton>
        {!collapsed && <UserMenu />}
        {collapsed && (
          <div className="mt-1">
            <UserMenu collapsed />
          </div>
        )}
      </div>
      <span className="sr-only">Signed in as {currentUser.name}</span>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Workspace switcher (PRD §6)
// ---------------------------------------------------------------------------

function WorkspaceSwitcher() {
  const { state, currentWorkspace, switchWorkspace, toast } = useStore()
  const navigate = useNavigate()
  return (
    <Dropdown
      width={264}
      align="start"
      trigger={({ toggle, open }) => (
        <button
          onClick={toggle}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-lg border border-ink-700 bg-ink-850 px-2.5 py-2 text-left transition-colors hover:border-ink-600',
            open && 'border-ink-600',
          )}
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
            style={{ background: `linear-gradient(145deg, #b81e51, #681634)` }}
          >
            {currentWorkspace.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold text-ink-100">
              {currentWorkspace.name}
            </span>
            <span className="block truncate text-[10px] text-ink-500">
              {state.contents.filter((c) => c.workspaceId === currentWorkspace.id).length} konten
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-500" />
        </button>
      )}
    >
      {(close) => (
        <>
          <MenuLabel>Workspaces</MenuLabel>
          {state.workspaces.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                close()
                if (w.id === currentWorkspace.id) return
                void switchWorkspace(w.id)
                toast(`Switch ke ${w.name}`, 'info')
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-ink-750"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white"
                style={{ background: `linear-gradient(145deg, #b81e51, #681634)` }}
              >
                {w.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] text-ink-100">{w.name}</span>
                <span className="block text-[10px] capitalize text-ink-500">{w.plan} plan</span>
              </span>
              {w.id === currentWorkspace.id && <Check className="h-3.5 w-3.5 text-brand-400" />}
            </button>
          ))}
          <MenuSeparator />
          <MenuItem
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => {
              close()
              navigate('/settings?tab=workspace')
            }}
          >
            Tambah workspace
          </MenuItem>
        </>
      )}
    </Dropdown>
  )
}

// ---------------------------------------------------------------------------
// Account menu
//
// The prototype let you swap the signed-in identity to preview RBAC. With real
// Better Auth sessions that would be impersonation, so the menu now shows the
// actual account and points to Team for role management instead.
// ---------------------------------------------------------------------------

function UserMenu({ collapsed }: { collapsed?: boolean }) {
  const { currentUser, signOut } = useStore()
  const navigate = useNavigate()
  const role = currentUser.role ?? 'creator'

  const header = (
    <div className="px-2.5 py-2">
      <div className="text-[13px] font-semibold text-ink-100">{currentUser.name}</div>
      <div className="text-[11px] text-ink-500">{currentUser.email}</div>
      <Badge color="#d4af37" size="xs" className="mt-1.5 capitalize">
        {role}
      </Badge>
    </div>
  )

  const items = (close: () => void) => (
    <>
      <MenuItem
        icon={<Settings className="h-3.5 w-3.5" />}
        onClick={() => {
          navigate('/settings')
          close()
        }}
      >
        Pengaturan
      </MenuItem>
      <MenuItem
        icon={<LogOut className="h-3.5 w-3.5" />}
        onClick={() => {
          close()
          void signOut()
        }}
      >
        Keluar
      </MenuItem>
    </>
  )

  if (collapsed) {
    return (
      <Dropdown
        width={230}
        trigger={({ toggle }) => (
          <button onClick={toggle} className="relative rounded-full">
            <Avatar name={currentUser.name} color={currentUser.avatarColor} size="md" />
          </button>
        )}
      >
        {(close) => (
          <>
            {header}
            <MenuSeparator />
            {items(close)}
          </>
        )}
      </Dropdown>
    )
  }

  return (
    <Dropdown
      width={244}
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-ink-850"
        >
          <Avatar name={currentUser.name} color={currentUser.avatarColor} size="md" />
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[12px] font-medium text-ink-100">{currentUser.name}</span>
            <span className="block truncate text-[10px] capitalize text-ink-500">{role}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-500" />
        </button>
      )}
    >
      {(close) => (
        <>
          {header}
          <MenuSeparator />
          {items(close)}
        </>
      )}
    </Dropdown>
  )
}

// ---------------------------------------------------------------------------
// Topbar
// ---------------------------------------------------------------------------

export function Topbar({ onOpenSearch, onOpenCreate }: { onOpenSearch: () => void; onOpenCreate: () => void }) {
  const { state, actions } = useStore()
  const unread = state.notifications.filter((n) => !n.read).length
  const navigate = useNavigate()
  const location = useLocation()

  const title = useMemo(() => {
    const path = location.pathname
    if (path === '/') return 'Dashboard'
    if (path.startsWith('/board')) return 'Content Board'
    if (path.startsWith('/calendar')) return 'Content Calendar'
    if (path.startsWith('/content/')) return 'Content Detail'
    if (path.startsWith('/content')) return 'All Content'
    const map: Record<string, string> = {
      '/ideas': 'Ideas',
      '/campaigns': 'Campaigns',
      '/assets': 'Asset Library',
      '/scripts': 'Scripts',
      '/analytics': 'Analytics',
      '/ai': 'AI Studio',
      '/team': 'Team',
      '/reports': 'Reports',
      '/settings': 'Settings',
    }
    return map[path] ?? 'GooOS'
  }, [location.pathname])

  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b border-ink-800 bg-ink-950/80 px-4 backdrop-blur-xl">
      <h1 className="truncate text-[14px] font-semibold tracking-tight text-ink-100 lg:hidden">{title}</h1>

      <button
        onClick={onOpenSearch}
        className="group hidden h-8 max-w-md flex-1 items-center gap-2 rounded-lg border border-ink-800 bg-ink-900 px-3 text-left transition-colors hover:border-ink-700 md:flex"
      >
        <Search className="h-3.5 w-3.5 text-ink-500 group-hover:text-ink-400" />
        <span className="flex-1 text-[12px] text-ink-500">Search konten, asset, campaign...</span>
        <span className="hidden items-center gap-1 lg:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Button size="sm" variant="primary" onClick={onOpenCreate} className="lg:hidden">
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>

        <IconButton label="Notifikasi" onClick={() => navigate('/settings?tab=notifications')}>
          <span className="relative">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand-500 px-0.5 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </span>
        </IconButton>

        <NotificationBell
          count={unread}
          onRead={(id) => void actions.readNotification(id)}
          onReadAll={() => void actions.readAllNotifications()}
        />
      </div>
    </header>
  )
}

function NotificationBell({
  count,
  onRead,
  onReadAll,
}: {
  count: number
  onRead: (id: string) => void
  onReadAll: () => void
}) {
  const { state } = useStore()
  const navigate = useNavigate()

  const iconFor = {
    task: AlertCircle,
    approval: Check,
    schedule: CalendarClock,
    publish: Rocket,
    insight: Wand2,
  }

  const colorFor = {
    task: '#f59e0b',
    approval: '#38bdf8',
    schedule: '#2dd4bf',
    publish: '#22c55e',
    insight: '#d4af37',
  }

  return (
    <Dropdown
      width={352}
      trigger={({ toggle, open }) => (
        <button
          onClick={toggle}
          aria-label="Notifikasi"
          className={cn(
            'hidden h-8 items-center gap-2 rounded-lg border px-2.5 text-[12px] transition-colors lg:inline-flex',
            open
              ? 'border-ink-600 bg-ink-850 text-ink-100'
              : 'border-ink-800 bg-ink-900 text-ink-400 hover:border-ink-700 hover:text-ink-200',
          )}
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="font-medium">Notifikasi</span>
          {count > 0 && (
            <span className="rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{count}</span>
          )}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center justify-between px-2.5 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Notifications</span>
            {count > 0 && (
              <button onClick={onReadAll} className="text-[11px] text-brand-300 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <MenuSeparator />
          <div className="max-h-[380px] overflow-y-auto">
            {state.notifications.slice(0, 8).map((n) => {
              const Icon = iconFor[n.kind]
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    onRead(n.id)
                    navigate(n.href)
                    close()
                  }}
                  className={cn(
                    'flex w-full gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-ink-750',
                    !n.read && 'bg-brand-600/[0.06]',
                  )}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                    style={{
                      background: `color-mix(in oklab, ${colorFor[n.kind]} 15%, transparent)`,
                      color: colorFor[n.kind],
                    }}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 text-[12px] font-medium leading-snug text-ink-100">
                        {n.title}
                      </span>
                      {!n.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-400">{n.body}</span>
                    <span className="mt-1 block text-[10px] text-ink-600">{relTime(n.at)}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <MenuSeparator />
          <MenuItem icon={<Settings className="h-3.5 w-3.5" />} onClick={() => { navigate('/settings?tab=notifications'); close() }}>
            Notification settings
          </MenuItem>
        </>
      )}
    </Dropdown>
  )
}

// ---------------------------------------------------------------------------
// Command palette / global search (PRD §33)
// ---------------------------------------------------------------------------

export function CommandPalette({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (prefill?: { title?: string }) => void
}) {
  const { state, platformMeta, workspaceContents, workspaceAssets, workspaceCampaigns } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    const base = [
      ...workspaceContents.map((c) => ({
        group: 'Content' as const,
        id: c.id,
        title: c.title,
        sub: `#${c.ref} - ${platformMeta(c.type).label} - ${c.status}`,
        href: `/content/${c.id}`,
        color: c.thumbnailColor,
      })),
      ...workspaceAssets.map((a) => ({
        group: 'Assets' as const,
        id: a.id,
        title: a.name,
        sub: `${a.folder} - ${a.kind.toUpperCase()}`,
        href: `/assets?asset=${a.id}`,
        color: a.color,
      })),
      ...workspaceCampaigns.map((c) => ({
        group: 'Campaigns' as const,
        id: c.id,
        title: c.name,
        sub: `${c.goal} - ${c.contentCount} konten`,
        href: `/campaigns?id=${c.id}`,
        color: c.color,
      })),
      ...state.ideas.map((i) => ({
        group: 'Ideas' as const,
        id: i.id,
        title: i.title,
        sub: `Idea - ${platformMeta(i.platform).label}`,
        href: '/ideas',
        color: '#d4af37',
      })),
    ]
    if (!term) return base.slice(0, 12)
    return base
      .filter((r) => `${r.title} ${r.sub}`.toLowerCase().includes(term))
      .slice(0, 14)
  }, [q, workspaceContents, workspaceAssets, workspaceCampaigns, state.ideas, platformMeta])

  useEffect(() => {
    if (open) {
      setQ('')
      setSel(0)
    }
  }, [open])

  useEffect(() => {
    setSel(0)
  }, [q])

  if (!open) return null

  const run = (idx: number) => {
    const r = results[idx]
    if (!r) return
    navigate(r.href)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2.5">
          <Search className="h-4 w-4 text-ink-400" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSel((s) => Math.min(s + 1, results.length - 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSel((s) => Math.max(s - 1, 0))
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                if (q.trim() && !results[sel]) {
                  onCreate({ title: q.trim() })
                  onClose()
                } else {
                  run(sel)
                }
              }
            }}
            placeholder="Search konten, asset, campaign, script, analytics..."
            className="h-9 border-0 bg-transparent px-0 focus:ring-0"
          />
        </div>
      }
      className="top-[12vh] my-0"
    >
      <div className="-mx-2 -my-2">
        {results.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <p className="text-[13px] text-ink-400">Tidak ada hasil untuk "{q}"</p>
            <Button
              size="sm"
              variant="primary"
              className="mt-3"
              onClick={() => {
                onCreate({ title: q.trim() })
                onClose()
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Buat konten dari pencarian
            </Button>
          </div>
        ) : (
          <>
            {q.trim() === '' && (
              <div className="flex gap-2 px-2 pb-2 pt-1">
                {['Semua', 'Content', 'Assets', 'Campaigns', 'Ideas'].map((f) => (
                  <span
                    key={f}
                    className="cursor-default rounded-md border border-ink-700 bg-ink-800 px-2 py-0.5 text-[10px] text-ink-400"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
            <ul className="max-h-[46vh] overflow-y-auto">
              {results.map((r, i) => (
                <li key={`${r.group}-${r.id}`}>
                  <button
                    onMouseEnter={() => setSel(i)}
                    onClick={() => run(i)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                      i === sel ? 'bg-ink-800' : 'hover:bg-ink-850',
                    )}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
                      style={{ background: `linear-gradient(145deg, ${r.color}, #0c0c11)` }}
                    >
                      {r.group[0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-ink-100">{r.title}</span>
                      <span className="block truncate text-[11px] text-ink-500">{r.sub}</span>
                    </span>
                    <Badge color="#6b6b85" size="xs">
                      {r.group}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-1 flex items-center justify-between border-t border-ink-700 px-2 pt-2">
              <span className="flex items-center gap-1.5 text-[10px] text-ink-500">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> navigasi
                <Kbd>↵</Kbd> buka
              </span>
              {q.trim() && (
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() => {
                    onCreate({ title: q.trim() })
                    onClose()
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Buat dari pencarian
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

export function ToastHost() {
  const { toasts, dismissToast } = useStore()
  const tone = {
    success: { c: '#22c55e', i: Check },
    info: { c: '#38bdf8', i: Sparkles },
    warn: { c: '#f59e0b', i: AlertCircle },
    danger: { c: '#ef4444', i: AlertCircle },
  }
  if (!toasts.length) return null
  return (
    <div className="no-print pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const { c, i: Icon } = tone[t.tone]
        return (
          <div
            key={t.id}
            className="animate-slide-right pointer-events-auto flex items-start gap-2.5 rounded-xl border border-ink-700 bg-ink-850/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{ background: `color-mix(in oklab, ${c} 20%, transparent)`, color: c }}
            >
              <Icon className="h-3 w-3" />
            </span>
            <span className="min-w-0 flex-1 text-[12px] leading-relaxed text-ink-100">{t.message}</span>
            <IconButton label="Tutup" onClick={() => dismissToast(t.id)} className="-mt-1 -mr-1 h-6 w-6">
              <span className="text-[14px] leading-none">×</span>
            </IconButton>
          </div>
        )
      })}
    </div>
  )
}

