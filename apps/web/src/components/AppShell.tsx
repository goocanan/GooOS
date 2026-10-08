import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar, Topbar, CommandPalette, ToastHost } from './shell'
import { CreateContentModal } from './modals'
import Login from '@/pages/Login'
import { useLocalStorage } from './ui'
import { StoreProvider, useStore } from '@/lib/store'

function Shell() {
  const [collapsed, setCollapsed] = useLocalStorage('gooos.sidebar', false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
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
        <main data-scroll-root className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-ink-800 bg-ink-900/95 px-2 py-1.5 backdrop-blur-xl md:hidden">
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
            <a
              key={item.to}
              href={item.to}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[9px] font-medium transition-colors ${
                active ? 'text-brand-300' : 'text-ink-500'
              }`}
            >
              <item.icon />
              {item.label}
            </a>
          )
        })}
      </nav>

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