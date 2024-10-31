import {
  index,
  integer,
  numeric,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { lifecycleDates, primaryId } from "./utils";
import { relations } from "drizzle-orm";

export const collectionsTable = sqliteTable(
  "collections",
  {
    id: primaryId(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),

    productsCount: integer("products_count").notNull().default(0),

    ...lifecycleDates,
  },
  (t) => ({
    idIdx: uniqueIndex("collections_id_idx").on(t.id),
    slugIdx: index("collections_slug_idx").on(t.slug),
  }),
);

export const categoriesTable = sqliteTable(
  "categories",
  {
    slug: text("slug").notNull().primaryKey(),
    name: text("name").notNull(),
    imageUrl: text("image_url"),

    collectionId: text("collection_id")
      .notNull()
      .references(() => collectionsTable.id, { onDelete: "cascade" }),

    productsCount: integer("products_count").notNull().default(0),

    ...lifecycleDates,
  },
  (t) => ({
    slugIdx: index("categories_slug_idx").on(t.slug),
    collectionIdx: index("categories_collection_id_idx").on(t.collectionId),
  }),
);

export const subcollectionsTable = sqliteTable(
  "subcollections",
  {
    id: primaryId(),
    name: text("name").notNull(),
    categorySlug: text("category_slug")
      .notNull()
      .references(() => categoriesTable.slug, { onDelete: "cascade" }),

    ...lifecycleDates,
  },
  (t) => ({
    categorySlugIdx: index("subcollections_category_slug_idx").on(
      t.categorySlug,
    ),
  }),
);

export const subcategoriesTable = sqliteTable(
  "subcategories",
  {
    slug: text("slug").notNull().primaryKey(),
    name: text("name").notNull(),
    imageUrl: text("image_url"),
    subcollectionId: text("subcollection_id")
      .notNull()
      .references(() => subcollectionsTable.id, { onDelete: "cascade" }),

    productsCount: integer("products_count").notNull().default(0),

    ...lifecycleDates,
  },
  (t) => ({
    slugIdx: index("subcategories_slug_idx").on(t.slug),
    subcollectionIdIdx: index("subcategories_subcollection_id_idx").on(
      t.subcollectionId,
    ),
  }),
);

export const productsTable = sqliteTable(
  "products",
  {
    slug: text("slug").notNull().primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    price: numeric("price").notNull(),

    imageUrl: text("image_url"),

    subcategorySlug: text("subcategory_slug")
      .notNull()
      .references(() => subcategoriesTable.slug, { onDelete: "cascade" }),

    ...lifecycleDates,
  },
  (t) => ({
    slugIdx: index("products_slug_idx").on(t.slug),
    nameIdx: index("products_name_idx").on(t.name),
    subcategorySlugIdx: index("products_subcategory_slug_idx").on(
      t.subcategorySlug,
    ),
  }),
);

export const collectionRelations = relations(collectionsTable, ({ many }) => ({
  categories: many(categoriesTable),
}));

export const categoriesRelations = relations(
  categoriesTable,
  ({ one, many }) => ({
    collection: one(collectionsTable, {
      fields: [categoriesTable.collectionId],
      references: [collectionsTable.id],
    }),
    subcollections: many(subcollectionsTable),
  }),
);

export const subcollectionsRelations = relations(
  subcollectionsTable,
  ({ one, many }) => ({
    category: one(categoriesTable, {
      fields: [subcollectionsTable.categorySlug],
      references: [categoriesTable.slug],
    }),
    subcategories: many(subcategoriesTable),
  }),
);

export const subcategoriesRelations = relations(
  subcategoriesTable,
  ({ one, many }) => ({
    subcollection: one(subcollectionsTable, {
      fields: [subcategoriesTable.subcollectionId],
      references: [subcollectionsTable.id],
    }),
    products: many(productsTable),
  }),
);

export const productsRelations = relations(productsTable, ({ one }) => ({
  subcategory: one(subcategoriesTable, {
    fields: [productsTable.subcategorySlug],
    references: [subcategoriesTable.slug],
  }),
}));
