/**
 * Progressive Web App wiring.
 *
 * Registers the service worker and exposes install/update state to the UI.
 * Everything here degrades silently: in a browser without service worker
 * support, or over plain http on a non-localhost origin, the app simply runs
 * as before with no install prompt available.
 */

export type InstallState = {
  /** True when the app is running as an installed PWA. */
  standalone: boolean
  /** Prompt to show an install button, if the browser offers one. */
  canInstall: boolean
  /** A newer build is waiting; the UI can offer a reload. */
  updateReady: boolean
  promptInstall: () => void
  applyUpdate: () => void
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let waitingWorker: ServiceWorker | null = null
const listeners = new Set<() => void>()

/** Not in lib.dom yet, so declared locally rather than globally. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let snapshot: Omit<InstallState, 'promptInstall' | 'applyUpdate'> = {
  standalone: false,
  canInstall: false,
  updateReady: false,
}

function emit() {
  for (const fn of listeners) fn()
}

function update(patch: Partial<typeof snapshot>) {
  snapshot = { ...snapshot, ...patch }
  emit()
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari, which is not the Android target but costs nothing to honour.
    (navigator as { standalone?: boolean }).standalone === true
  )
}

export function subscribeInstall(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getInstallState() {
  return {
    ...snapshot,
    promptInstall: async () => {
      if (!deferredPrompt) return
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
      // Chromium fires this once; never offer a second prompt for it.
      deferredPrompt = null
      update({ canInstall: false })
    },
    applyUpdate: () => {
      // skipWaiting alone does not reload; the controllerchange handler does.
      waitingWorker?.postMessage({ type: 'SKIP_WAITING' })
    },
  }
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  // A service worker cannot register from a cross-origin script, and http on a
  // non-localhost host is not a secure context, so both would throw.
  if (!window.isSecureContext) return

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    update({ canInstall: true })
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    update({ canInstall: false, standalone: true })
  })

  // A new worker taking control means a fresh bundle is now live.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        update({ standalone: isStandalone() })
        if (reg.waiting) {
          waitingWorker = reg.waiting
          update({ updateReady: true })
        }
        reg.addEventListener('updatefound', () => {
          const next = reg.installing
          if (!next) return
          next.addEventListener('statechange', () => {
            // A worker that installs while another is already controlling the
            // page is waiting its turn; that is the "refresh for new version"
            // case, not a first install.
            if (next.state === 'installed' && navigator.serviceWorker.controller) {
              waitingWorker = next
              update({ updateReady: true })
            }
          })
        })
        // Check for a new build when returning to a tab left open for a while.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => undefined)
        })
      })
      .catch(() => {
        // Registration failing is not fatal: the app still runs, just without
        // offline support. Swallowed deliberately rather than surfaced.
      })
  })
}