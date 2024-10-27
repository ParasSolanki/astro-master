import { defineConfig } from "drizzle-kit";

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL) {
  throw new Error("Environment variable `TURSO_DATABASE_URL` is required");
}
if (!TURSO_AUTH_TOKEN) {
  throw new Error("Environment variable `TURSO_AUTH_TOKEN` is required");
}

export default defineConfig({
  schema: "./drizzle/schema/index.ts",
  dialect: "turso",
  out: "./drizzle/migrations",
  breakpoints: true,
  verbose: true,
  dbCredentials: {
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  },
});
