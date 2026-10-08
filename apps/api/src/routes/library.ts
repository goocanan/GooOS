import type { FastifyInstance } from 'fastify'
import { requireSession, requireRole } from '../plugins/context'
import { z } from 'zod'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { db, schema } from '../db/client'
import { ApiError } from '../lib/errors'
import { id, hexFromString } from '../lib/ids'
import { parse } from '../lib/validate'
import { logActivity } from '../lib/activity'
import { toAssetDTO, toIdeaDTO, toHashtagDTO } from '../lib/serialize'
import { buildKey, kindFor, mimeFor, storage } from '../lib/storage'
import {
  assetQuery,
  convertIdeaSchema,
  createFolderSchema,
  createHashtagSchema,
  createIdeaSchema,
  updateAssetSchema,
} from '@gooos/shared/schemas'

/** Asset library, idea board and hashtag database - PRD sections 13, 16, 22. */

export async function registerAssetRoutes(app: FastifyInstance) {
  // -------------------------------------------------------------------------
  // List with folder tree (PRD section 16)
  // -------------------------------------------------------------------------
  app.get('/api/assets', async (request) => {
    const actor = await requireSession(request)
    const query = parse(assetQuery, request.query ?? {})

    const clauses = [eq(schema.assets.workspaceId, actor.workspaceId)]
    if (query.folder && query.folder !== 'all') clauses.push(eq(schema.assets.folder, query.folder))
    if (query.kind) {
      const kinds = Array.isArray(query.kind) ? query.kind : [query.kind]
      clauses.push(inArray(schema.assets.kind, kinds as never[]))
    }
    if (query.brandId) clauses.push(eq(schema.assets.brandId, query.brandId))
    if (query.campaignId) clauses.push(eq(schema.assets.campaignId, query.campaignId))
    if (query.tag) clauses.push(sql`${query.tag} = ANY(${schema.assets.tags})`)
    if (query.q) {
      const t = `%${query.q.toLowerCase()}%`
      clauses.push(
        sql`(lower(${schema.assets.name}) LIKE ${t} OR lower(${schema.assets.tags}::text) LIKE ${t} OR lower(${schema.assets.folder}) LIKE ${t})`,
      )
    }
    if (query.contentId) {
      clauses.push(
        sql`EXISTS (SELECT 1 FROM ${schema.contentAssets} ca WHERE ca.asset_id = ${schema.assets.id} AND ca.content_id = ${query.contentId})`,
      )
    }

    const where = and(...clauses)
    const orderBy =
      query.sort === 'name'
        ? sql`${schema.assets.name} ASC`
        : query.sort === 'size'
          ? sql`${schema.assets.sizeKb} DESC`
          : sql`${schema.assets.createdAt} DESC`

    const rows = await db()
      .select()
      .from(schema.assets)
      .where(where)
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(query.offset)

    const total = (await db()
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.assets)
      .where(where)) as unknown as { c: number }[]

    // usage links for the "used by" panel
    const links = rows.length
      ? await db()
          .select()
          .from(schema.contentAssets)
          .where(
            inArray(
              schema.contentAssets.assetId,
              rows.map((r) => r.id),
            ),
          )
      : []
    const usage = new Map<string, string[]>()
    for (const l of links) {
      const list = usage.get(l.assetId) ?? []
      list.push(l.contentId)
      usage.set(l.assetId, list)
    }

    // folder rollup
    const folderRows = await db()
      .select({ folder: schema.assets.folder, c: sql<number>`count(*)::int` })
      .from(schema.assets)
      .where(eq(schema.assets.workspaceId, actor.workspaceId))
      .groupBy(schema.assets.folder)

    const palette = ['#e3bf5f', '#38bdf8', '#34d399', '#f472b6', '#a78bfa', '#f59e0b', '#94a3b8', '#d23a67']

    return {
      data: rows.map((r) => toAssetDTO(r, usage.get(r.id) ?? [])),
      total: total[0]?.c ?? 0,
      folders: folderRows
        .sort((a, b) => b.c - a.c)
        .map((f, i) => ({ name: f.folder, count: f.c, color: palette[i % palette.length] })),
    }
  })

  app.get('/api/assets/:id', async (request) => {
    const actor = await requireSession(request)
    const { id: assetId } = request.params as { id: string }
    const row = await db().query.assets.findFirst({
      where: and(eq(schema.assets.id, assetId), eq(schema.assets.workspaceId, actor.workspaceId)),
    })
    if (!row) throw ApiError.notFound('Asset')
    const links = await db()
      .select()
      .from(schema.contentAssets)
      .where(eq(schema.contentAssets.assetId, assetId))
    return { asset: toAssetDTO(row, links.map((l) => l.contentId)) }
  })

  // -------------------------------------------------------------------------
  // Upload (PRD section 16) - multipart, written to local storage
  // -------------------------------------------------------------------------
  app.post('/api/assets/upload', async (request, reply) => {
    const actor = await requireSession(request)
    const parts = request.parts()
    const folderDefault = 'Unsorted'
    const files: {
      id: string
      name: string
      ext: string
      kind: ReturnType<typeof kindFor>
      sizeKb: number
      storageKey: string
      color: string
    }[] = []

    let folder = folderDefault
    const tags: string[] = []
    let brandId: string | null = null
    let campaignId: string | null = null

    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer()
        const ext = (part.filename.split('.').pop() ?? 'bin').toLowerCase()
        const storageKey = buildKey(actor.workspaceId, part.filename)
        await storage.put(storageKey, buffer)

        const assetId = id('as')
        await db().insert(schema.assets).values({
          id: assetId,
          workspaceId: actor.workspaceId,
          folder,
          name: part.filename,
          kind: kindFor(ext),
          ext,
          sizeKb: Math.max(1, Math.round(buffer.byteLength / 1024)),
          uploadedBy: actor.userId,
          tags,
          brandId,
          campaignId,
          storageKey,
          color: hexFromString(part.filename),
        })
        await db()
          .update(schema.workspaces)
          .set({
            storageUsedKb: sql`${schema.workspaces.storageUsedKb} + ${Math.max(1, Math.round(buffer.byteLength / 1024))}`,
          })
          .where(eq(schema.workspaces.id, actor.workspaceId))

        files.push({
          id: assetId,
          name: part.filename,
          ext,
          kind: kindFor(ext),
          sizeKb: Math.max(1, Math.round(buffer.byteLength / 1024)),
          storageKey,
          color: hexFromString(part.filename),
        })
      } else if (typeof part.value === 'string') {
        if (part.fieldname === 'folder') folder = part.value
        else if (part.fieldname === 'tags') tags.push(...part.value.split(',').map((t) => t.trim()).filter(Boolean))
        else if (part.fieldname === 'brandId') brandId = part.value || null
        else if (part.fieldname === 'campaignId') campaignId = part.value || null
      }
    }

    if (files.length) {
      await logActivity({
        workspaceId: actor.workspaceId,
        actorId: actor.userId,
        verb: `uploaded ${files.length} asset${files.length === 1 ? '' : 's'}`,
        target: 'Asset',
        kind: 'upload',
      })
    }

    reply.status(201)
    const rows = files.length
      ? await db()
          .select()
          .from(schema.assets)
          .where(inArray(schema.assets.id, files.map((f) => f.id)))
      : []
    return { data: rows.map((r) => toAssetDTO(r)) }
  })

  /** Streams a stored file with the right content type. */
  app.get('/api/assets/file/*', async (request, reply) => {
    await requireSession(request)
    const key = (request.params as { '*': string })['*']
    const buffer = await storage.get(key)
    const ext = key.split('.').pop() ?? ''
    reply.header('content-type', mimeFor(ext))
    reply.header('cache-control', 'private, max-age=3600')
    return reply.send(buffer)
  })

  app.patch('/api/assets/:id', async (request) => {
    const actor = await requireSession(request)
    const { id: assetId } = request.params as { id: string }
    const body = parse(updateAssetSchema, request.body)

    const row = await db().query.assets.findFirst({
      where: and(eq(schema.assets.id, assetId), eq(schema.assets.workspaceId, actor.workspaceId)),
    })
    if (!row) throw ApiError.notFound('Asset')

    await db().update(schema.assets).set(body).where(eq(schema.assets.id, assetId))
    const updated = await db().query.assets.findFirst({ where: eq(schema.assets.id, assetId) })
    return { asset: toAssetDTO(updated!) }
  })

  app.delete('/api/assets/:id', async (request) => {
    const actor = await requireSession(request)
    const { id: assetId } = request.params as { id: string }

    const row = await db().query.assets.findFirst({
      where: and(eq(schema.assets.id, assetId), eq(schema.assets.workspaceId, actor.workspaceId)),
    })
    if (!row) throw ApiError.notFound('Asset')

    await storage.delete(row.storageKey)
    await db()
      .update(schema.workspaces)
      .set({
        storageUsedKb: sql`GREATEST(0, ${schema.workspaces.storageUsedKb} - ${row.sizeKb})`,
      })
      .where(eq(schema.workspaces.id, actor.workspaceId))
    await db().delete(schema.assets).where(eq(schema.assets.id, assetId))

    await logActivity({
      workspaceId: actor.workspaceId,
      actorId: actor.userId,
      verb: `deleted asset ${row.name}`,
      target: 'Asset',
      targetId: assetId,
      kind: 'delete',
    })
    return { ok: true }
  })

  app.post('/api/assets/folders', async (request, reply) => {
    const actor = await requireRole('manager')(request)
    const body = parse(createFolderSchema, request.body)
    const folderId = id('af')
    await db()
      .insert(schema.assetFolders)
      .values({ id: folderId, workspaceId: actor.workspaceId, name: body.name, color: body.color ?? null })
      .onConflictDoNothing()
    reply.status(201)
    return { folder: { id: folderId, name: body.name, count: 0 } }
  })

  /** Attaches or detaches an asset to a content row. */
  app.post('/api/assets/:id/attach', async (request) => {
    await requireSession(request)
    const { id: assetId } = request.params as { id: string }
    const { contentId } = parse(z.object({ contentId: z.string().min(1) }), request.body)

    await db()
      .insert(schema.contentAssets)
      .values({ contentId, assetId })
      .onConflictDoNothing()
    return { ok: true }
  })

  app.delete('/api/assets/:id/attach/:contentId', async (request) => {
    await requireSession(request)
    const { id: assetId, contentId } = request.params as { id: string; contentId: string }
    await db()
      .delete(schema.contentAssets)
      .where(and(eq(schema.contentAssets.assetId, assetId), eq(schema.contentAssets.contentId, contentId)))
    return { ok: true }
  })
}

