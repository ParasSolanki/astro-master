import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../schema";
import { count, eq } from "drizzle-orm";
import pMap from "p-map";

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

  const db = drizzle(client, { logger: true, schema });

  console.log("Seeding product row counts in categories");

  const categories = await db
    .select({
      slug: schema.categoriesTable.slug,
      productsCount: count(schema.productsTable.slug),
    })
    .from(schema.categoriesTable)
    .leftJoin(
      schema.subcollectionsTable,
      eq(schema.subcollectionsTable.categorySlug, schema.categoriesTable.slug),
    )
    .leftJoin(
      schema.subcategoriesTable,
      eq(
        schema.subcategoriesTable.subcollectionId,
        schema.subcollectionsTable.id,
      ),
    )
    .leftJoin(
      schema.productsTable,
      eq(schema.productsTable.subcategorySlug, schema.subcategoriesTable.slug),
    )
    .groupBy(schema.categoriesTable.slug);

  const groupCategories = categories.reduce<
    Array<Array<{ slug: string; productsCount: number }>>
  >((acc, curr, i) => {
    if (i % 10 === 0) acc.push([curr]);
    else acc[acc.length - 1].push(curr);

    return acc;
  }, []);

  let categoryIndex = 0;

  await pMap(
    groupCategories,
    async (categories) => {
      categoryIndex++;
      const queries = categories.map((c) =>
        db
          .update(schema.categoriesTable)
          .set({ productsCount: c.productsCount })
          .where(eq(schema.categoriesTable.slug, c.slug)),
      );

      // @ts-expect-error
      await db.batch(queries);

      console.log(
        `Seeded ${categoryIndex * 10} categories with product counts`,
      );
    },
    {
      concurrency: 10,
    },
  );

  console.log("Seeded product row counts in categories");

  console.log("Seeding product row counts in subcategories");

  const subcategories = await db
    .select({
      slug: schema.subcategoriesTable.slug,
      productsCount: count(schema.productsTable.slug),
    })
    .from(schema.subcategoriesTable)
    .innerJoin(
      schema.productsTable,
      eq(schema.productsTable.subcategorySlug, schema.subcategoriesTable.slug),
    )
    .groupBy(schema.subcategoriesTable.slug);

  const groupSubcategories = subcategories.reduce<
    Array<Array<{ slug: string; productsCount: number }>>
  >((acc, curr, i) => {
    if (i % 10 === 0) acc.push([curr]);
    else acc[acc.length - 1].push(curr);

    return acc;
  }, []);

  let subcategoryIndex = 0;

  await pMap(
    groupSubcategories,
    async (subcategories) => {
      subcategoryIndex++;
      const queries = subcategories.map((s) =>
        db
          .update(schema.subcategoriesTable)
          .set({ productsCount: s.productsCount })
          .where(eq(schema.subcategoriesTable.slug, s.slug)),
      );

      // @ts-expect-error
      await db.batch(queries);

      console.log(
        `Seeded ${subcategoryIndex * 10} subcategories with product counts`,
      );
    },
    {
      concurrency: 10,
    },
  );

  console.log("Seeded product row counts in subcategories");

  console.log("Seeding table row counts");

  const [totalCollectionsCount] = await db
    .select({ count: count(schema.collectionsTable.slug) })
    .from(schema.collectionsTable);
  const [totalCategoriesCount] = await db
    .select({ count: count(schema.categoriesTable.slug) })
    .from(schema.categoriesTable);
  const [totalSubcategoriesCount] = await db
    .select({ count: count(schema.subcategoriesTable.slug) })
    .from(schema.subcategoriesTable);

  const [totalSubcollectionsCount] = await db
    .select({ count: count(schema.subcollectionsTable.id) })
    .from(schema.subcollectionsTable);

  const [totalProductsCount] = await db
    .select({ count: count(schema.productsTable.slug) })
    .from(schema.productsTable);

  await db.batch([
    db.insert(schema.tableRowCountsTable).values({
      tableName: "collections",
      rowCount: totalCollectionsCount.count,
    }),
    db.insert(schema.tableRowCountsTable).values({
      tableName: "categories",
      rowCount: totalCategoriesCount.count,
    }),
    db.insert(schema.tableRowCountsTable).values({
      tableName: "subcollections",
      rowCount: totalSubcollectionsCount.count,
    }),
    db.insert(schema.tableRowCountsTable).values({
      tableName: "subcategories",
      rowCount: totalSubcategoriesCount.count,
    }),
    db.insert(schema.tableRowCountsTable).values({
      tableName: "products",
      rowCount: totalProductsCount.count,
    }),
  ]);
  console.log("Seeded table row counts");

  client.close();

  console.log("Seeded row counts successfully");

  process.exit(0);
}

seed().catch((e) => {
  console.error("Seeding failed");
  console.error(e);
  process.exit(1);
});
