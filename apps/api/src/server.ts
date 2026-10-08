import { existsSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'

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
  mkdirSync(path.resolve(process.cwd(), env.STORAGE_DIR), { recursive: true })

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
    time: new Date().toISOString(),
  }))

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
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
