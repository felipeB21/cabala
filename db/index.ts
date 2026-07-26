import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// `prepare: false` is required because DATABASE_URL points at Supabase's
// transaction-mode pooler (port 6543/PgBouncer), which doesn't preserve
// prepared statements across pooled connections — without this, multi-query
// db.transaction() calls intermittently fail with "prepared statement does
// not exist".
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle({ client, schema });
