import path from 'node:path'
import { z } from 'zod'

/**
 * Environment configuration. Parsed once at boot so a missing or malformed
 * value fails fast with a readable message instead of surfacing as a weird
 * runtime error later.
 */

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),

  /**
   * Leave empty to use the embedded PGlite database (no install required).
   * Set to a Neon/Supabase Postgres URL to run against a real server - the
   * Drizzle schema and all SQL are portable.
   */
  DATABASE_URL: z.string().optional(),

  /** Directory for the PGlite data folder. */
  /**
   * Where PGlite stores its data directory.
   *
   * Relative paths are resolved against this package rather than the process
   * working directory, so the database lands in the same place whether the
   * server is started from apps/api (local dev) or from the repo root (Render).
   * Otherwise the directory moves with the cwd, which previously let it escape
   * the .gitignore rule and end up committed.
   */
  PGLITE_DIR: z.string().default('.data/gooos'),

  /** Directory for uploaded asset blobs (local stand-in for S3). */
  STORAGE_DIR: z.string().default('storage'),

  /** Public base URL of the API, used to build asset URLs. */
  API_PUBLIC_URL: z.string().default('http://localhost:4000'),

  /**
   * Path to the built SPA. When it contains an index.html the API serves the
   * SPA itself, so production runs on a single origin and session cookies stay
   * first-party. Leave unset in development - Vite serves the SPA instead.
   */
  WEB_DIST: z.string().optional(),

  /** Origins allowed to send credentialed requests (the Vite dev server). */
  CORS_ORIGINS: z.string().default('http://localhost:5180,http://localhost:5173'),

  BETTER_AUTH_SECRET: z.string().min(16).default('dev-only-secret-change-me-in-production-0123456789'),
  BETTER_AUTH_URL: z.string().default('http://localhost:4000'),

  /**
   * Creates the demo account and fixtures on boot when they do not exist.
   * Defaults to true in development so a fresh clone is immediately usable, and
   * to false in production so real deployments never get demo data.
   */
  SEED_DEMO_USER: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true' || v === '1')),

  AI_PROVIDER: z.enum(['mock', 'openai']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  AI_CREDITS_PER_RUN: z.coerce.number().int().positive().default(2),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(`Invalid environment configuration:\n${issues}`)
}

/** Resolves a configured relative path against this package directory. */
function resolveFromPackage(p: string): string {
  return path.isAbsolute(p) ? p : path.resolve(import.meta.dirname, '../..', p)
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  /**
   * API_PUBLIC_URL is always allowed. Browsers send an Origin header even on
   * same-origin POSTs, so without this the SPA talking to the API on one origin
   * would be rejected by its own CORS allowlist in production.
   */
  corsOrigins: [...new Set(
    [...parsed.data.CORS_ORIGINS.split(',').map((s) => s.trim()), parsed.data.API_PUBLIC_URL].filter(
      Boolean,
    ),
  )],
  /** True when no external Postgres is configured. */
  usesEmbeddedDb: !parsed.data.DATABASE_URL,
  seedDemoUser: parsed.data.SEED_DEMO_USER ?? parsed.data.NODE_ENV !== 'production',
  /** Absolute paths, anchored to apps/api regardless of cwd. */
  pgliteDir: resolveFromPackage(parsed.data.PGLITE_DIR),
  storageDir: resolveFromPackage(parsed.data.STORAGE_DIR),
}

export type Env = typeof env