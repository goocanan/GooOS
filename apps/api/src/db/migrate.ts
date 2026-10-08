import { sql } from 'drizzle-orm'
import { db, execRaw, getDb, type Database } from './client'
import { DDL } from './ddl'

/**
 * Idempotent schema bootstrap. Safe to run on every boot: every statement is
 * CREATE ... IF NOT EXISTS or a DO block that swallows duplicate_object.
 */
export async function migrate(opts: { force?: boolean } = {}): Promise<void> {
  await getDb()
  if (opts.force) await dropAll()
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