import type { FastifyInstance } from 'fastify'
import { requireSession, requireRole } from '../plugins/context'
import { z } from 'zod'
import { db, schema } from '../db/client'
import { ApiError } from '../lib/errors'
import { id, uniqueSlug } from '../lib/ids'
import { parse } from '../lib/validate'
import { toBrandDTO, toCampaignDTO, toContentDTO, toMemberDTO, toUserDTO, toWorkspaceDTO } from '../lib/serialize'
import { loadContents } from './_content-query'
import {
  createBrandSchema,
  createCampaignSchema,
  createWorkspaceSchema,
  inviteMemberSchema,
  updateBrandSchema,
  updateCampaignSchema,
  updateMemberSchema,
  updateWorkspaceSchema,
} from '@gooos/shared/schemas'
import type { Role } from '@gooos/shared/enums'
import { eq, and, sql } from 'drizzle-orm'
import { getAuth } from '../plugins/auth'

/**
 * Session, workspace, brand, campaign and team routes.
 *
 * Tenant isolation rule: every query is scoped by `actor.workspaceId`, which is
 * resolved from an actual membership row - never from client input alone.
 */

export async function registerSessionRoutes(app: FastifyInstance) {
  /**
   * Returns everything the SPA needs after a sign-in: the user, their
   * workspaces, the active workspace and its members.
   */
  app.get('/api/session', async (request) => {
    const actor = await requireSession(request)
    const database = db()

    const memberships = await database.query.workspaceMembers.findMany({
      where: eq(schema.workspaceMembers.userId, actor.userId),
    })
    const workspaceRows = await database.query.workspaces.findMany({
      where: sql`id IN (${sql.join(
        memberships.map((m) => sql`${m.workspaceId}`),
        sql`, `,
      )})`,
    })
    const roleByWorkspace = new Map(memberships.map((m) => [m.workspaceId, m.role]))

    const active =
      workspaceRows.find((w) => w.id === actor.workspaceId) ?? workspaceRows[0] ?? null

    const members = await database
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        image: schema.users.image,
        title: schema.users.title,
        active: schema.users.active,
        createdAt: schema.users.createdAt,
        role: schema.workspaceMembers.role,
        joinedAt: schema.workspaceMembers.joinedAt,
      })
      .from(schema.workspaceMembers)
      .innerJoin(schema.users, eq(schema.users.id, schema.workspaceMembers.userId))
      .where(eq(schema.workspaceMembers.workspaceId, actor.workspaceId))

    const user = await database.query.users.findFirst({
      where: eq(schema.users.id, actor.userId),
    })

    return {
      user: user ? toUserDTO(user) : null,
      activeWorkspaceId: active?.id ?? null,
      workspaces: workspaceRows.map((w) =>
        toWorkspaceDTO(w, (roleByWorkspace.get(w.id) ?? 'creator') as Role),
      ),
      members: members.map(toMemberDTO),
    }
  })

  /** Switches the active workspace; the SPA echoes it back as x-workspace-id. */
  app.post('/api/session/workspace', async (request, reply) => {
    const actor = await requireSession(request)
    const { workspaceId } = parse(
      z.object({ workspaceId: z.string().min(1) }),
      request.body,
    )

    const membership = await db().query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.userId, actor.userId),
        eq(schema.workspaceMembers.workspaceId, workspaceId),
      ),
    })
    if (!membership) throw ApiError.forbidden('You are not a member of that workspace')

    // Mirror the choice into the session cookie's workspace hint.
    reply.header('set-cookie', `gooos.ws=${workspaceId}; Path=/; SameSite=Lax; Max-Age=604800`)

    const row = await db().query.workspaces.findFirst({
      where: eq(schema.workspaces.id, workspaceId),
    })
    return { workspace: row ? toWorkspaceDTO(row, membership.role) : null }
  })

  /** Signs up and provisions a first workspace. */
  app.post('/api/auth/register', async (request, reply) => {
    const body = parse(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        workspaceName: z.string().min(2).optional(),
      }),
      request.body,
    )

    const result = await getAuth().api.signUpEmail({
      body: { name: body.name, email: body.email, password: body.password },
      headers: new Headers(),
      asResponse: true,
    })

    if (!result.ok) {
      const text = await result.text().catch(() => '')
      throw ApiError.conflict(text.slice(0, 200) || 'Could not create account')
    }

    const payload = (await result.json()) as { user: { id: string } }

    if (body.workspaceName) {
      const wsId = id('ws')
      const slug = await uniqueSlug(body.workspaceName, async (s) =>
        Boolean(await db().query.workspaces.findFirst({ where: eq(schema.workspaces.slug, s) })),
      )
      await db().insert(schema.workspaces).values({ id: wsId, name: body.workspaceName, slug })
      await db()
        .insert(schema.workspaceMembers)
        .values({ workspaceId: wsId, userId: payload.user.id, role: 'owner' })
    }

    for (const c of result.headers.getSetCookie()) reply.header('set-cookie', c)
    return { user: payload.user }
  })
}

