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
  PGLITE_DIR: z.string().default('.data/gooos'),

  /** Directory for uploaded asset blobs (local stand-in for S3). */
  STORAGE_DIR: z.string().default('storage'),

  /** Public base URL of the API, used to build asset URLs. */
  API_PUBLIC_URL: z.string().default('http://localhost:4000'),

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

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  corsOrigins: parsed.data.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  /** True when no external Postgres is configured. */
  usesEmbeddedDb: !parsed.data.DATABASE_URL,
  seedDemoUser: parsed.data.SEED_DEMO_USER ?? parsed.data.NODE_ENV !== 'production',
}

export type Env = typeof env