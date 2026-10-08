import type { FastifyInstance } from 'fastify'
import { requireSession } from '../plugins/context'
import { z } from 'zod'
import { and, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { db, schema } from '../db/client'
import { id } from '../lib/ids'
import { parse } from '../lib/validate'
import { generate, creditsFor } from '../services/ai'
import { toAiRunDTO } from '../lib/serialize'
import {
  STATUS_META,
  WORKFLOW_ORDER,
  ACTIVE_STATUSES,
  PRIORITY_META,
  PLATFORM_META,
} from '@gooos/shared/enums'
import type { ContentStatus, PlatformId } from '@gooos/shared/enums'
import type { DashboardDTO, ReportDTO } from '@gooos/shared/types'
import {
  aiGenerateSchema,
  listNotificationsQuery,
  reportQuery,
  searchQuery,
} from '@gooos/shared/schemas'

/**
 * Aggregates and cross-cutting features: dashboard, reports, global search,
 * notifications, AI studio and the activity feed. PRD sections 27-34, 39.
 */

export async function registerAnalyticsRoutes(app: FastifyInstance) {
  // -------------------------------------------------------------------------
  // Dashboard aggregate (PRD section 34)
  // -------------------------------------------------------------------------
  app.get('/api/dashboard', async (request) => {
    const actor = await requireSession(request)
    const { range } = parse(z.object({ range: z.enum(['7', '14', '30', '90']).default('14') }), request.query ?? {})
    const days = Number(range)

    const [statusRows, platformRows, totalViews, weekRows, needsAttention, contentRows] =
      await Promise.all([
        db()
          .select({ status: schema.contents.status, count: sql<number>`count(*)::int` })
          .from(schema.contents)
          .where(eq(schema.contents.workspaceId, actor.workspaceId))
          .groupBy(schema.contents.status),

        db()
          .select({
            platform: schema.analytics.platform,
            views: sql<number>`sum(${schema.analytics.views})::bigint`,
            engagement: sql<number>`sum(${schema.analytics.likes} + ${schema.analytics.comments} + ${schema.analytics.shares} + ${schema.analytics.saves})::bigint`,
            count: sql<number>`count(DISTINCT ${schema.analytics.contentId})::int`,
          })
          .from(schema.analytics)
          .where(eq(schema.analytics.workspaceId, actor.workspaceId))
          .groupBy(schema.analytics.platform),

        db()
          .select({
            views: sql<number>`coalesce(sum(${schema.analytics.views}), 0)::bigint`,
            likes: sql<number>`coalesce(sum(${schema.analytics.likes}), 0)::bigint`,
            comments: sql<number>`coalesce(sum(${schema.analytics.comments}), 0)::bigint`,
            shares: sql<number>`coalesce(sum(${schema.analytics.shares}), 0)::bigint`,
            saves: sql<number>`coalesce(sum(${schema.analytics.saves}), 0)::bigint`,
            followers: sql<number>`coalesce(sum(${schema.analytics.followersGained}), 0)::bigint`,
            watch: sql<number>`coalesce(sum(${schema.analytics.watchTimeMin}), 0)::bigint`,
          })
          .from(schema.analytics)
          .where(eq(schema.analytics.workspaceId, actor.workspaceId)),

        db()
          .select({
            contentId: schema.contents.id,
            ref: schema.contents.ref,
            title: schema.contents.title,
            type: schema.contents.type,
            status: schema.contents.status,
            creatorId: schema.contents.creatorId,
            deadline: schema.contents.deadline,
            platform: schema.contentPlatforms.platform,
            scheduledAt: schema.contentPlatforms.scheduledAt,
            publishedAt: schema.contentPlatforms.publishedAt,
            thumbnailColor: schema.contents.thumbnailColor,
          })
          .from(schema.contents)
          .leftJoin(
            schema.contentPlatforms,
            eq(schema.contentPlatforms.contentId, schema.contents.id),
          )
          .where(eq(schema.contents.workspaceId, actor.workspaceId)),

        db()
          .select({
            id: schema.contents.id,
            ref: schema.contents.ref,
            title: schema.contents.title,
            status: schema.contents.status,
            creatorId: schema.contents.creatorId,
            deadline: schema.contents.deadline,
          })
          .from(schema.contents)
          .where(
            and(
              eq(schema.contents.workspaceId, actor.workspaceId),
              sql`${schema.contents.status} IN ('script','production','editing','review')`,
            ),
          )
          .orderBy(sql`${schema.contents.deadline} ASC NULLS LAST`)
          .limit(8),

        db()
          .select({
            contentId: schema.analytics.contentId,
            platform: schema.analytics.platform,
            views: sql<number>`sum(${schema.analytics.views})::bigint`,
            engagement: sql<number>`sum(${schema.analytics.likes} + ${schema.analytics.comments} + ${schema.analytics.shares} + ${schema.analytics.saves})::bigint`,
          })
          .from(schema.analytics)
          .where(eq(schema.analytics.workspaceId, actor.workspaceId))
          .groupBy(schema.analytics.contentId, schema.analytics.platform),
      ])

    const t = totalViews[0]
    const views = Number(t?.views ?? 0)
    const engagement = Number(t?.likes ?? 0) + Number(t?.comments ?? 0) + Number(t?.shares ?? 0) + Number(t?.saves ?? 0)
    const statusMap = new Map(statusRows.map((r) => [r.status, r.count]))

    // Daily series from the analytics_daily rollup when available.
    const series = await buildSeries(actor.workspaceId, days)

    // Week strip: content with any date in the current week.
    const weekStart = startOfWeek(new Date())
    const weekEnd = addDays(weekStart, 7)
    const weekMap = new Map<string, typeof weekRows>()
    for (const row of weekRows) {
      const ref = row.scheduledAt ?? row.publishedAt ?? null
      if (!ref) continue
      const d = new Date(ref)
      if (d < weekStart || d >= weekEnd) continue
      const key = d.toISOString().slice(0, 10)
      const list = weekMap.get(key) ?? []
      list.push(row)
      weekMap.set(key, list)
    }

    const topContent = contentRows
      .filter((c) => c.views > 0)
      .sort((a, b) => Number(b.views) - Number(a.views))
      .slice(0, 5)

    const hour = new Date().getHours()
    const payload: DashboardDTO = {
      greeting: {
        name: actor.name.split(' ')[0]!,
        period: hour < 11 ? 'pagi' : hour < 15 ? 'siang' : hour < 19 ? 'sore' : 'malam',
      },
      totals: {
        content: [...statusMap.values()].reduce((a, b) => a + b, 0),
        active: ACTIVE_STATUSES.reduce((sum, s) => sum + (statusMap.get(s) ?? 0), 0),
        published: statusMap.get('published') ?? 0,
        archived: statusMap.get('archived') ?? 0,
        ideas: statusMap.get('idea') ?? 0,
        review: statusMap.get('review') ?? 0,
        scheduled: statusMap.get('scheduled') ?? 0,
        views,
        likes: Number(t?.likes ?? 0),
        comments: Number(t?.comments ?? 0),
        shares: Number(t?.shares ?? 0),
        saves: Number(t?.saves ?? 0),
        engagementRate: views ? engagement / views : 0,
        followersGained: Number(t?.followers ?? 0),
        watchTimeMin: Number(t?.watch ?? 0),
      },
      pipeline: WORKFLOW_ORDER.map((status) => ({
        status,
        label: STATUS_META[status].label,
        count: statusMap.get(status) ?? 0,
        color: STATUS_META[status].color,
      })),
      byStatus: [...statusMap].map(([status, count]) => ({
        status: status as ContentStatus,
        count,
      })),
      byPlatform: platformRows.map((r) => ({
        platform: r.platform as PlatformId,
        views: Number(r.views),
        engagementRate: Number(r.views) ? Number(r.engagement) / Number(r.views) : 0,
        contentCount: r.count,
      })),
      series,
      topContent: topContent.map((c) => {
        const totalEng = c.engagement
        return {
          id: c.contentId,
          ref: (c as unknown as { ref: number }).ref ?? 0,
          title: (c as unknown as { title: string }).title ?? '',
          views: Number(c.views),
          engagementRate: Number(c.views) ? Number(totalEng) / Number(c.views) : 0,
          platform: c.platform as PlatformId,
        }
      }),
      needsAttention: needsAttention.map((c) => ({
        id: c.id,
        ref: c.ref,
        title: c.title,
        status: c.status as ContentStatus,
        deadline: c.deadline?.toISOString() ?? null,
        creatorId: c.creatorId,
        daysRemaining: c.deadline ? daysUntil(c.deadline) : null,
      })),
      week: [...weekMap.entries()].map(([date, items]) => ({
        date,
        items: items.map((i) => ({
          id: i.contentId,
          title: i.title,
          at: (i.scheduledAt ?? i.publishedAt)?.toISOString() ?? '',
          status: i.status as ContentStatus,
        })),
      })),
    }

    return payload
  })

  // -------------------------------------------------------------------------
  // Reports (PRD section 31)
  // -------------------------------------------------------------------------
  app.get('/api/reports/monthly', async (request) => {
    const actor = await requireSession(request)
    const { month } = parse(reportQuery, request.query ?? {})

    const target = month ? new Date(`${month}-01T00:00:00.000Z`) : firstOfMonth(new Date())
    const nextMonth = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 1))
    const monthKey = `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}`

    const published = await db()
      .select({
        contentId: schema.contentPlatforms.contentId,
        publishedAt: schema.contentPlatforms.publishedAt,
      })
      .from(schema.contentPlatforms)
      .innerJoin(schema.contents, eq(schema.contents.id, schema.contentPlatforms.contentId))
      .where(
        and(
          eq(schema.contents.workspaceId, actor.workspaceId),
          sql`${schema.contentPlatforms.publishedAt} >= ${target}`,
          sql`${schema.contentPlatforms.publishedAt} < ${nextMonth}`,
        ),
      )

    const ids = [...new Set(published.map((p) => p.contentId))]
    const rows = ids.length
      ? await db()
          .select()
          .from(schema.contents)
          .where(
            and(
              eq(schema.contents.workspaceId, actor.workspaceId),
              inArray(schema.contents.id, ids),
            ),
          )
      : []

    const analyticsRows = rows.length
      ? await db()
          .select()
          .from(schema.analytics)
          .where(inArray(schema.analytics.contentId, rows.map((r) => r.id)))
      : []

    const views = analyticsRows.reduce((a, r) => a + Number(r.views), 0)
    const engagement = analyticsRows.reduce(
      (a, r) => a + Number(r.likes) + Number(r.comments) + Number(r.shares) + Number(r.saves),
      0,
    )
    const followers = analyticsRows.reduce((a, r) => a + r.followersGained, 0)

    const byContent = new Map<string, { views: number; engagement: number }>()
    for (const r of analyticsRows) {
      const prev = byContent.get(r.contentId) ?? { views: 0, engagement: 0 }
      byContent.set(r.contentId, {
        views: prev.views + Number(r.views),
        engagement: prev.engagement + Number(r.likes) + Number(r.comments) + Number(r.shares) + Number(r.saves),
      })
    }

    const platformAgg = new Map<PlatformId, { views: number; engagement: number; count: Set<string> }>()
    for (const r of analyticsRows) {
      const prev = platformAgg.get(r.platform as PlatformId) ?? { views: 0, engagement: 0, count: new Set<string>() }
      prev.views += Number(r.views)
      prev.engagement += Number(r.likes) + Number(r.comments) + Number(r.shares) + Number(r.saves)
      prev.count.add(r.contentId)
      platformAgg.set(r.platform as PlatformId, prev)
    }

    const topicAgg = new Map<string, number>()
    for (const c of rows) {
      const key = c.tags[0] ?? 'lainnya'
      topicAgg.set(key, (topicAgg.get(key) ?? 0) + (byContent.get(c.id)?.views ?? 0))
    }

    const campaigns = await db().query.campaigns.findMany({
      where: eq(schema.campaigns.workspaceId, actor.workspaceId),
    })

    const statusCount = new Map<ContentStatus, number>()
    for (const c of rows) statusCount.set(c.status as ContentStatus, (statusCount.get(c.status as ContentStatus) ?? 0) + 1)

    const report: ReportDTO = {
      month: monthKey,
      generatedAt: new Date().toISOString(),
      summary: {
        contentPublished: rows.length,
        totalContent: rows.length,
        totalViews: views,
        engagementRate: views ? engagement / views : 0,
        followersGained: followers,
      },
      topContent: [...byContent]
        .sort((a, b) => b[1].views - a[1].views)
        .slice(0, 5)
        .map(([contentId, v]) => {
          const c = rows.find((r) => r.id === contentId)!
          return {
            id: contentId,
            ref: c.ref,
            title: c.title,
            views: v.views,
            engagementRate: v.views ? v.engagement / v.views : 0,
          }
        }),
      platformPerformance: [...platformAgg]
        .map(([platform, v]) => ({
          platform,
          views: v.views,
          engagementRate: v.views ? v.engagement / v.views : 0,
          contentCount: v.count.size,
        }))
        .sort((a, b) => b.views - a.views),
      byTopic: [...topicAgg]
        .map(([topic, views]) => ({ topic, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 6),
      campaigns: campaigns.map((c) => {
        const mine = rows.filter((r) => r.campaignId === c.id)
        return {
          id: c.id,
          name: c.name,
          goal: c.goal,
          contentCount: mine.length,
          publishedCount: mine.filter((r) => r.status === 'published').length,
          color: c.color,
        }
      }),
      byStatus: [...statusCount].map(([status, count]) => ({ status, count })),
    }

    return report
  })

  // -------------------------------------------------------------------------
  // Global search (PRD section 33)
  // -------------------------------------------------------------------------
  app.get('/api/search', async (request) => {
    const actor = await requireSession(request)
    const { q, type, limit } = parse(searchQuery, request.query ?? {})
    const term = `%${q.toLowerCase()}%`

    const results: Awaited<ReturnType<typeof buildSearch>> = []

    if (type === 'all' || type === 'content') {
      results.push(
        ...(await buildSearch(
          db()
            .select({
              id: schema.contents.id,
              title: schema.contents.title,
              subtitle: sql<string>`'#' || ${schema.contents.ref} || ' - ' || ${schema.contents.status}`,
              href: sql<string>`'/content/' || ${schema.contents.id}`,
              color: schema.contents.thumbnailColor,
            })
            .from(schema.contents)
            .where(
              and(
                eq(schema.contents.workspaceId, actor.workspaceId),
                sql`(lower(${schema.contents.title}) LIKE ${term} OR lower(${schema.contents.tags}::text) LIKE ${term})`,
              ),
            )
            .limit(limit),
          'content',
        )),
      )
    }

    if (type === 'all' || type === 'assets') {
      results.push(
        ...(await buildSearch(
          db()
            .select({
              id: schema.assets.id,
              title: schema.assets.name,
              subtitle: sql<string>`${schema.assets.folder} || ' - ' || ${schema.assets.kind}`,
              href: sql<string>`'/assets?asset=' || ${schema.assets.id}`,
              color: schema.assets.color,
            })
            .from(schema.assets)
            .where(
              and(
                eq(schema.assets.workspaceId, actor.workspaceId),
                sql`lower(${schema.assets.name}) LIKE ${term}`,
              ),
            )
            .limit(limit),
          'asset',
        )),
      )
    }

    if (type === 'all' || type === 'campaigns') {
      results.push(
        ...(await buildSearch(
          db()
            .select({
              id: schema.campaigns.id,
              title: schema.campaigns.name,
              subtitle: sql<string>`${schema.campaigns.goal} || ' - ' || ${schema.campaigns.status}`,
              href: sql<string>`'/campaigns?id=' || ${schema.campaigns.id}`,
              color: schema.campaigns.color,
            })
            .from(schema.campaigns)
            .where(
              and(
                eq(schema.campaigns.workspaceId, actor.workspaceId),
                sql`lower(${schema.campaigns.name}) LIKE ${term}`,
              ),
            )
            .limit(limit),
          'campaign',
        )),
      )
    }

    if (type === 'all' || type === 'ideas') {
      results.push(
        ...(await buildSearch(
          db()
            .select({
              id: schema.ideas.id,
              title: schema.ideas.title,
              subtitle: sql<string>`'Idea - ' || ${schema.ideas.platform}`,
              href: sql<string>`'/ideas'`,
              color: sql<string>`'#d4af37'`,
            })
            .from(schema.ideas)
            .where(
              and(
                eq(schema.ideas.workspaceId, actor.workspaceId),
                sql`lower(${schema.ideas.title}) LIKE ${term}`,
              ),
            )
            .limit(limit),
          'idea',
        )),
      )
    }

    if (type === 'all' || type === 'scripts') {
      results.push(
        ...(await buildSearch(
          db()
            .select({
              id: schema.scripts.id,
              title: schema.scripts.title,
              subtitle: sql<string>`'Script v' || ${schema.scripts.version}`,
              href: sql<string>`'/scripts?script=' || ${schema.scripts.id}`,
              color: sql<string>`'#a78bfa'`,
            })
            .from(schema.scripts)
            .where(
              and(
                eq(schema.scripts.workspaceId, actor.workspaceId),
                sql`lower(${schema.scripts.title}) LIKE ${term}`,
              ),
            )
            .limit(limit),
          'script',
        )),
      )
    }

    return { data: results.slice(0, limit) }
  })
}

// ---------------------------------------------------------------------------
// Notifications + activity (PRD sections 32, 39)
// ---------------------------------------------------------------------------

export async function registerNotificationRoutes(app: FastifyInstance) {
  app.get('/api/notifications', async (request) => {
    const actor = await requireSession(request)
    const query = parse(listNotificationsQuery, request.query ?? {})
    const clauses: SQL[] = [
      eq(schema.notifications.userId, actor.userId),
      eq(schema.notifications.workspaceId, actor.workspaceId),
    ]
    if (query.unread) clauses.push(eq(schema.notifications.read, false))

    const rows = await db()
      .select()
      .from(schema.notifications)
      .where(and(...clauses))
      .orderBy(sql`${schema.notifications.createdAt} DESC`)
      .limit(query.limit)
      .offset(query.offset)

    const { toNotificationDTO } = await import('../lib/serialize')
    const unread = (await db()
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, actor.userId),
          eq(schema.notifications.workspaceId, actor.workspaceId),
          eq(schema.notifications.read, false),
        ),
      )) as unknown as { c: number }[]

    return { data: rows.map(toNotificationDTO), unread: unread[0]?.c ?? 0 }
  })

  app.patch('/api/notifications/:id', async (request) => {
    const actor = await requireSession(request)
    const { id: notificationId } = request.params as { id: string }
    const { read } = parse(z.object({ read: z.boolean().default(true) }), request.body ?? {})
    await db()
      .update(schema.notifications)
      .set({ read })
      .where(and(eq(schema.notifications.id, notificationId), eq(schema.notifications.userId, actor.userId)))
    return { ok: true }
  })

  app.post('/api/notifications/read-all', async (request) => {
    const actor = await requireSession(request)
    await db()
      .update(schema.notifications)
      .set({ read: true })
      .where(
        and(
          eq(schema.notifications.userId, actor.userId),
          eq(schema.notifications.workspaceId, actor.workspaceId),
        ),
      )
    return { ok: true }
  })

  app.get('/api/activity', async (request) => {
    const actor = await requireSession(request)
    const limit = Number((request.query as { limit?: string })?.limit ?? 20)
    const rows = await db()
      .select()
      .from(schema.activityLogs)
      .where(eq(schema.activityLogs.workspaceId, actor.workspaceId))
      .orderBy(sql`${schema.activityLogs.createdAt} DESC`)
      .limit(Math.min(100, limit))

    return {
      data: rows.map((r) => ({
        id: r.id,
        workspaceId: r.workspaceId,
        actorId: r.actorId,
        verb: r.verb,
        target: r.target,
        targetId: r.targetId,
        kind: r.kind,
        at: r.createdAt.toISOString(),
      })),
    }
  })
}