// ---------------------------------------------------------------------------
// Workspaces
// ---------------------------------------------------------------------------

export async function registerWorkspaceRoutes(app: FastifyInstance) {
  app.get('/api/workspaces', async (request) => {
    const actor = await requireSession(request)
    const memberships = await db().query.workspaceMembers.findMany({
      where: eq(schema.workspaceMembers.userId, actor.userId),
    })
    if (!memberships.length) return { data: [] }

    const rows = await db().query.workspaces.findMany({
      where: sql`id IN (${sql.join(
        memberships.map((m) => sql`${m.workspaceId}`),
        sql`, `,
      )})`,
      orderBy: schema.workspaces.createdAt,
    })
    const roleByWorkspace = new Map(memberships.map((m) => [m.workspaceId, m.role]))
    return {
      data: rows.map((w) => toWorkspaceDTO(w, (roleByWorkspace.get(w.id) ?? 'creator') as Role)),
    }
  })

  app.post('/api/workspaces', async (request) => {
    const actor = await requireSession(request)
    const body = parse(createWorkspaceSchema, request.body)

    const wsId = id('ws')
    const slug = await uniqueSlug(body.slug ?? body.name, async (s) =>
      Boolean(await db().query.workspaces.findFirst({ where: eq(schema.workspaces.slug, s) })),
    )

    await db().transaction(async (tx) => {
      await tx.insert(schema.workspaces).values({
        id: wsId,
        name: body.name,
        slug,
        plan: body.plan ?? 'free',
      })
      await tx
        .insert(schema.workspaceMembers)
        .values({ workspaceId: wsId, userId: actor.userId, role: 'owner' })
    })

    const row = await db().query.workspaces.findFirst({ where: eq(schema.workspaces.id, wsId) })
    return { workspace: toWorkspaceDTO(row!, 'owner') }
  })

  app.patch('/api/workspaces/:id', async (request) => {
    const actor = await requireRole('admin')(request)
    const { id: wsId } = request.params as { id: string }
    if (wsId !== actor.workspaceId) throw ApiError.forbidden('Cross-workspace access denied')

    const body = parse(updateWorkspaceSchema, request.body)
    await db().update(schema.workspaces).set({ ...body, updatedAt: new Date() }).where(eq(schema.workspaces.id, wsId))

    const row = await db().query.workspaces.findFirst({ where: eq(schema.workspaces.id, wsId) })
    return { workspace: toWorkspaceDTO(row!, actor.role) }
  })
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export async function registerTeamRoutes(app: FastifyInstance) {
  app.get('/api/team', async (request) => {
    const actor = await requireSession(request)
    const rows = await db()
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        image: schema.users.image,
        title: schema.users.title,
        active: schema.users.active,
        createdAt: schema.users.createdAt,
        role: schema.workspaceMembers.role,
        joinedAt: schema.workspaceMembers.joinedAt,
      })
      .from(schema.workspaceMembers)
      .innerJoin(schema.users, eq(schema.users.id, schema.workspaceMembers.userId))
      .where(eq(schema.workspaceMembers.workspaceId, actor.workspaceId))
    return { data: rows.map(toMemberDTO) }
  })

  app.post('/api/team/invite', async (request) => {
    const actor = await requireRole('manager')(request)
    const body = parse(inviteMemberSchema, request.body)

    const existing = await db().query.users.findFirst({ where: eq(schema.users.email, body.email) })
    if (!existing) {
      // The person must have an account before they can join a workspace.
      // For now surface a clear error; email invites land with the V2 mailer.
      throw ApiError.badRequest(
        `${body.email} does not have a GooOS account yet. Ask them to sign up first.`,
      )
    }

    const already = await db().query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, actor.workspaceId),
        eq(schema.workspaceMembers.userId, existing.id),
      ),
    })
    if (already) throw ApiError.conflict('That person is already a member of this workspace')

    await db().transaction(async (tx) => {
      await tx.insert(schema.workspaceMembers).values({
        workspaceId: actor.workspaceId,
        userId: existing.id,
        role: body.role,
      })
      await tx
        .update(schema.workspaces)
        .set({ seats: sql`${schema.workspaces.seats} + 1`, updatedAt: new Date() })
        .where(eq(schema.workspaces.id, actor.workspaceId))
    })

    return { member: { ...toUserDTO(existing), role: body.role } }
  })

  app.patch('/api/team/:userId', async (request) => {
    const actor = await requireRole('manager')(request)
    const { userId } = request.params as { userId: string }
    const body = parse(updateMemberSchema, request.body)

    const target = await db().query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, actor.workspaceId),
        eq(schema.workspaceMembers.userId, userId),
      ),
    })
    if (!target) throw ApiError.notFound('Member')

    // Guard against removing the last Owner of a workspace.
    if (body.role && body.role !== 'owner' && target.role === 'owner') {
      const owners = await db().query.workspaceMembers.findMany({
        where: and(
          eq(schema.workspaceMembers.workspaceId, actor.workspaceId),
          eq(schema.workspaceMembers.role, 'owner'),
        ),
      })
      if (owners.length <= 1) throw ApiError.conflict('A workspace must keep at least one owner')
    }

    if (body.role) {
      await db()
        .update(schema.workspaceMembers)
        .set({ role: body.role })
        .where(
          and(
            eq(schema.workspaceMembers.workspaceId, actor.workspaceId),
            eq(schema.workspaceMembers.userId, userId),
          ),
        )
    }
    if (body.active !== undefined) {
      await db().update(schema.users).set({ active: body.active }).where(eq(schema.users.id, userId))
    }

    return { ok: true }
  })

  app.delete('/api/team/:userId', async (request) => {
    const actor = await requireRole('manager')(request)
    const { userId } = request.params as { userId: string }
    if (userId === actor.userId) throw ApiError.badRequest('You cannot remove yourself')

    await db()
      .delete(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, actor.workspaceId),
          eq(schema.workspaceMembers.userId, userId),
        ),
      )
    return { ok: true }
  })
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

