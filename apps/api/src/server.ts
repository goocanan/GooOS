import { existsSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'

import { env } from './config/env'
import { getDb } from './db/client'
import { migrate, isMigrated } from './db/migrate'
import { initAuth, registerAuthRoutes } from './plugins/auth'
import { registerContext } from './plugins/context'
import {
  registerSessionRoutes,
  registerWorkspaceRoutes,
  registerBrandRoutes,
  registerCampaignRoutes,
  registerTeamRoutes,
} from './routes/core'
import { registerContentRoutes } from './routes/content'
import {
  registerAssetRoutes,
  registerIdeaRoutes,
  registerHashtagRoutes,
} from './routes/library'
import {
  registerAnalyticsRoutes,
  registerNotificationRoutes,
  registerAiRoutes,
} from './routes/analytics'
import { maybeSeed } from './db/seed'

/**
 * Locates the built SPA, if it exists.
 *
 * WEB_DIST overrides the path; otherwise the layout is resolved relative to this
 * file so it works whether the server is started from apps/api or the repo root.
 * Returns null when nothing is built, which keeps development on Vite's dev
 * server rather than serving a stale bundle.
 */
function resolveWebDist(): string | null {
  const candidates = [
    env.WEB_DIST,
    path.resolve(import.meta.dirname, '../../web/dist'),
    path.resolve(process.cwd(), 'apps/web/dist'),
  ].filter((v): v is string => Boolean(v))

  for (const dir of candidates) {
    if (existsSync(path.join(dir, 'index.html'))) return dir
  }
  return null
}

/**
 * Pretty-printed logs when pino-pretty happens to be installed, otherwise
 * plain JSON. Keeps startup free of a hard dependency on a dev-only package.
 */
function loggerTransport(): { target: string; options: Record<string, unknown> } | undefined {
  if (env.isProd) return undefined
  try {
    createRequire(import.meta.url).resolve('pino-pretty')
    return { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
  } catch {
    return undefined
  }
}

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: loggerTransport(),
    },
    bodyLimit: 25 * 1024 * 1024,
    trustProxy: true,
  })

  // Storage directory for uploaded assets.
  mkdirSync(env.storageDir, { recursive: true })

  await app.register(cors, {
    origin: (origin, cb) => {
      // Same-origin requests and dev servers are both fine.
      if (!origin || env.corsOrigins.includes(origin)) return cb(null, true)
      cb(new Error('Origin not allowed'), false)
    },
    credentials: true,
  })
  await app.register(cookie)
  await app.register(multipart, {
    limits: { fileSize: 200 * 1024 * 1024, files: 20 },
  })
  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
    // Auth endpoints get a tighter budget.
    keyGenerator: (req) => req.ip,
  })

  await app.register(async (instance) => {
    await instance.register(async (authed) => {
      // Tighter limit on credential endpoints.
      await authed.register(rateLimit, { max: 20, timeWindow: '1 minute' })
    }, { prefix: '/api/auth' })
  })

  // Bootstrap the data layer before anything touches the schema.
  await getDb()
  await migrate()
  if (!(await isMigrated())) throw new Error('Schema migration failed')
  await initAuth()
  if (env.seedDemoUser) await maybeSeed()

  await registerAuthRoutes(app)
  await registerContext(app)

  await registerSessionRoutes(app)
  await registerWorkspaceRoutes(app)
  await registerTeamRoutes(app)
  await registerBrandRoutes(app)
  await registerCampaignRoutes(app)
  await registerContentRoutes(app)
  await registerAssetRoutes(app)
  await registerIdeaRoutes(app)
  await registerHashtagRoutes(app)
  await registerAnalyticsRoutes(app)
  await registerNotificationRoutes(app)
  await registerAiRoutes(app)

  app.get('/api/health', async () => ({
    ok: true,
    db: env.usesEmbeddedDb ? 'pglite (embedded)' : 'postgres',
    ai: env.AI_PROVIDER,
    spa: webDist ? 'served from this origin' : 'separate origin (set VITE_API_URL)',
    time: new Date().toISOString(),
  }))

  /**
   * In production the SPA is served from this same origin as the API.
   *
   * That is deliberate. A split deployment (static site on one host, API on
   * another) makes every session cookie cross-site, and Better Auth defaults to
   * SameSite=Lax, which browsers refuse to send on cross-origin fetch. Serving
   * both from one origin keeps cookies first-party and makes CORS irrelevant.
   *
   * In development this is skipped: Vite serves the SPA on :5180 and proxies
   * /api here, and apps/web/dist may be stale.
   */
  const webDist = resolveWebDist()
  if (webDist) {
    await app.register(fastifyStatic, {
      root: webDist,
      prefix: '/',
      // Serve index.html for "/" . With index disabled @fastify/static answers
      // a directory request with 403 instead.
      index: 'index.html',
      // Vite fingerprints filenames, so assets can be cached forever. index.html
      // must never be cached or clients keep loading stale asset references.
      setHeaders(reply, filePath) {
        if (filePath.endsWith('index.html')) {
          reply.header('cache-control', 'no-cache')
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          reply.header('cache-control', 'public, max-age=31536000, immutable')
        } else if (filePath.endsWith('sw.js')) {
          // The service worker must never be cached, or a client can be pinned
          // to an old worker indefinitely. No-cache still permits revalidation,
          // which is what lets a redeploy reach installed clients.
          reply.header('cache-control', 'no-cache')
          // Lets the worker control the whole origin regardless of where it
          // sits in the tree.
          reply.header('service-worker-allowed', '/')
        } else if (filePath.endsWith('manifest.webmanifest')) {
          // Some Android launchers refuse a manifest served as octet-stream.
          reply.header('content-type', 'application/manifest+json')
        }
      },
    })
    app.log.info(`SPA served from ${webDist}`)
  }

  app.setNotFoundHandler((request, reply) => {
    // Client-side routes (/content/:id, /board, ...) must return index.html so a
    // hard refresh or a shared link works. API paths keep returning JSON.
    if (webDist && request.method === 'GET' && !request.url.startsWith('/api/')) {
      return reply.type('text/html').header('cache-control', 'no-cache').sendFile('index.html')
    }
    return reply.status(404).send({
      error: { code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found` },
    })
  })

  // The error handler is registered once, in registerContext().

  return app
}

// Started directly (not imported by a test) -> listen.
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const app = await buildServer()
  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    app.log.info(`GooOS API ready - ${env.usesEmbeddedDb ? 'embedded PGlite' : env.DATABASE_URL}`)
    if (!existsSync(path.resolve(process.cwd(), '.env'))) {
      app.log.info('No .env found; using development defaults')
    }
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, async () => {
      await app.close()
      process.exit(0)
    })
  }
}