// ---------------------------------------------------------------------------
// Ideas (PRD section 13)
// ---------------------------------------------------------------------------

export async function registerIdeaRoutes(app: FastifyInstance) {
  app.get('/api/ideas', async (request) => {
    const actor = await requireSession(request)
    const rows = await db().query.ideas.findMany({
      where: eq(schema.ideas.workspaceId, actor.workspaceId),
      orderBy: sql`${schema.ideas.votes} DESC`,
    })
    return { data: rows.map(toIdeaDTO) }
  })

  app.post('/api/ideas', async (request, reply) => {
    const actor = await requireSession(request)
    const body = parse(createIdeaSchema, request.body)
    const ideaId = id('id')

    await db().insert(schema.ideas).values({
      id: ideaId,
      workspaceId: actor.workspaceId,
      title: body.title,
      description: body.description,
      reference: body.reference,
      platform: body.platform,
      tags: body.tags,
      priority: body.priority,
      createdBy: actor.userId,
      votes: 1,
    })

    await logActivity({
      workspaceId: actor.workspaceId,
      actorId: actor.userId,
      verb: `created idea "${body.title}"`,
      target: 'Idea',
      targetId: ideaId,
      kind: 'create',
    })

    reply.status(201)
    const row = await db().query.ideas.findFirst({ where: eq(schema.ideas.id, ideaId) })
    return { idea: toIdeaDTO(row!) }
  })

  app.patch('/api/ideas/:id', async (request) => {
    const actor = await requireSession(request)
    const { id: ideaId } = request.params as { id: string }
    const body = parse(
      z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      }),
      request.body,
    )
    await db()
      .update(schema.ideas)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(schema.ideas.id, ideaId), eq(schema.ideas.workspaceId, actor.workspaceId)))
    const row = await db().query.ideas.findFirst({ where: eq(schema.ideas.id, ideaId) })
    if (!row) throw ApiError.notFound('Idea')
    return { idea: toIdeaDTO(row) }
  })

  app.post('/api/ideas/:id/vote', async (request) => {
    const actor = await requireSession(request)
    const { id: ideaId } = request.params as { id: string }
    const { delta } = parse(z.object({ delta: z.number().int().min(-1).max(1) }), request.body ?? { delta: 1 })
    await db()
      .update(schema.ideas)
      .set({ votes: sql`GREATEST(0, ${schema.ideas.votes} + ${delta})` })
      .where(and(eq(schema.ideas.id, ideaId), eq(schema.ideas.workspaceId, actor.workspaceId)))
    const row = await db().query.ideas.findFirst({ where: eq(schema.ideas.id, ideaId) })
    return { idea: toIdeaDTO(row!) }
  })

  app.delete('/api/ideas/:id', async (request) => {
    const actor = await requireSession(request)
    const { id: ideaId } = request.params as { id: string }
    await db()
      .delete(schema.ideas)
      .where(and(eq(schema.ideas.id, ideaId), eq(schema.ideas.workspaceId, actor.workspaceId)))
    return { ok: true }
  })

  /** Idea -> Content conversion (PRD section 13). */
  app.post('/api/ideas/:id/convert', async (request, reply) => {
    const actor = await requireSession(request)
    const { id: ideaId } = request.params as { id: string }
    const body = parse(convertIdeaSchema, request.body ?? {})

    const idea = await db().query.ideas.findFirst({
      where: and(eq(schema.ideas.id, ideaId), eq(schema.ideas.workspaceId, actor.workspaceId)),
    })
    if (!idea) throw ApiError.notFound('Idea')
    if (idea.convertedContentId) {
      throw ApiError.conflict('This idea has already been converted')
    }

    const platform = body.platform ?? idea.platform
    const brand = await db().query.brands.findFirst({
      where: eq(schema.brands.workspaceId, actor.workspaceId),
    })
    if (!brand) throw ApiError.badRequest('Workspace has no brand yet')

    const contentId = id('ct')
    const refRes = (await db()
      .select({ m: sql<number>`coalesce(max(${schema.contents.ref}), 1000)::int` })
      .from(schema.contents)
      .where(eq(schema.contents.workspaceId, actor.workspaceId))) as unknown as { m: number }[]
    const ref = (refRes[0]?.m ?? 1000) + 1
    const now = new Date()

    await db().transaction(async (tx) => {
      await tx.insert(schema.contents).values({
        id: contentId,
        ref,
        workspaceId: actor.workspaceId,
        brandId: brand.id,
        title: idea.title,
        description: idea.description,
        type: platform,
        status: 'idea',
        priority: idea.priority,
        ownerId: actor.userId,
        creatorId: body.assigneeId ?? actor.userId,
        tags: idea.tags,
        deadline: body.deadline ?? new Date(Date.now() + 5 * 86400000),
        dueDate: body.deadline ?? new Date(Date.now() + 5 * 86400000),
        thumbnailColor: hexFromString(contentId),
        notes: `Sumber ide: ${idea.reference || 'quick add'}`,
        brief: {
          objective: 'Awareness',
          audience: brand.audience,
          topic: idea.title,
          hook: '',
          keyMessage: idea.description,
          cta: '',
          reference: idea.reference ? [idea.reference] : [],
          expectedDuration: '30-45 sec',
        },
        productionProgress: 0,
        ideaSource: 'Idea Board',
        createdAt: now,
        updatedAt: now,
      })
      await tx.insert(schema.contentPlatforms).values({
        id: id('cp'),
        contentId,
        platform,
        caption: '',
        hashtags: [],
        createdAt: now,
        updatedAt: now,
      })
      await tx.update(schema.ideas).set({ convertedContentId: contentId, updatedAt: now }).where(eq(schema.ideas.id, ideaId))
      await tx
        .update(schema.workspaces)
        .set({ contentUsage: sql`${schema.workspaces.contentUsage} + 1` })
        .where(eq(schema.workspaces.id, actor.workspaceId))
    })

    await logActivity({
      workspaceId: actor.workspaceId,
      actorId: actor.userId,
      verb: `converted idea into Content #${ref}`,
      target: `Content #${ref}`,
      targetId: contentId,
      kind: 'create',
    })

    reply.status(201)
    return { contentId, ref }
  })
}