export async function registerBrandRoutes(app: FastifyInstance) {
  app.get('/api/brands', async (request) => {
    const actor = await requireSession(request)
    const rows = await db().query.brands.findMany({
      where: eq(schema.brands.workspaceId, actor.workspaceId),
      orderBy: schema.brands.createdAt,
    })
    return { data: rows.map(toBrandDTO) }
  })

  app.get('/api/brands/:id', async (request) => {
    const actor = await requireSession(request)
    const { id: brandId } = request.params as { id: string }
    const row = await db().query.brands.findFirst({
      where: and(eq(schema.brands.id, brandId), eq(schema.brands.workspaceId, actor.workspaceId)),
    })
    if (!row) throw ApiError.notFound('Brand')
    return { brand: toBrandDTO(row) }
  })

  app.post('/api/brands', async (request) => {
    const actor = await requireRole('manager')(request)
    const body = parse(createBrandSchema, request.body)
    const brandId = id('b')

    await db().insert(schema.brands).values({
      id: brandId,
      workspaceId: actor.workspaceId,
      name: body.name,
      description: body.description,
      website: body.website,
      logoText: body.logoText || body.name.slice(0, 3).toUpperCase(),
      color: body.color,
      industry: body.industry,
      audience: body.audience,
      socials: body.socials,
      guidelines: body.guidelines,
    })

    const row = await db().query.brands.findFirst({ where: eq(schema.brands.id, brandId) })
    return { brand: toBrandDTO(row!) }
  })

  app.patch('/api/brands/:id', async (request) => {
    const actor = await requireRole('manager')(request)
    const { id: brandId } = request.params as { id: string }
    const body = parse(updateBrandSchema, request.body)

    const current = await db().query.brands.findFirst({
      where: and(eq(schema.brands.id, brandId), eq(schema.brands.workspaceId, actor.workspaceId)),
    })
    if (!current) throw ApiError.notFound('Brand')

    await db()
      .update(schema.brands)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.brands.id, brandId))

    const row = await db().query.brands.findFirst({ where: eq(schema.brands.id, brandId) })
    return { brand: toBrandDTO(row!) }
  })

  app.delete('/api/brands/:id', async (request) => {
    const actor = await requireRole('admin')(request)
    const { id: brandId } = request.params as { id: string }
    await db()
      .delete(schema.brands)
      .where(and(eq(schema.brands.id, brandId), eq(schema.brands.workspaceId, actor.workspaceId)))
    return { ok: true }
  })
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export async function registerCampaignRoutes(app: FastifyInstance) {
  app.get('/api/campaigns', async (request) => {
    const actor = await requireSession(request)
    const rows = await db().query.campaigns.findMany({
      where: eq(schema.campaigns.workspaceId, actor.workspaceId),
      orderBy: schema.campaigns.start,
    })

    const counts = await db()
      .select({
        campaignId: schema.contents.campaignId,
        total: sql<number>`count(*)::int`,
        published: sql<number>`count(*) FILTER (WHERE ${schema.contents.status} = 'published')::int`,
      })
      .from(schema.contents)
      .where(eq(schema.contents.workspaceId, actor.workspaceId))
      .groupBy(schema.contents.campaignId)

    const rollup = new Map(counts.map((c) => [c.campaignId, c]))
    return {
      data: rows.map((r) => {
        const c = rollup.get(r.id)
        return toCampaignDTO(r, { contentCount: c?.total ?? 0, publishedCount: c?.published ?? 0 })
      }),
    }
  })

  app.get('/api/campaigns/:id', async (request) => {
    const actor = await requireSession(request)
    const { id: campaignId } = request.params as { id: string }
    const row = await db().query.campaigns.findFirst({
      where: and(eq(schema.campaigns.id, campaignId), eq(schema.campaigns.workspaceId, actor.workspaceId)),
    })
    if (!row) throw ApiError.notFound('Campaign')

    const contents = await loadContents(actor.workspaceId, eq(schema.contents.campaignId, campaignId))
    return {
      campaign: toCampaignDTO(row, { contentCount: contents.length, publishedCount: contents.filter((c) => c.status === 'published').length }),
      contents,
    }
  })

  app.post('/api/campaigns', async (request) => {
    const actor = await requireRole('manager')(request)
    const body = parse(createCampaignSchema, request.body)

    const brand = await db().query.brands.findFirst({
      where: and(eq(schema.brands.id, body.brandId), eq(schema.brands.workspaceId, actor.workspaceId)),
    })
    if (!brand) throw ApiError.badRequest('Brand not found in this workspace')

    const campaignId = id('c')
    await db().insert(schema.campaigns).values({
      id: campaignId,
      workspaceId: actor.workspaceId,
      brandId: body.brandId,
      name: body.name,
      goal: body.goal,
      start: body.start,
      end: body.end,
      status: body.status,
      color: body.color,
      budget: body.budget != null ? String(body.budget) : null,
    })

    const row = await db().query.campaigns.findFirst({ where: eq(schema.campaigns.id, campaignId) })
    return { campaign: toCampaignDTO(row!) }
  })

  app.patch('/api/campaigns/:id', async (request) => {
    const actor = await requireRole('manager')(request)
    const { id: campaignId } = request.params as { id: string }
    const body = parse(updateCampaignSchema, request.body)

    const current = await db().query.campaigns.findFirst({
      where: and(eq(schema.campaigns.id, campaignId), eq(schema.campaigns.workspaceId, actor.workspaceId)),
    })
    if (!current) throw ApiError.notFound('Campaign')

    await db()
      .update(schema.campaigns)
      .set({
        ...body,
        budget: body.budget === undefined ? undefined : body.budget == null ? null : String(body.budget),
        updatedAt: new Date(),
      })
      .where(eq(schema.campaigns.id, campaignId))

    const row = await db().query.campaigns.findFirst({ where: eq(schema.campaigns.id, campaignId) })
    return { campaign: toCampaignDTO(row!) }
  })

  app.delete('/api/campaigns/:id', async (request) => {
    const actor = await requireRole('manager')(request)
    const { id: campaignId } = request.params as { id: string }
    await db()
      .delete(schema.campaigns)
      .where(and(eq(schema.campaigns.id, campaignId), eq(schema.campaigns.workspaceId, actor.workspaceId)))
    return { ok: true }
  })

  /** Attaches or detaches a piece of content (PRD section 21). */
  app.post('/api/campaigns/:id/contents', async (request) => {
    const actor = await requireRole('manager')(request)
    const { id: campaignId } = request.params as { id: string }
    const { contentId } = parse(z.object({ contentId: z.string().min(1) }), request.body)

    const content = await db().query.contents.findFirst({
      where: and(eq(schema.contents.id, contentId), eq(schema.contents.workspaceId, actor.workspaceId)),
    })
    if (!content) throw ApiError.notFound('Content')

    await db().update(schema.contents).set({ campaignId, updatedAt: new Date() }).where(eq(schema.contents.id, contentId))
    return { ok: true, content: toContentDTO({ ...content, campaignId }) }
  })
}