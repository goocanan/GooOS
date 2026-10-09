import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Bot,
  FileText,
  FolderOpen,
  Layers,
  Megaphone,
  MoreHorizontal,
  Settings,
  Users,
} from 'lucide-react'
import { Sidebar, Topbar, CommandPalette, ToastHost } from './shell'
import { CreateContentModal } from './modals'
import Login from '@/pages/Login'
import { useLocalStorage } from './ui'
import { StoreProvider, useStore } from '@/lib/store'

/**
 * Routes the mobile bottom bar has no slot for. Order matters: it reads as a
 * continuation of the sidebar, most-used first.
 */
const MORE_ROUTES = [
  { to: '/content', label: 'Semua konten', Icon: Layers },
  { to: '/campaigns', label: 'Campaigns', Icon: Megaphone },
  { to: '/assets', label: 'Assets', Icon: FolderOpen },
  { to: '/scripts', label: 'Scripts', Icon: FileText },
  { to: '/ai', label: 'AI Studio', Icon: Bot },
  { to: '/team', label: 'Team', Icon: Users },
  { to: '/reports', label: 'Reports', Icon: BarChart3 },
  { to: '/settings', label: 'Settings', Icon: Settings },
] as const

function Shell() {
  const [collapsed, setCollapsed] = useLocalStorage('gooos.sidebar', false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [prefill, setPrefill] = useState<string | undefined>()
  const { state } = useStore()
  const location = useLocation()

  // Global shortcuts: Cmd/Ctrl+K search, Cmd/Ctrl+N new content
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
      if (mod && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setPrefill(undefined)
        setCreateOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Reset scroll on navigation
  useEffect(() => {
    document.querySelector('[data-scroll-root]')?.scrollTo({ top: 0 })
  }, [location.pathname])

  // The "more" sheet is a mobile-only route list; closing it on navigation stops
  // it lingering behind the screen after a tap.
  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  // Deep link: /content?create=1 opens the create modal
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('create') === '1') {
      setPrefill(undefined)
      setCreateOpen(true)
    }
  }, [location.search])

  if (state.status === 'loading' || !state.hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink-950">
        <div className="flex items-center gap-2.5 text-ink-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-600 border-t-brand-500" />
          <span className="text-[13px]">Memuat workspace...</span>
        </div>
      </div>
    )
  }

  if (state.status === 'anonymous') return <Login />
  if (state.status === 'error') return <Login />

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-ink-950">
      <div className="hidden md:flex">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          onCreate={() => {
            setPrefill(undefined)
            setCreateOpen(true)
          }}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOpenSearch={() => setSearchOpen(true)}
          onOpenCreate={() => {
            setPrefill(undefined)
            setCreateOpen(true)
          }}
        />
        <main data-scroll-root className="flex-1 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile nav. pb-[env(safe-area-inset-bottom)] keeps the bar clear of
          Android's gesture pill, which the plain py padding would sit under. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-ink-800 bg-ink-900/95 px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
        {[
          { to: '/', label: 'Home', icon: LayoutIcon },
          { to: '/board', label: 'Board', icon: BoardIcon },
          { to: '/calendar', label: 'Kalender', icon: CalIcon },
          { to: '/ideas', label: 'Ideas', icon: IdeaIcon },
          { to: '/analytics', label: 'Analitik', icon: ChartIcon },
        ].map((item) => {
          const active =
            item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              // 44px is the minimum comfortable touch target; the labels sit at
              // 10px rather than 9px so they stay legible on a real handset.
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium transition-colors ${
                active ? 'text-brand-300' : 'text-ink-400'
              }`}
            >
              <item.icon />
              {item.label}
            </Link>
          )
        })}
        {/* The bar holds five slots. Everything else lives behind this button,
            otherwise Settings, Team, Assets and the rest are unreachable on a
            phone - there is no sidebar to fall back to below the md breakpoint. */}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="Menu lainnya"
          aria-expanded={moreOpen}
          className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium transition-colors ${
            MORE_ROUTES.some((r) => location.pathname.startsWith(r.to))
              ? 'text-brand-300'
              : 'text-ink-400'
          }`}
        >
          <MoreHorizontal className="h-4 w-4" />
          Lainnya
        </button>
      </nav>

      {/* Route picker for everything the bottom bar cannot fit. */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu lainnya"
        >
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-ink-700 bg-ink-900 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-ink-600" />
            <nav className="grid grid-cols-2 gap-1 p-3">
              {MORE_ROUTES.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex min-h-14 items-center gap-2.5 rounded-xl border px-3 text-[13px] font-medium transition-colors ${
                    location.pathname.startsWith(item.to)
                      ? 'border-brand-500/40 bg-brand-500/10 text-brand-200'
                      : 'border-ink-700/70 bg-ink-850 text-ink-200'
                  }`}
                >
                  <item.Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onCreate={(p) => {
          setPrefill(p?.title)
          setCreateOpen(true)
        }}
      />
      <CreateContentModal open={createOpen} onClose={() => setCreateOpen(false)} prefillTitle={prefill} />
      <ToastHost />
    </div>
  )
}

function LayoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}
function BoardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="11" rx="1.5" />
      <rect x="16" y="4" width="5" height="14" rx="1.5" />
    </svg>
  )
}
function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}
function IdeaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5V15H8v-1.5A6 6 0 0 1 12 3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
    </svg>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}