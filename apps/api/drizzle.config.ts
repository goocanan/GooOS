import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  casing: 'snake_case',
  // PGlite runs an in-process Postgres; migrations are applied programmatically
  // in src/db/push.ts so the same SQL works against a hosted DATABASE_URL.
  driver: 'pglite',
  dbCredentials: {
    url: '.data/gooos',
  },
})