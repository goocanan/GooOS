/*
 * GooOS service worker.
 *
 * Scope of what this does and does not cache:
 *
 *   - Static app shell (JS/CSS/fonts/icons): precached, cache-first. These are
 *     content-hashed by Vite, so a cached hit is always correct.
 *
 *   - API calls under /api: NEVER cached or intercepted. Not even a network
 *     fallback. Session cookies, Better Auth responses and content mutations all
 *     live behind that prefix, and a cached /api/session would resurrect a stale
 *     signed-in state after sign-out. Letting the browser handle it means the
 *     app is online-only, which is the honest trade here.
 *
 * Navigations fall back to the precached shell so a cold offline start resolves
 * to the SPA rather than the browser's offline page. That fallback only ever
 * returns HTML - it can never invent API data.
 */

const VERSION = 'v1'
const SHELL_CACHE = `gooos-shell-${VERSION}`
const ASSET_CACHE = `gooos-assets-${VERSION}`

/**
 * Hashed build output. Kept deliberately small: the precache covers the shell
 * and let the runtime cache pick up lazily-loaded chunks. Listing every chunk
 * here would mean regenerating this file on every build.
 */
const PRECACHE = ['/', '/index.html', '/manifest.webmanifest']

const API_PREFIX = '/api'

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE)
      // Individually, so one 404 cannot fail the whole install.
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined),
        ),
      )
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('message', (event) => {
  // The page asks the waiting worker to take over immediately, so that a new
  // deployment can be applied without the user closing every open tab. The
  // activate handler then fires and clients.claim() hands over control, which
  // makes the page's controllerchange listener reload it.
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => k.startsWith('gooos-') && k !== SHELL_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

function isApi(url) {
  return new URL(url).pathname === API_PREFIX || new URL(url).pathname.startsWith(API_PREFIX + '/')
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Never touch API traffic, and only handle GET. Anything that mutates state
  // must go straight to the network.
  if (request.method !== 'GET') return
  if (isApi(request.url)) return

  // Navigations: network first, so a deployed change is picked up promptly,
  // falling back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          const cache = await caches.open(SHELL_CACHE)
          cache.put('/index.html', fresh.clone())
          return fresh
        } catch {
          const cached = await caches.match('/index.html')
          return cached ?? Response.error()
        }
      })(),
    )
    return
  }

  // Static assets: cache first, then fill the cache in the background.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request)
      if (cached) return cached
      try {
        const fresh = await fetch(request)
        if (fresh.ok && fresh.type === 'basic') {
          const cache = await caches.open(ASSET_CACHE)
          cache.put(request, fresh.clone())
        }
        return fresh
      } catch {
        return cached ?? Response.error()
      }
    })(),
  )
})