// ---------------------------------------------------------------------------
// Hashtags (PRD section 22)
// ---------------------------------------------------------------------------

export async function registerHashtagRoutes(app: FastifyInstance) {
  app.get('/api/hashtags', async (request) => {
    const actor = await requireSession(request)
    const rows = await db().query.hashtags.findMany({
      where: eq(schema.hashtags.workspaceId, actor.workspaceId),
      orderBy: sql`${schema.hashtags.usage} DESC`,
    })
    const groups = await db()
      .select()
      .from(schema.hashtagGroups)
      .where(eq(schema.hashtagGroups.workspaceId, actor.workspaceId))
    const nameById = new Map(groups.map((g) => [g.id, g.name]))
    return { data: rows.map((r) => toHashtagDTO(r, r.groupId ? nameById.get(r.groupId) : null)) }
  })

  app.post('/api/hashtags', async (request, reply) => {
    const actor = await requireRole('manager')(request)
    const body = parse(createHashtagSchema, request.body)
    const hashtagId = id('hs')

    const existing = await db().query.hashtags.findFirst({
      where: and(eq(schema.hashtags.workspaceId, actor.workspaceId), eq(schema.hashtags.tag, body.tag)),
    })
    if (existing) return { hashtag: toHashtagDTO(existing) }

    await db().insert(schema.hashtags).values({
      id: hashtagId,
      workspaceId: actor.workspaceId,
      tag: body.tag,
    })
    reply.status(201)
    const row = await db().query.hashtags.findFirst({ where: eq(schema.hashtags.id, hashtagId) })
    return { hashtag: toHashtagDTO(row!, body.group) }
  })
}