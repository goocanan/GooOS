import type { FastifyInstance } from 'fastify'
import { requireSession, requireRole, requireReviewer } from '../plugins/context'
import { z } from 'zod'
import { and, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { db, schema } from '../db/client'
import { ApiError } from '../lib/errors'
import { id, hexFromString } from '../lib/ids'
import { parse, toArray } from '../lib/validate'
import { logActivity } from '../lib/activity'
import { notifyReviewers, notify } from '../lib/notifications'
import {
  toAnalyticsDTO,
  toCommentDTO,
  toContentDTO,
  toScriptDTO,
} from '../lib/serialize'
import {
  buildContentWhere,
  countContents,
  getContentOr404,
  loadContents,
  nextContentRef,
  type ContentFilter,
  type ContentSort,
} from './_content-query'
import {
  approvalSchema,
  bulkActionSchema,
  calendarQuery,
  createCommentSchema,
  createContentSchema,
  createScriptSchema,
  listContentQuery,
  moveContentSchema,
  scheduleSchema,
  updateCommentSchema,
  updateContentSchema,
  updateScriptSchema,
} from '@gooos/shared/schemas'
import { PLATFORM_IDS } from '@gooos/shared/enums'
import type { Role } from '@gooos/shared/enums'

/**
 * Content CRUD, board transitions, calendar scheduling, comments, approvals,
 * scripts and analytics - PRD sections 8-20 and 25-30.
 */

const MANAGERS: Role[] = ['owner', 'admin', 'manager']

export async function registerContentRoutes(app: FastifyInstance) {
  // -------------------------------------------------------------------------
  // List + filters (PRD section 8)
  // -------------------------------------------------------------------------
  app.get('/api/content', async (request) => {
    const actor = await requireSession(request)
    const query = parse(listContentQuery, request.query ?? {})

    const filter: ContentFilter = {
      workspaceId: actor.workspaceId,
      q: query.q,
      status: toArray(query.status),
      platform: toArray(query.platform),
      brandId: toArray(query.brandId),
      campaignId: toArray(query.campaignId),
      creatorId: toArray(query.creatorId),
      priority: toArray(query.priority),
      archived: query.archived,
    }

    const where = buildContentWhere(filter)
    const [total, rows] = await Promise.all([
      countContents(where),
      loadContents(
        actor.workspaceId,
        where,
        query.sort as ContentSort,
        query.limit,
        query.offset,
      ),
    ])

    // Creators and clients only see their own work unless they manage.
    const visible = MANAGERS.includes(actor.role)
      ? rows
      : rows.filter(
          (c) =>
            c.creatorId === actor.userId ||
            c.ownerId === actor.userId ||
            c.reviewerId === actor.userId,
        )

    return {
      data: visible,
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + query.limit < total,
    }
  })

  // -------------------------------------------------------------------------
  // Kanban counts (PRD section 11)
  // -------------------------------------------------------------------------
  app.get('/api/content/board', async (request) => {
    const actor = await requireSession(request)
    const rows = await db()
      .select({ status: schema.contents.status, count: sql<number>`count(*)::int` })
      .from(schema.contents)
      .where(eq(schema.contents.workspaceId, actor.workspaceId))
      .groupBy(schema.contents.status)

    const map = new Map(rows.map((r) => [r.status, r.count]))
    return {
      counts: [...map].map(([status, count]) => ({ status, count })),
    }
  })

  // -------------------------------------------------------------------------
  // Calendar feed (PRD section 12)
  // -------------------------------------------------------------------------
  app.get('/api/content/calendar', async (request) => {
    const actor = await requireSession(request)
    const query = parse(calendarQuery, request.query ?? {})
    const statuses = toArray(query.status)
    const platforms = toArray(query.platform)

    const events = await db()
      .select({
        contentId: schema.contentPlatforms.contentId,
        platform: schema.contentPlatforms.platform,
        scheduledAt: schema.contentPlatforms.scheduledAt,
        publishedAt: schema.contentPlatforms.publishedAt,
        status: schema.contents.status,
      })
      .from(schema.contentPlatforms)
      .innerJoin(schema.contents, eq(schema.contents.id, schema.contentPlatforms.contentId))
      .where(
        and(
          eq(schema.contents.workspaceId, actor.workspaceId),
          gteDate(schema.contentPlatforms.scheduledAt, query.from),
          lteDate(schema.contentPlatforms.scheduledAt, query.to),
        ),
      )

    const filtered = events.filter(
      (e) =>
        (!statuses.length || statuses.includes(e.status as never)) &&
        (!platforms.length || platforms.includes(e.platform as never)) &&
        (!query.campaignId || true),
    )
    if (!filtered.length) return { data: [] }

    const ids = [...new Set(filtered.map((e) => e.contentId))]
    const contents = await loadContents(
      actor.workspaceId,
      inArray(schema.contents.id, ids),
      'deadline',
      500,
    )
    const byId = new Map(contents.map((c) => [c.id, c]))

    return {
      data: filtered
        .filter((e) => byId.has(e.contentId))
        .map((e) => ({
          contentId: e.contentId,
          platform: e.platform,
          scheduledAt: e.scheduledAt,
          publishedAt: e.publishedAt,
          content: byId.get(e.contentId)!,
        })),
    }
  })

  // -------------------------------------------------------------------------
  // Detail with every relation (PRD section 8)
  // -------------------------------------------------------------------------
  app.get('/api/content/:id', async (request) => {
    const actor = await requireSession(request)
    const { id: contentId } = request.params as { id: string }

    const row = await getContentOr404(actor.workspaceId, contentId)
    assertCanView(actor, row)

    const [platforms, comments, approvals, analytics, versions, scriptRows, assetLinks] =
      await Promise.all([
        db().select().from(schema.contentPlatforms).where(eq(schema.contentPlatforms.contentId, contentId)),
        db()
          .select()
          .from(schema.comments)
          .where(eq(schema.comments.contentId, contentId))
          .orderBy(sql`${schema.comments.createdAt} DESC`),
        db()
          .select()
          .from(schema.approvals)
          .where(eq(schema.approvals.contentId, contentId))
          .orderBy(sql`${schema.approvals.createdAt} DESC`),
        db().select().from(schema.analytics).where(eq(schema.analytics.contentId, contentId)),
        db()
          .select()
          .from(schema.contentVersions)
          .where(eq(schema.contentVersions.contentId, contentId))
          .orderBy(sql`${schema.contentVersions.version} DESC`),
        db().select().from(schema.scripts).where(eq(schema.scripts.contentId, contentId)),
        db().select().from(schema.contentAssets).where(eq(schema.contentAssets.contentId, contentId)),
      ])

    const assets = assetLinks.length
      ? await db()
          .select()
          .from(schema.assets)
          .where(inArray(schema.assets.id, assetLinks.map((a) => a.assetId)))
      : []

    return {
      content: toContentDTO(row, {
        platforms,
        assetIds: assetLinks.map((a) => a.assetId),
        scriptId: scriptRows[0]?.id ?? null,
      }),
      comments: comments.map(toCommentDTO),
      approvals: approvals.map((a) => ({
        id: a.id,
        contentId: a.contentId,
        reviewerId: a.reviewerId,
        decision: a.decision,
        note: a.note,
        timestampSec: a.timestampSec,
        createdAt: a.createdAt.toISOString(),
      })),
      analytics: analytics.map(toAnalyticsDTO),
      versions: versions.map((v) => ({
        id: v.id,
        version: v.version,
        title: v.title,
        createdBy: v.createdBy,
        createdAt: v.createdAt.toISOString(),
      })),
      script: scriptRows[0] ? toScriptDTO(scriptRows[0]) : null,
      assets,
    }
  })

  // -------------------------------------------------------------------------
  // Create (PRD section 8)
  // -------------------------------------------------------------------------
  app.post('/api/content', async (request, reply) => {
    const actor = await requireSession(request)
    const body = parse(createContentSchema, request.body)

    const contentId = id('ct')
    const brandId = await resolveBrand(actor.workspaceId, body.brandId)
    const ref = await nextContentRef(actor.workspaceId)
    const now = new Date()

    const variants = body.platforms.length
      ? body.platforms
      : [{ platform: body.type, caption: '', hashtags: [], mediaAssetIds: [], scheduledAt: undefined, publishedAt: undefined }]

    await db().transaction(async (tx) => {
      await tx.insert(schema.contents).values({
        id: contentId,
        ref,
        workspaceId: actor.workspaceId,
        brandId,
        campaignId: body.campaignId ?? null,
        title: body.title,
        description: body.description,
        type: body.type,
        status: body.status,
        priority: body.priority,
        ownerId: actor.userId,
        creatorId: body.creatorId ?? actor.userId,
        reviewerId: body.reviewerId ?? null,
        tags: body.tags,
        deadline: body.deadline ?? null,
        dueDate: body.deadline ?? null,
        thumbnailColor: body.thumbnailColor ?? hexFromString(contentId),
        cta: body.cta,
        notes: body.notes,
        brief: body.brief,
        productionProgress: body.productionProgress,
        ideaSource: body.ideaSource ?? null,
        createdAt: now,
        updatedAt: now,
      })

      for (const p of variants) {
        await tx.insert(schema.contentPlatforms).values({
          id: id('cp'),
          contentId,
          platform: p.platform,
          caption: p.caption,
          hashtags: p.hashtags,
          scheduledAt: p.scheduledAt ?? null,
          publishedAt: p.publishedAt ?? null,
          primaryDate: p.scheduledAt ?? p.publishedAt ?? null,
          createdAt: now,
          updatedAt: now,
        })
      }

      await tx
        .update(schema.workspaces)
        .set({ contentUsage: sql`${schema.workspaces.contentUsage} + 1`, updatedAt: now })
        .where(eq(schema.workspaces.id, actor.workspaceId))
    })

    await logActivity({
      workspaceId: actor.workspaceId,
      actorId: actor.userId,
      verb: `created Content #${ref}`,
      target: `Content #${ref}`,
      targetId: contentId,
      kind: 'create',
    })

    reply.status(201)
    const created = await getContentOr404(actor.workspaceId, contentId)
    const createdPlatforms = await db()
      .select()
      .from(schema.contentPlatforms)
      .where(eq(schema.contentPlatforms.contentId, contentId))
    return { content: toContentDTO(created, { platforms: createdPlatforms }) }
  })

  // -------------------------------------------------------------------------
  // Update - snapshots the previous state for version history (PRD section 18)
  // -------------------------------------------------------------------------
  app.patch('/api/content/:id', async (request) => {
    const actor = await requireSession(request)
    const { id: contentId } = request.params as { id: string }
    const body = parse(updateContentSchema, request.body)

    const current = await getContentOr404(actor.workspaceId, contentId)
    assertCanEdit(actor, current)
    const now = new Date()

    await db().transaction(async (tx) => {
      await tx.insert(schema.contentVersions).values({
        id: id('cv'),
        contentId,
        version: current.version,
        title: current.title,
        snapshot: { ...current, createdAt: undefined, updatedAt: undefined },
        createdBy: actor.userId,
        createdAt: now,
      })

      await tx
        .update(schema.contents)
        .set({
          ...body,
          brief: body.brief ? { ...current.brief, ...body.brief } : undefined,
          version: current.version + 1,
          updatedAt: now,
        })
        .where(eq(schema.contents.id, contentId))

      if (body.platforms) {
        await tx
          .delete(schema.contentPlatforms)
          .where(eq(schema.contentPlatforms.contentId, contentId))
        for (const p of body.platforms) {
          await tx.insert(schema.contentPlatforms).values({
            id: id('cp'),
            contentId,
            platform: p.platform,
            caption: p.caption,
            hashtags: p.hashtags,
            scheduledAt: p.scheduledAt ?? null,
            publishedAt: p.publishedAt ?? null,
            primaryDate: p.scheduledAt ?? p.publishedAt ?? null,
            createdAt: now,
            updatedAt: now,
          })
        }
      }
    })

    await logActivity({
      workspaceId: actor.workspaceId,
      actorId: actor.userId,
      verb: `updated Content #${current.ref}`,
      target: `Content #${current.ref}`,
      targetId: contentId,
      kind: 'edit',
    })

    const updated = await getContentOr404(actor.workspaceId, contentId)
    const updatedPlatforms = await db()
      .select()
      .from(schema.contentPlatforms)
      .where(eq(schema.contentPlatforms.contentId, contentId))
    return { content: toContentDTO(updated, { platforms: updatedPlatforms }) }
  })

  // -------------------------------------------------------------------------
  // Board drag & drop (PRD section 11)
  // -------------------------------------------------------------------------
  app.post('/api/content/:id/move', async (request) => {
    const actor = await requireSession(request)
    const { id: contentId } = request.params as { id: string }
    const body = parse(moveContentSchema, request.body)

    const current = await getContentOr404(actor.workspaceId, contentId)
    assertCanEdit(actor, current)
    if (current.status === body.status) {
      const platforms = await db()
        .select()
        .from(schema.contentPlatforms)
        .where(eq(schema.contentPlatforms.contentId, contentId))
      return { content: toContentDTO(current, { platforms }) }
    }

    const now = new Date()
    const platforms = await db()
      .select()
      .from(schema.contentPlatforms)
      .where(eq(schema.contentPlatforms.contentId, contentId))

    await db().transaction(async (tx) => {
      await tx
        .update(schema.contents)
        .set({
          status: body.status,
          productionProgress: body.productionProgress,
          updatedAt: now,
        })
        .where(eq(schema.contents.id, contentId))

      if (body.status === 'published') {
        for (const p of platforms) {
          await tx
            .update(schema.contentPlatforms)
            .set({ publishedAt: now, updatedAt: now })
            .where(eq(schema.contentPlatforms.id, p.id))
        }
        await tx
          .update(schema.scheduledPosts)
          .set({ status: 'published', publishedAt: now, updatedAt: now })
          .where(eq(schema.scheduledPosts.contentId, contentId))
      }

      if (body.status === 'scheduled' && platforms.every((p) => !p.scheduledAt) && platforms[0]) {
        const when = new Date(Date.now() + 86400000)
        await tx
          .update(schema.contentPlatforms)
          .set({ scheduledAt: when, primaryDate: when, updatedAt: now })
          .where(eq(schema.contentPlatforms.id, platforms[0].id))
      }
    })

    await logActivity({
      workspaceId: actor.workspaceId,
      actorId: actor.userId,
      verb: `moved Content #${current.ref} to ${body.status}`,
      target: `Content #${current.ref}`,
      targetId: contentId,
      kind: 'edit',
    })

    if (body.status === 'review') {
      await notifyReviewers({
        workspaceId: actor.workspaceId,
        contentId,
        ref: current.ref,
        title: current.title,
        actorId: actor.userId,
        reviewerId: current.reviewerId,
      })
    }

    if (body.status === 'published') {
      await notify({
        workspaceId: actor.workspaceId,
        userId: current.creatorId,
        kind: 'publish',
        title: 'Content berhasil dipublikasikan',
        body: current.title,
        href: `/content/${contentId}`,
      })
      await logActivity({
        workspaceId: actor.workspaceId,
        actorId: actor.userId,
        verb: `published Content #${current.ref}`,
        target: `Content #${current.ref}`,
        targetId: contentId,
        kind: 'publish',
      })
    }

    const updated = await getContentOr404(actor.workspaceId, contentId)
    const updatedPlatforms = await db()
      .select()
      .from(schema.contentPlatforms)
      .where(eq(schema.contentPlatforms.contentId, contentId))
    return { content: toContentDTO(updated, { platforms: updatedPlatforms }) }
  })

  // -------------------------------------------------------------------------
  // Delete / duplicate / bulk actions (PRD section 11)
  // -------------------------------------------------------------------------
  app.delete('/api/content/:id', async (request) => {
    const actor = await requireRole('manager')(request)
    const { id: contentId } = request.params as { id: string }
    const current = await getContentOr404(actor.workspaceId, contentId)

    await db().transaction(async (tx) => {
      await tx.delete(schema.contents).where(eq(schema.contents.id, contentId))
      await tx
        .update(schema.workspaces)
        .set({ contentUsage: sql`GREATEST(0, ${schema.workspaces.contentUsage} - 1)` })
        .where(eq(schema.workspaces.id, actor.workspaceId))
    })

    await logActivity({
      workspaceId: actor.workspaceId,
      actorId: actor.userId,
      verb: `deleted Content #${current.ref}`,
      target: `Content #${current.ref}`,
      targetId: contentId,
      kind: 'delete',
    })
    return { ok: true }
  })

  app.post('/api/content/:id/duplicate', async (request) => {
    const actor = await requireSession(request)
    const { id: contentId } = request.params as { id: string }
    const current = await getContentOr404(actor.workspaceId, contentId)
    const platforms = await db()
      .select()
      .from(schema.contentPlatforms)
      .where(eq(schema.contentPlatforms.contentId, contentId))

    const copyId = id('ct')
    const ref = await nextContentRef(actor.workspaceId)
    const now = new Date()

    await db().insert(schema.contents).values({
      id: copyId,
      ref,
      workspaceId: actor.workspaceId,
      brandId: current.brandId,
      campaignId: current.campaignId,
      title: `${current.title} (copy)`,
      description: current.description,
      type: current.type,
      status: 'idea',
      priority: current.priority,
      ownerId: current.ownerId,
      creatorId: current.creatorId,
      reviewerId: current.reviewerId,
      tags: current.tags,
      deadline: current.deadline,
      dueDate: current.dueDate,
      thumbnailColor: current.thumbnailColor,
      cta: current.cta,
      notes: current.notes,
      brief: current.brief,
      productionProgress: 0,
      ideaSource: current.ideaSource,
      version: 1,
      createdAt: now,
      updatedAt: now,
    })

    for (const p of platforms) {
      await db().insert(schema.contentPlatforms).values({
        id: id('cp'),
        contentId: copyId,
        platform: p.platform,
        caption: p.caption,
        hashtags: p.hashtags,
        createdAt: now,
        updatedAt: now,
      })
    }

    const copy = await getContentOr404(actor.workspaceId, copyId)
    const copyPlatforms = await db()
      .select()
      .from(schema.contentPlatforms)
      .where(eq(schema.contentPlatforms.contentId, copyId))
    return { content: toContentDTO(copy, { platforms: copyPlatforms }) }
  })

  app.post('/api/content/bulk', async (request) => {
    const actor = await requireRole('manager')(request)
    const body = parse(bulkActionSchema, request.body)
    const now = new Date()
    let affected = 0

    await db().transaction(async (tx) => {
      for (const contentId of body.ids) {
        const owned = await tx.query.contents.findFirst({
          where: and(
            eq(schema.contents.id, contentId),
            eq(schema.contents.workspaceId, actor.workspaceId),
          ),
        })
        if (!owned) continue
        affected++

        if (body.action === 'delete') {
          await tx.delete(schema.contents).where(eq(schema.contents.id, contentId))
        } else if (body.action === 'archive') {
          await tx.update(schema.contents).set({ status: 'archived', updatedAt: now }).where(eq(schema.contents.id, contentId))
        } else if (body.action === 'move' && body.status) {
          await tx.update(schema.contents).set({ status: body.status, updatedAt: now }).where(eq(schema.contents.id, contentId))
        } else if (body.action === 'assign' && body.creatorId) {
          await tx.update(schema.contents).set({ creatorId: body.creatorId, updatedAt: now }).where(eq(schema.contents.id, contentId))
        } else if (body.action === 'campaign' && body.campaignId) {
          await tx.update(schema.contents).set({ campaignId: body.campaignId, updatedAt: now }).where(eq(schema.contents.id, contentId))
        } else if (body.action === 'tag' && body.tags?.length) {
          // Merge, don't replace.
          const merged = [...new Set([...owned.tags, ...body.tags])]
          await tx.update(schema.contents).set({ tags: merged, updatedAt: now }).where(eq(schema.contents.id, contentId))
        }
      }
    })

    await logActivity({
      workspaceId: actor.workspaceId,
      actorId: actor.userId,
      verb: `ran bulk ${body.action} on ${affected} content`,
      target: 'Content',
      kind: 'edit',
    })
    return { ok: true, affected }
  })

  // -------------------------------------------------------------------------
  // Schedule + copy & publish payload (PRD sections 25-26)
  // -------------------------------------------------------------------------
  app.post('/api/content/:id/schedule', async (request) => {
    const actor = await requireRole('manager')(request)
    const { id: contentId } = request.params as { id: string }
    const body = parse(scheduleSchema, request.body)

    const current = await getContentOr404(actor.workspaceId, contentId)
    const platforms = await db()
      .select()
      .from(schema.contentPlatforms)
      .where(eq(schema.contentPlatforms.contentId, contentId))

    const target = body.platform
      ? platforms.find((p) => p.platform === body.platform)
      : platforms[0]
    if (!target) throw ApiError.badRequest('This content has no platform variant to schedule')

    const when = body.scheduledAt
    const now = new Date()

    await db().transaction(async (tx) => {
      await tx
        .update(schema.contentPlatforms)
        .set({ scheduledAt: when, primaryDate: when, updatedAt: now })
        .where(eq(schema.contentPlatforms.id, target.id))

      await tx
        .update(schema.contents)
        .set({ status: 'scheduled', updatedAt: now })
        .where(eq(schema.contents.id, contentId))

      await tx
        .insert(schema.scheduledPosts)
        .values({
          id: id('sp'),
          contentId,
          platformId: target.platform,
          scheduledAt: when,
          timezone: body.timezone,
          status: 'scheduled',
          mode: body.mode,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [schema.scheduledPosts.contentId, schema.scheduledPosts.platformId],
          set: {
            scheduledAt: when,
            timezone: body.timezone,
            status: 'scheduled',
            updatedAt: now,
          },
        })
    })

    await logActivity({
      workspaceId: actor.workspaceId,
      actorId: actor.userId,
      verb: `scheduled Content #${current.ref}`,
      target: `Content #${current.ref}`,
      targetId: contentId,
      kind: 'edit',
    })

    const updated = await getContentOr404(actor.workspaceId, contentId)
    const updatedPlatforms = await db()
      .select()
      .from(schema.contentPlatforms)
      .where(eq(schema.contentPlatforms.contentId, contentId))

    return {
      content: toContentDTO(updated, { platforms: updatedPlatforms }),
      copyPayload: {
        platform: target.platform,
        scheduledAt: when.toISOString(),
        timezone: body.timezone,
        title: current.title,
        caption: target.caption,
        hashtags: target.hashtags,
        instructions:
          'Platform API belum terhubung. Salin payload ini ke aplikasi platform, atau hubungkan API di Settings > Platforms.',
      },
    }
  })

  // -------------------------------------------------------------------------
  // Comments with video timestamps (PRD section 20)
  // -------------------------------------------------------------------------
  app.post('/api/content/:id/comments', async (request, reply) => {
    const actor = await requireSession(request)
    const { id: contentId } = request.params as { id: string }
    const body = parse(createCommentSchema, request.body)
    const current = await getContentOr404(actor.workspaceId, contentId)

    const commentId = id('cm')
    await db().insert(schema.comments).values({
      id: commentId,
      contentId,
      authorId: actor.userId,
      body: body.body,
      timestampSec: body.timestampSec ?? null,
      kind: body.kind,
      resolved: false,
    })

    await logActivity({
      workspaceId: actor.workspaceId,
      actorId: actor.userId,
      verb:
        body.kind === 'change_request'
          ? `requested changes on Content #${current.ref}`
          : `commented on Content #${current.ref}`,
      target: `Content #${current.ref}`,
      targetId: contentId,
      kind: 'review',
    })

    if (body.kind === 'change_request') {
      // A change request sends the content back to production automatically.
      await db()
        .update(schema.contents)
        .set({ status: 'production', updatedAt: new Date() })
        .where(eq(schema.contents.id, contentId))
      await notify({
        workspaceId: actor.workspaceId,
        userId: current.creatorId,
        kind: 'approval',
        title: `Changes requested on #${current.ref}`,
        body: body.body.slice(0, 120),
        href: `/content/${contentId}`,
      })
    }

    reply.status(201)
    const row = await db().query.comments.findFirst({ where: eq(schema.comments.id, commentId) })
    return { comment: toCommentDTO(row!) }
  })

  app.patch('/api/comments/:id', async (request) => {
    const actor = await requireSession(request)
    const { id: commentId } = request.params as { id: string }
    const body = parse(updateCommentSchema, request.body)

    const comment = await db().query.comments.findFirst({ where: eq(schema.comments.id, commentId) })
    if (!comment) throw ApiError.notFound('Comment')

    const content = await getContentOr404(actor.workspaceId, comment.contentId)
    assertCanView(actor, content)

    await db()
      .update(schema.comments)
      .set({ resolved: body.resolved ?? comment.resolved, body: body.body ?? comment.body })
      .where(eq(schema.comments.id, commentId))

    const row = await db().query.comments.findFirst({ where: eq(schema.comments.id, commentId) })
    return { comment: toCommentDTO(row!) }
  })

  // -------------------------------------------------------------------------
  // Approvals (PRD section 19)
  // -------------------------------------------------------------------------
  app.post('/api/content/:id/approve', async (request) => {
    const actor = await requireReviewer()(request)
    const { id: contentId } = request.params as { id: string }
    const body = parse(approvalSchema, request.body)
    const current = await getContentOr404(actor.workspaceId, contentId)

    const nextStatus =
      body.decision === 'approved' ? 'approved' : body.decision === 'rejected' ? 'archived' : 'production'
    const now = new Date()

    await db().transaction(async (tx) => {
      await tx.insert(schema.approvals).values({
        id: id('ap'),
        contentId,
        reviewerId: actor.userId,
        decision: body.decision,
        note: body.note ?? null,
        timestampSec: body.timestampSec ?? null,
        createdAt: now,
      })
      await tx.insert(schema.comments).values({
        id: id('cm'),
        contentId,
        authorId: actor.userId,
        body: body.note ?? (body.decision === 'approved' ? 'Approved.' : 'Changes requested.'),
        kind: body.decision === 'approved' ? 'approval' : 'change_request',
        timestampSec: body.timestampSec ?? null,
        resolved: body.decision === 'approved',
        createdAt: now,
      })
      await tx
        .update(schema.contents)
        .set({ status: nextStatus, updatedAt: now })
        .where(eq(schema.contents.id, contentId))
    })

    await logActivity({
      workspaceId: actor.workspaceId,
      actorId: actor.userId,
      verb: `${body.decision === 'approved' ? 'approved' : 'requested changes on'} Content #${current.ref}`,
      target: `Content #${current.ref}`,
      targetId: contentId,
      kind: 'review',
    })

    if (body.decision !== 'approved') {
      await notify({
        workspaceId: actor.workspaceId,
        userId: current.creatorId,
        kind: 'approval',
        title: `Changes requested on #${current.ref}`,
        body: body.note ?? current.title,
        href: `/content/${contentId}`,
      })
    }

    const updated = await getContentOr404(actor.workspaceId, contentId)
    const platforms = await db()
      .select()
      .from(schema.contentPlatforms)
      .where(eq(schema.contentPlatforms.contentId, contentId))
    return { content: toContentDTO(updated, { platforms }), decision: body.decision }
  })

  // -------------------------------------------------------------------------
  // Scripts (PRD section 15)
  // -------------------------------------------------------------------------
  app.get('/api/scripts', async (request) => {
    const actor = await requireSession(request)
    const rows = await db().query.scripts.findMany({
      where: eq(schema.scripts.workspaceId, actor.workspaceId),
      orderBy: sql`${schema.scripts.updatedAt} DESC`,
    })
    return { data: rows.map(toScriptDTO) }
  })

  app.post('/api/scripts', async (request, reply) => {
    const actor = await requireSession(request)
    const body = parse(createScriptSchema, request.body)
    await getContentOr404(actor.workspaceId, body.contentId)

    const scriptId = id('sc')
    const now = new Date()

    await db().transaction(async (tx) => {
      await tx.insert(schema.scripts).values({
        id: scriptId,
        workspaceId: actor.workspaceId,
        contentId: body.contentId,
        title: body.title,
        version: 1,
        blocks: body.blocks,
        createdAt: now,
        updatedAt: now,
      })
      await tx.insert(schema.scriptVersions).values({
        id: id('sv'),
        scriptId,
        version: 1,
        blocks: body.blocks,
        createdBy: actor.userId,
        createdAt: now,
      })
    })

    reply.status(201)
    const row = await db().query.scripts.findFirst({ where: eq(schema.scripts.id, scriptId) })
    return { script: toScriptDTO(row!) }
  })

  app.patch('/api/scripts/:id', async (request) => {
    const actor = await requireSession(request)
    const { id: scriptId } = request.params as { id: string }
    const body = parse(updateScriptSchema, request.body)

    const script = await db().query.scripts.findFirst({
      where: and(eq(schema.scripts.id, scriptId), eq(schema.scripts.workspaceId, actor.workspaceId)),
    })
    if (!script) throw ApiError.notFound('Script')

    const nextVersion = body.bumpVersion ? script.version + 1 : script.version
    const now = new Date()

    await db().transaction(async (tx) => {
      await tx
        .update(schema.scripts)
        .set({
          title: body.title ?? script.title,
          blocks: body.blocks ?? script.blocks,
          version: nextVersion,
          updatedAt: now,
        })
        .where(eq(schema.scripts.id, scriptId))
      if (body.bumpVersion) {
        await tx.insert(schema.scriptVersions).values({
          id: id('sv'),
          scriptId,
          version: nextVersion,
          blocks: (body.blocks ?? script.blocks) as never,
          createdBy: actor.userId,
          createdAt: now,
        })
      }
    })

    const row = await db().query.scripts.findFirst({ where: eq(schema.scripts.id, scriptId) })
    return { script: toScriptDTO(row!) }
  })

  // -------------------------------------------------------------------------
  // Analytics input (PRD section 29, manual metrics during MVP)
  // -------------------------------------------------------------------------
  app.get('/api/analytics', async (request) => {
    const actor = await requireSession(request)
    const q = request.query as { from?: string; to?: string; contentId?: string }
    const clauses: (SQL | undefined)[] = [eq(schema.analytics.workspaceId, actor.workspaceId)]
    if (q.from) clauses.push(sql`${schema.analytics.capturedAt} >= ${new Date(q.from)}`)
    if (q.to) clauses.push(sql`${schema.analytics.capturedAt} <= ${new Date(q.to)}`)
    if (q.contentId) clauses.push(eq(schema.analytics.contentId, q.contentId))

    const rows = await db()
      .select()
      .from(schema.analytics)
      .where(and(...(clauses.filter(Boolean) as SQL[])))
      .orderBy(sql`${schema.analytics.capturedAt} DESC`)
    return { data: rows.map(toAnalyticsDTO) }
  })

  app.put('/api/content/:id/analytics', async (request) => {
    const actor = await requireRole('manager')(request)
    const { id: contentId } = request.params as { id: string }
    const body = parse(
      z.object({
        rows: z
          .array(
            z.object({
              platform: z.enum(PLATFORM_IDS),
              views: z.number().int().nonnegative(),
              likes: z.number().int().nonnegative(),
              comments: z.number().int().nonnegative(),
              shares: z.number().int().nonnegative(),
              saves: z.number().int().nonnegative(),
              watchTimeMin: z.number().nonnegative(),
              ctr: z.number().min(0).max(1),
              followersGained: z.number().int().nonnegative(),
            }),
          )
          .min(1)
          .max(20),
      }),
      request.body,
    )

    await getContentOr404(actor.workspaceId, contentId)
    const now = new Date()

    await db().transaction(async (tx) => {
      for (const r of body.rows) {
        const existing = await tx.query.analytics.findFirst({
          where: and(
            eq(schema.analytics.contentId, contentId),
            eq(schema.analytics.platform, r.platform),
          ),
        })
        if (existing) {
          await tx
            .update(schema.analytics)
            .set({ ...r, capturedAt: now, updatedAt: now })
            .where(eq(schema.analytics.id, existing.id))
        } else {
          await tx.insert(schema.analytics).values({
            id: id('an'),
            workspaceId: actor.workspaceId,
            contentId,
            ...r,
            capturedAt: now,
            createdAt: now,
            updatedAt: now,
          })
        }
      }
    })

    const rows = await db()
      .select()
      .from(schema.analytics)
      .where(eq(schema.analytics.contentId, contentId))
    return { data: rows.map(toAnalyticsDTO) }
  })
}

// ---------------------------------------------------------------------------
// Access helpers
// ---------------------------------------------------------------------------

function gteDate(column: unknown, value: Date) {
  return sql`${column} >= ${value}`
}
function lteDate(column: unknown, value: Date) {
  return sql`${column} <= ${value}`
}

type Actorish = { role: Role; userId: string }
type Contentish = { creatorId: string; ownerId: string; reviewerId: string | null }

function assertCanView(actor: Actorish, content: Contentish) {
  if (MANAGERS.includes(actor.role)) return
  if (
    content.creatorId === actor.userId ||
    content.ownerId === actor.userId ||
    content.reviewerId === actor.userId
  ) {
    return
  }
  throw ApiError.forbidden('You do not have access to this content')
}

function assertCanEdit(actor: Actorish, content: Contentish) {
  if (MANAGERS.includes(actor.role)) return
  if (content.creatorId === actor.userId || content.ownerId === actor.userId) return
  throw ApiError.forbidden('You cannot edit this content')
}

async function resolveBrand(workspaceId: string, brandId?: string) {
  if (brandId) {
    const brand = await db().query.brands.findFirst({
      where: and(eq(schema.brands.id, brandId), eq(schema.brands.workspaceId, workspaceId)),
    })
    if (brand) return brandId
  }
  const fallback = await db().query.brands.findFirst({
    where: eq(schema.brands.workspaceId, workspaceId),
  })
  if (!fallback) throw ApiError.badRequest('Workspace has no brand yet - create one first')
  return fallback.id
}