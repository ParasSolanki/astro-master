import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { lifecycleDates, primaryId } from "./utils";
import { relations } from "drizzle-orm";

export const usersTable = sqliteTable(
  "users",
  {
    id: primaryId(),
    username: text("username", { length: 255 }).notNull().unique(),

    ...lifecycleDates,
  },
  (t) => ({
    usernameIdx: uniqueIndex("users_unique_username_idx").on(t.username),
  }),
);

export const userPasswordsTable = sqliteTable(
  "user_passwords",
  {
    id: primaryId(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => usersTable.id, {
        onDelete: "cascade",
      }),
    hashedPassword: text("hashed_password"),

    ...lifecycleDates,
  },
  (t) => ({
    userIdx: uniqueIndex("user_passwords_unique_user_id_idx").on(t.userId),
  }),
);

export const userPasswordRelations = relations(
  userPasswordsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [userPasswordsTable.userId],
      references: [usersTable.id],
    }),
  }),
);
