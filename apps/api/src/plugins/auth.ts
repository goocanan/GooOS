import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { db, getDb } from '../db/client'
import { env } from '../config/env'
import * as schema from '../db/schema'

/**
 * Better Auth instance (PRD section 38).
 *
 * Built lazily because the database connects asynchronously (PGlite needs a
 * round trip to become ready). Call `initAuth()` once during bootstrap; every
 * later consumer uses `getAuth()`.
 *
 * Email + password is enabled, plus the admin plugin so Owner/Admin roles can
 * manage users. Sessions live in Postgres and travel in an httpOnly cookie;
 * GooOS routes read them through the `requireSession` decorator.
 */

let instance: ReturnType<typeof build> | null = null

function build() {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db(), {
      provider: 'pg',
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
    advanced: {
      cookiePrefix: 'gooos',
      useSecureCookies: env.isProd,
    },
    user: {
      additionalFields: {
        title: { type: 'string', required: false },
        active: { type: 'boolean', required: false, defaultValue: true },
      },
    },
    // Note: Better Auth's `admin` plugin is intentionally not enabled. Its roles
    // are account-global, while PRD section 5 scopes roles to a workspace
    // (a user can be Owner in one workspace and Client in another). Keeping both
    // would mean two competing sources of truth, so GooOS authorises
    // exclusively through workspace_members - see plugins/context.ts.
  })
}

export type Auth = ReturnType<typeof build>

/** Connects the database if needed, then creates the auth instance once. */
export async function initAuth(): Promise<Auth> {
  if (instance) return instance
  await getDb()
  instance = build()
  return instance
}

/** The auth instance. Throws if bootstrap was skipped. */
export function getAuth(): Auth {
  if (!instance) throw new Error('Auth not initialised - call initAuth() during bootstrap first')
  return instance
}

/** Mounts the Better Auth REST handler at /api/auth/*. */
export async function registerAuthRoutes(app: FastifyInstance) {
  const auth = await initAuth()

  app.all('/api/auth/*', async (request: FastifyRequest, reply: FastifyReply) => {
    const headers = new Headers()
    const cookie = request.headers.cookie
    if (cookie) headers.set('cookie', cookie)
    const authorization = request.headers.authorization
    if (authorization?.startsWith('Bearer ')) headers.set('authorization', authorization)
    if (request.headers['content-type']) headers.set('content-type', String(request.headers['content-type']))

    const method = request.method.toUpperCase()
    const hasBody = method !== 'GET' && method !== 'HEAD'

    const webRequest = new Request(new URL(request.url, env.BETTER_AUTH_URL).toString(), {
      method,
      headers,
      ...(hasBody ? { body: JSON.stringify(request.body ?? {}) } : {}),
    } as RequestInit)

    const response = await auth.handler(webRequest)

    reply.status(response.status)
    response.headers.forEach((value, key) => {
      // set-cookie can repeat and must not be merged into one header.
      if (key.toLowerCase() === 'set-cookie') return
      reply.header(key, value)
    })
    for (const c of response.headers.getSetCookie?.() ?? []) {
      reply.header('set-cookie', c)
    }

    return reply.send(response.body ? Buffer.from(await response.arrayBuffer()) : null)
  })
}

export interface SessionUser {
  id: string
  name: string
  email: string
  image: string | null
  title: string | null
  active: boolean
}