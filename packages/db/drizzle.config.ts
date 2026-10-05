import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { join } from "path";
config({ path: join(process.cwd(), "..", "..", ".env") });

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/gooos",
  },
  verbose: true,
  strict: true,
});
