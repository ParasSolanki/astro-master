import { ulid } from "ulid";
import { integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const primaryId = (name = "id") =>
  text(name)
    .notNull()
    .primaryKey()
    .$defaultFn(() => ulid());

export const lifecycleDates = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`NULL`)
    .$onUpdate(() => new Date()),
};
