import { and, eq } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { getAuth } from './auth'
import { db, schema } from '../db/client'
import { ApiError } from '../lib/errors'
import type { Role } from '@gooos/shared/enums'
import { ROLE_TIER, canReview } from '@gooos/shared/enums'
import { id, uniqueSlug } from '../lib/ids'

/**
 * Request context (PRD section 5 + section 38).
 *
 * Every workspace-scoped route resolves an "actor": the authenticated user plus
 * their membership in the active workspace. Handlers call `requireSession()` /
 * `requireRole()` and never query membership themselves, which makes tenant
 * isolation a single concern.
 *
 * The active workspace comes from the `x-workspace-id` header, falling back to
 * the user's first workspace. It is validated against a real membership row, so
 * a client cannot spoof another tenant by sending a header.
 *
 * These are plain functions rather than Fastify decorators because `decorate()`
 * is typed as a zero-argument getter/setter, which cannot express
 * `requireRole('manager')(request)`.
 */

export interface Actor {
  userId: string
  name: string
  email: string
  workspaceId: string
  role: Role
  isOwner: boolean
}

declare module 'fastify' {
  interface FastifyRequest {
    actor?: Actor
  }
}

/** Reads the Better Auth session from the request cookie or bearer token. */
async function getSessionUser(request: FastifyRequest) {
  const headers = new Headers()
  const cookie = request.headers.cookie
  if (cookie) headers.set('cookie', cookie)
  const authorization = request.headers.authorization
  if (authorization?.startsWith('Bearer ')) headers.set('authorization', authorization)

  const session = await getAuth().api.getSession({ headers })
  if (!session?.user) return null
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
    title: (session.user as { title?: string | null }).title ?? null,
    active: (session.user as { active?: boolean }).active ?? true,
  }
}

async function findMembership(userId: string, workspaceId?: string) {
  const database = db()
  if (workspaceId) {
    return (
      (await database.query.workspaceMembers.findFirst({
        where: and(
          eq(schema.workspaceMembers.userId, userId),
          eq(schema.workspaceMembers.workspaceId, workspaceId),
        ),
      })) ?? null
    )
  }
  return (
    (await database.query.workspaceMembers.findFirst({
      where: eq(schema.workspaceMembers.userId, userId),
    })) ?? null
  )
}

/** Requires a valid session; resolves and caches the actor on the request. */
export async function requireSession(request: FastifyRequest): Promise<Actor> {
  if (request.actor) return request.actor

  const user = await getSessionUser(request)
  if (!user) throw ApiError.unauthorized()
  if (user.active === false) throw ApiError.forbidden('Your account has been deactivated')

  const header = request.headers['x-workspace-id']
  const requested = Array.isArray(header) ? header[0] : header

  const membership = await findMembership(user.id, requested)

  if (!membership) {
    if (requested) throw ApiError.forbidden('You are not a member of that workspace')
    const created = await createDefaultWorkspace(user.id, user.name || user.email)
    request.actor = {
      userId: user.id,
      name: user.name,
      email: user.email,
      workspaceId: created,
      role: 'owner',
      isOwner: true,
    }
    return request.actor
  }

  request.actor = {
    userId: user.id,
    name: user.name,
    email: user.email,
    workspaceId: membership.workspaceId,
    role: membership.role,
    isOwner: membership.role === 'owner',
  }
  return request.actor
}

/** requireSession + a minimum role tier. */
export function requireRole(minimum: Role) {
  return async (request: FastifyRequest): Promise<Actor> => {
    const actor = await requireSession(request)
    if (ROLE_TIER[actor.role] < ROLE_TIER[minimum]) {
      throw ApiError.forbidden(`Requires ${minimum} role or higher`)
    }
    return actor
  }
}

/** requireSession + a role that may approve content. */
export function requireReviewer() {
  return async (request: FastifyRequest): Promise<Actor> => {
    const actor = await requireSession(request)
    if (!canReview(actor.role)) throw ApiError.forbidden('Requires reviewer privileges')
    return actor
  }
}

/** Called when a signed-in user has no workspace yet. */
async function createDefaultWorkspace(userId: string, name: string): Promise<string> {
  const database = db()
  const workspaceId = id('ws')
  const slug = await uniqueSlug(name || 'My Workspace', async (s) =>
    Boolean(
      await database.query.workspaces.findFirst({
        where: eq(schema.workspaces.slug, s),
        columns: { id: true },
      }),
    ),
  )

  await database.insert(schema.workspaces).values({ id: workspaceId, name: name || 'My Workspace', slug })
  await database.insert(schema.workspaceMembers).values({ workspaceId, userId, role: 'owner' })
  return workspaceId
}

export async function registerContext(app: FastifyInstance) {
  app.decorateRequest('actor', undefined)

  app.setErrorHandler(async (error, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      })
    }
    const status = (error as { statusCode?: number }).statusCode ?? 500
    if (status < 500) {
      const e = error as { code?: string; message?: string }
      return reply
        .status(status)
        .send({ error: { code: e.code ?? 'ERROR', message: e.message ?? 'Request failed' } })
    }
    request.log.error({ err: error }, 'Unhandled error')
    return reply
      .status(500)
      .send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
  })
}

/** Extra assertion for handlers that receive an explicit workspace id. */
export function assertWorkspace(actor: Actor | undefined, workspaceId: string) {
  if (!actor) throw ApiError.unauthorized()
  if (actor.workspaceId !== workspaceId) throw ApiError.forbidden('Cross-workspace access denied')
}