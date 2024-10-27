import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../schema";
// @ts-expect-error
import categories from "../data/categories.json";

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

  console.log("Seeding categories");

  const queries = categories.map(
    (c: { name: any; slug: any; collectionId: any; imageUrl: any }) =>
      db.insert(schema.categoriesTable).values({
        name: c.name,
        slug: c.slug,
        collectionId: c.collectionId,
        imageUrl: c.imageUrl,
      }),
  );

  await db.batch(queries);

  client.close();

  console.log("Seeded categories successfully");

  process.exit(0);
}

seed().catch((e) => {
  console.error("Migration failed");
  console.error(e);
  process.exit(1);
});
