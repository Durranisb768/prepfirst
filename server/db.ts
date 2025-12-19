import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import pg from "pg";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";

const { Pool } = pg;

let db: any;
let pool: any;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzlePg(pool, { schema });
  console.log("Using PostgreSQL database");
} else {
  const sqlite = new Database("./local.db");
  db = drizzleSqlite(sqlite, { schema });
  console.log("Using SQLite database (fallback for demo)");
}

export { db, pool };