// ---------------------------------------------------------------------------
// AI Studio (PRD sections 27-28)
// ---------------------------------------------------------------------------

export async function registerAiRoutes(app: FastifyInstance) {
  app.post('/api/ai/generate', async (request) => {
    const actor = await requireSession(request)
    const body = parse(aiGenerateSchema, request.body)

    const brand = body.brandId
      ? await db().query.brands.findFirst({
          where: and(eq(schema.brands.id, body.brandId), eq(schema.brands.workspaceId, actor.workspaceId)),
        })
      : await db().query.brands.findFirst({ where: eq(schema.brands.workspaceId, actor.workspaceId) })

    const content = body.contentId
      ? await db().query.contents.findFirst({
          where: and(eq(schema.contents.id, body.contentId), eq(schema.contents.workspaceId, actor.workspaceId)),
        })
      : null

    const result = await generate({
      tool: body.tool,
      prompt: body.prompt,
      platform: body.platform,
      duration: body.duration,
      temperature: body.temperature,
      brand: brand
        ? {
            name: brand.name,
            tone: brand.guidelines?.tone ?? '',
            keywords: brand.guidelines?.keywords ?? [],
            doList: brand.guidelines?.doList ?? [],
            dontList: brand.guidelines?.dontList ?? [],
          }
        : null,
      contentTitle: content?.title ?? null,
    })

    const runId = id('ai')
    await db().insert(schema.aiGenerations).values({
      id: runId,
      workspaceId: actor.workspaceId,
      userId: actor.userId,
      tool: body.tool,
      prompt: body.prompt,
      output: result.output,
      model: result.model,
      creditsUsed: result.creditsUsed,
    })

    return { ...result, id: runId, creditsFor: creditsFor(body.tool) }
  })

  app.get('/api/ai/runs', async (request) => {
    const actor = await requireSession(request)
    const rows = await db().query.aiGenerations.findMany({
      where: eq(schema.aiGenerations.workspaceId, actor.workspaceId),
      orderBy: sql`${schema.aiGenerations.createdAt} DESC`,
      limit: 30,
    })
    return { data: rows.map(toAiRunDTO) }
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalises a search result set. Accepts the Drizzle query builder directly
 * (it is promise-like) so call sites stay declarative.
 */
async function buildSearch<T extends object>(
  rows: PromiseLike<T[]>,
  type: 'content' | 'asset' | 'campaign' | 'idea' | 'script',
) {
  const list = (await rows) as Record<string, unknown>[]
  return list.map((r) => ({
    id: String(r.id),
    type,
    title: String(r.title),
    subtitle: String(r.subtitle),
    href: String(r.href),
    color: String(r.color),
  }))
}

async function buildSeries(workspaceId: string, days: number) {
  const rows = await db()
    .select({
      date: schema.analyticsDaily.date,
      views: sql<number>`sum(${schema.analyticsDaily.views})::bigint`,
      followers: sql<number>`sum(${schema.analyticsDaily.followersGained})::int`,
    })
    .from(schema.analyticsDaily)
    .where(eq(schema.analyticsDaily.workspaceId, workspaceId))
    .groupBy(schema.analyticsDaily.date)
    .orderBy(sql`${schema.analyticsDaily.date} ASC`)

  const byDate = new Map(rows.map((r) => [r.date, r]))
  const out: DashboardDTO['series'] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const row = byDate.get(key)
    out.push({
      date: key,
      views: Number(row?.views ?? 0),
      engagement: 0,
      followers: row?.followers ?? 0,
    })
  }
  return out
}

function startOfWeek(d: Date) {
  const r = new Date(d)
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7))
  r.setHours(0, 0, 0, 0)
  return r
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function firstOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

function daysUntil(date: Date) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - start.getTime()) / 86400000)
}

export { PLATFORM_META, PRIORITY_META }