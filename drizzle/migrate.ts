import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { migrate } from "drizzle-orm/libsql/migrator";

async function main() {
  const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
  const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

  if (!TURSO_DATABASE_URL) {
    throw new Error("Environment variable `TURSO_DATABASE_URL` is required");
  }
  if (!TURSO_AUTH_TOKEN) {
    throw new Error("Environment variable `TURSO_AUTH_TOKEN` is required");
  }

  const client = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  const db = drizzle(client, { logger: true });

  console.log("Running migrations");

  await migrate(db, { migrationsFolder: "./drizzle/migrations" });

  client.close();

  console.log("Migrated successfully");

  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed");
  console.error(e);
  process.exit(1);
});
