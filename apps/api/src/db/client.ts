import { mkdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite'
import { drizzle as drizzleNode, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { sql } from 'drizzle-orm'
import * as schema from './schema'
import { env } from '../config/env'

/**
 * Two database backends behind one Drizzle type.
 *
 * - No DATABASE_URL  -> embedded PGlite (in-process Postgres, zero install)
 * - DATABASE_URL set -> node-postgres against Neon / Supabase / local Postgres
 *
 * Both expose identical SQL, so moving to a hosted database is a config change
 * with no code edits.
 */

export type Database = PgliteDatabase<typeof schema> | NodePgDatabase<typeof schema>

let instance: Database | null = null
let initPromise: Promise<Database> | null = null
let rawClient: PGlite | null = null

async function createEmbedded(): Promise<Database> {
  // PGlite creates the leaf directory but not its parents, so make the whole path.
  await mkdir(env.pgliteDir, { recursive: true })
  const client = new PGlite(env.pgliteDir)
  await client.waitReady
  rawClient = client
  return drizzle(client, { schema })
}

async function createRemote(): Promise<Database> {
  const { default: pg } = await import('pg')
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 10 })
  return drizzleNode(pool, { schema })
}

export async function getDb(): Promise<Database> {
  if (instance) return instance
  if (!initPromise) {
    initPromise = (env.usesEmbeddedDb ? createEmbedded() : createRemote()).then((d) => {
      instance = d
      return d
    })
  }
  return initPromise
}

/**
 * Runs raw SQL that may contain multiple statements.
 *
 * Drizzle's `execute(sql.raw(...))` uses the extended query protocol, which
 * Postgres accepts for one statement only. Migrations need many statements per
 * batch, so the embedded path uses PGlite's simple-protocol `exec` instead.
 */
export async function execRaw(text: string): Promise<void> {
  await getDb()
  if (rawClient) {
    await rawClient.exec(text)
    return
  }
  await db().execute(sql.raw(text))
}

/** Synchronous accessor for code paths that run after boot. */
export function db(): Database {
  if (!instance) throw new Error('Database not initialised - call getDb() during bootstrap first')
  return instance
}

export { schema }
export * as tables from './schema'

/**
 * Type-safe transaction helper. PGlite is single-connection so transactions
 * are serialised; the remote pool uses normal Postgres semantics.
 */
export async function transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T> {
  const d = db()
  return d.transaction(fn as never) as Promise<T>
}
