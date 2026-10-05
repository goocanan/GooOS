import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/gooos";

const client = postgres(databaseUrl, { max: 10, prepare: false });

export const db = drizzle(client, { schema });

export { schema };
export * from "./schema/index";
