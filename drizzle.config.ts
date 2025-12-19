import { defineConfig } from "drizzle-kit";

const useSqlite = !process.env.DATABASE_URL;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: useSqlite ? "sqlite" : "postgresql",
  dbCredentials: useSqlite
    ? { url: "./local.db" }
    : { url: process.env.DATABASE_URL },
});
