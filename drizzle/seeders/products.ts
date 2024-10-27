import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../schema";
import pMap from "p-map";
// @ts-expect-error
import products from "../data/products.json";

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

  console.log("Seeding products");

  // make an array of products with group of 100
  // @ts-expect-error
  const groupProducts = products.reduce((acc, curr, i) => {
    if (i % 100 === 0) {
      acc.push([curr]);
    } else {
      acc[acc.length - 1].push(curr);
    }
    return acc;
  }, []);

  let index = 0;

  // @ts-expect-error
  const mapper = async (products) => {
    try {
      index++;
      const queries = products.map(
        (p: {
          name: string;
          slug: string;
          subcategorySlug: string;
          price: string;
          description: string;
          image_url: string | null;
        }) =>
          db.insert(schema.productsTable).values({
            name: p.name,
            slug: p.slug,
            subcategorySlug: p.subcategorySlug,
            price: p.price,
            description: p.description,
            imageUrl: p.image_url,
          }),
      );

      await db.batch(queries);
    } catch (e) {
      console.log(e, "error");
    }

    console.log(`Seeded ${index * 100} products`);
  };

  await pMap(groupProducts, mapper, { concurrency: 2 });

  client.close();

  console.log("Seeded products successfully");

  process.exit(0);
}

seed().catch((e) => {
  console.error("Migration failed");
  console.error(e);
  process.exit(1);
});
