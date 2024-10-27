import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../schema";
// @ts-expect-error
import collections from "../data/collections.json";

async function seed() {
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

  console.log("Seeding collections");

  const queries = collections.collections.map(
    (c: { name: string; slug: string }) =>
      db.insert(schema.collectionsTable).values({
        name: c.name,
        slug: c.slug,
      }),
  );

  await db.batch(queries);

  client.close();

  console.log("Seeded collections successfully");

  process.exit(0);
}

seed().catch((e) => {
  console.error("Migration failed");
  console.error(e);
  process.exit(1);
});
