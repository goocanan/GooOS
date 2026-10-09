import { sql } from 'drizzle-orm'
import { db, execRaw, getDb, type Database } from './client'
import { DDL } from './ddl'

/**
 * Columns that must exist on these tables for the DDL to be valid.
 *
 * Used only as a preflight conflict check. See `assertNoSchemaConflict`.
 */
const SHAPE_PROBES: Record<string, string[]> = {
  contents: ['brand_id', 'ref', 'workspace_id', 'owner_id'],
  campaigns: ['brand_id', 'name', 'status'],
  brands: ['name', 'workspace_id'],
  workspaces: ['name', 'slug'],
  users: ['name', 'email'],
}

/**
 * Refuses to run against a database that already holds an incompatible schema.
 *
 * The DDL is written with CREATE TABLE IF NOT EXISTS, which makes it idempotent
 * for its *own* schema but silently tolerant of a *different* one. If another
 * application already created a table of the same name, the create is a no-op
 * and execution continues against the foreign shape, failing much later at some
 * unrelated index with an error that points nowhere near the real cause.
 *
 * That is exactly what happened here: an older GooOS schema (uuid ids, and
 * `campaigns` without `brand_id`) occupied the same database, so boot died with
 * `column "brand_id" does not exist` on
 * `CREATE INDEX ... ON "campaigns" ("brand_id")`.
 *
 * This check runs first and names the conflict, so the fix is obvious rather
 * than archaeological.
 */
async function assertNoSchemaConflict(): Promise<void> {
  const conflicts: string[] = []
  for (const [table, required] of Object.entries(SHAPE_PROBES)) {
    const exists = await query<{ n: number }>(
      `SELECT count(*)::int AS n FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = '${table}'`,
    )
    if (!exists[0]?.n) continue

    const cols = await query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = '${table}'`,
    )
    const have = new Set(cols.map((c) => c.column_name))
    const missing = required.filter((c) => !have.has(c))
    if (missing.length) {
      conflicts.push(`  "${table}" exists but is missing: ${missing.join(', ')}`)
    }
  }

  if (!conflicts.length) return
  throw new Error(
    `Refusing to migrate: this database already contains an incompatible GooOS schema.\n\n${conflicts.join('\n')}\n\n` +
      'The boot DDL uses CREATE TABLE IF NOT EXISTS, so a pre-existing table of the ' +
      'same name is left untouched and the mismatch surfaces later as a confusing ' +
      'error on an unrelated index.\n\n' +
      'This happens when a database is reused between GooOS versions (or between ' +
      'GooOS and another app that declares the same table names).\n\n' +
      'Fix it by pointing DATABASE_URL at an empty database, or clear the public ' +
      'schema by hand:\n\n' +
      '  DROP SCHEMA public CASCADE;\n' +
      '  CREATE SCHEMA public;\n\n' +
      'That is destructive - it deletes every table in the schema, so confirm the ' +
      'database holds nothing you need first. GooOS recreates its own tables and ' +
      'seed data on the next boot.',
  )
}

/**
 * Idempotent schema bootstrap. Safe to run on every boot: every statement is
 * CREATE ... IF NOT EXISTS or a DO block that swallows duplicate_object.
 */
export async function migrate(opts: { force?: boolean } = {}): Promise<void> {
  await getDb()
  if (opts.force) await dropAll()
  await assertNoSchemaConflict()
  await execRaw(DDL)
}

const DROP_ORDER = [
  'activity_logs',
  'ai_generations',
  'tasks',
  'notifications',
  'hashtags',
  'hashtag_groups',
  'analytics_daily',
  'analytics',
  'platform_accounts',
  'calendar_events',
  'scheduled_posts',
  'approvals',
  'comments',
  'script_versions',
  'scripts',
  'content_versions',
  'content_assets',
  'content_platforms',
  'contents',
  'ideas',
  'campaigns',
  'brands',
  'assets',
  'asset_folders',
  'workspace_members',
  'workspaces',
  'verifications',
  'accounts',
  'sessions',
  'users',
]

export async function dropAll() {
  await execRaw(`DROP TABLE IF EXISTS ${DROP_ORDER.map((t) => `"${t}"`).join(', ')} CASCADE;`)
  // Enums survive their tables, so clear them too.
  await execRaw(`DO $$ DECLARE r record; BEGIN
      FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e') LOOP
        EXECUTE format('DROP TYPE IF EXISTS %I CASCADE', r.typname);
      END LOOP;
    END $$;`)
}

type Row = Record<string, unknown>

async function query<T = Row>(text: string): Promise<T[]> {
  const database: Database = db()
  const res = (await database.execute(sql.raw(text))) as unknown as { rows: T[] }
  return res.rows ?? []
}

/** True when the schema is present and usable. */
export async function isMigrated(): Promise<boolean> {
  if (!db()) return false
  const rows = await query<{ reg: string | null }>(
    `SELECT to_regclass('public.contents')::text AS reg`,
  )
  return Boolean(rows[0]?.reg)
}

export async function tableCount(): Promise<number> {
  const rows = await query<{ c: number }>(
    `SELECT count(*)::int AS c FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
  )
  return rows[0]?.c ?? 0
}