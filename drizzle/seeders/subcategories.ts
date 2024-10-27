import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../schema";
import pMap from "p-map";
// @ts-expect-error
import subcategories from "../data/subcategories.json";

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

  console.log("Seeding subcategories");

  // make an array of subcategories with group of 10
  // @ts-expect-error
  const groupSubcategories = subcategories.reduce((acc, curr, i) => {
    if (i % 10 === 0) {
      acc.push([curr]);
    } else {
      acc[acc.length - 1].push(curr);
    }
    return acc;
  }, []);

  let index = 0;

  // @ts-expect-error
  const mapper = async (subcategories) => {
    try {
      index++;
      const queries = subcategories.map(
        (s: { name: any; slug: any; ulid: any; imageUrl: any }) =>
          db.insert(schema.subcategoriesTable).values({
            name: s.name,
            slug: s.slug,
            subcollectionId: s.ulid,
            imageUrl: s.imageUrl,
          }),
      );

      await db.batch(queries);
    } catch (e) {
      console.log(e, "error");
    }

    console.log(`Seeded ${index * 10} subcategories`);
  };

  await pMap(groupSubcategories, mapper, { concurrency: 10 });

  client.close();

  console.log("Seeded subcategories successfully");

  process.exit(0);
}

seed().catch((e) => {
  console.error("Migration failed");
  console.error(e);
  process.exit(1);
});
