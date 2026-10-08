import { and, eq, inArray, or, sql, type SQL } from 'drizzle-orm'
import { db, schema } from '../db/client'
import { toContentDTO } from '../lib/serialize'
import { ApiError } from '../lib/errors'
import type { ContentDTO } from '@gooos/shared/types'

/**
 * Content query helpers shared by the list, board, calendar, detail and
 * analytics routes. Centralising these keeps the "load content + its platform
 * variants + attached assets + script id" shape identical everywhere, which is
 * what stops the DTO from drifting between screens.
 */

export interface ContentFilter {
  workspaceId: string
  q?: string
  status?: string[]
  platform?: string[]
  brandId?: string[]
  campaignId?: string[]
  creatorId?: string[]
  reviewerId?: string[]
  priority?: string[]
  archived?: boolean
  dueBefore?: Date
  dueAfter?: Date
}

export function buildContentWhere(f: ContentFilter): SQL | undefined {
  const clauses: (SQL | undefined)[] = [eq(schema.contents.workspaceId, f.workspaceId)]

  if (f.status?.length) {
    clauses.push(
      f.status.length === 1 && f.status[0] === 'archived'
        ? eq(schema.contents.status, 'archived')
        : inArray(schema.contents.status, f.status as never[]),
    )
  }
  if (f.brandId?.length) clauses.push(inArray(schema.contents.brandId, f.brandId))
  if (f.campaignId?.length) clauses.push(inArray(schema.contents.campaignId, f.campaignId))
  if (f.creatorId?.length) clauses.push(inArray(schema.contents.creatorId, f.creatorId))
  if (f.reviewerId?.length) clauses.push(inArray(schema.contents.reviewerId, f.reviewerId))
  if (f.priority?.length) clauses.push(inArray(schema.contents.priority, f.priority as never[]))

  if (f.archived !== undefined) {
    clauses.push(
      f.archived ? eq(schema.contents.status, 'archived') : sql`${schema.contents.status} <> 'archived'`,
    )
  }

  if (f.platform?.length) {
    clauses.push(
      sql`EXISTS (
        SELECT 1 FROM ${schema.contentPlatforms} cp
        WHERE cp.content_id = ${schema.contents.id}
          AND cp.platform IN (${sql.join(
            f.platform.map((p) => sql`${p}::platform`),
            sql`, `,
          )})
      )`,
    )
  }

  if (f.q) {
    const term = `%${f.q.toLowerCase()}%`
    clauses.push(
      or(
        sql`lower(${schema.contents.title}) LIKE ${term}`,
        sql`lower(${schema.contents.description}) LIKE ${term}`,
        sql`lower(${schema.contents.tags}::text) LIKE ${term}`,
        sql`${schema.contents.ref}::text = ${f.q}`,
      )!,
    )
  }

  if (f.dueBefore) clauses.push(sql`${schema.contents.deadline} <= ${f.dueBefore}`)
  if (f.dueAfter) clauses.push(sql`${schema.contents.deadline} >= ${f.dueAfter}`)

  const defined = clauses.filter(Boolean) as SQL[]
  return defined.length ? and(...defined) : undefined
}

/**
 * Sort clauses are written as raw SQL because some need NULLS LAST. Wrapping
 * them in asc()/desc() would make Drizzle append its own direction and produce
 * invalid SQL like `deadline ASC NULLS LAST asc`.
 */
const SORT_ORDER = {
  updated: sql`${schema.contents.updatedAt} DESC`,
  created: sql`${schema.contents.createdAt} DESC`,
  deadline: sql`${schema.contents.deadline} ASC NULLS LAST`,
  priority: sql`CASE ${schema.contents.priority}
          WHEN 'urgent' THEN 0 WHEN 'high' THEN 1
          WHEN 'medium' THEN 2 ELSE 3 END ASC`,
  title: sql`${schema.contents.title} ASC`,
} as const

export type ContentSort = keyof typeof SORT_ORDER

/** Loads content rows plus their platform variants, assets and script id. */
export async function loadContents(
  _workspaceId: string,
  where: SQL | undefined,
  sort: ContentSort = 'updated',
  limit?: number,
  offset?: number,
): Promise<ContentDTO[]> {
  const database = db()

  const rows = await database
    .select()
    .from(schema.contents)
    .where(where)
    .orderBy(SORT_ORDER[sort])
    .limit(limit ?? 500)
    .offset(offset ?? 0)

  if (!rows.length) return []

  const ids = rows.map((r) => r.id)

  const [platforms, assetLinks, scripts] = await Promise.all([
    database
      .select()
      .from(schema.contentPlatforms)
      .where(inArray(schema.contentPlatforms.contentId, ids)),
    database.select().from(schema.contentAssets).where(inArray(schema.contentAssets.contentId, ids)),
    database
      .select({ id: schema.scripts.id, contentId: schema.scripts.contentId })
      .from(schema.scripts)
      .where(inArray(schema.scripts.contentId, ids)),
  ])

  const scriptByContent = new Map(scripts.map((s) => [s.contentId, s.id]))
  const assetsByContent = new Map<string, string[]>()
  for (const link of assetLinks) {
    const list = assetsByContent.get(link.contentId) ?? []
    list.push(link.assetId)
    assetsByContent.set(link.contentId, list)
  }

  return rows.map((row) =>
    toContentDTO(row, {
      platforms: platforms.filter((p) => p.contentId === row.id),
      assetIds: assetsByContent.get(row.id) ?? [],
      scriptId: scriptByContent.get(row.id) ?? null,
    }),
  )
}

export async function countContents(where: SQL | undefined): Promise<number> {
  const res = (await db()
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.contents)
    .where(where)) as unknown as { c: number }[]
  return res[0]?.c ?? 0
}

export async function getContentOr404(workspaceId: string, id: string) {
  const row = await db()
    .select()
    .from(schema.contents)
    .where(and(eq(schema.contents.id, id), eq(schema.contents.workspaceId, workspaceId)))
    .limit(1)
  if (!row.length) throw ApiError.notFound('Content')
  return row[0]!
}

/** Next reference number in the #NNNN sequence (PRD section 8). */
export async function nextContentRef(workspaceId: string): Promise<number> {
  const res = (await db()
    .select({ m: sql<number>`coalesce(max(${schema.contents.ref}), 1000)::int` })
    .from(schema.contents)
    .where(eq(schema.contents.workspaceId, workspaceId))) as unknown as { m: number }[]
  return (res[0]?.m ?? 1000) + 1
}