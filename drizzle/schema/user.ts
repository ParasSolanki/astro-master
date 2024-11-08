import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
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
    idIdx: uniqueIndex("users_unique_id_idx").on(t.id),
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

export const userSessionsTable = sqliteTable(
  "user_sessions",
  {
    id: text("id").primaryKey().unique().notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),

    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
  },
  (t) => ({
    idAndUserIdIdx: uniqueIndex("user_sessions_unique_id_user_id_idx").on(
      t.id,
      t.userId,
    ),
  }),
);

export const userRelations = relations(usersTable, ({ one, many }) => ({
  password: one(userPasswordsTable, {
    fields: [usersTable.id],
    references: [userPasswordsTable.userId],
  }),
  sessions: many(userSessionsTable),
}));

export const userPasswordRelations = relations(
  userPasswordsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [userPasswordsTable.userId],
      references: [usersTable.id],
    }),
  }),
);

export const userSessionsRelations = relations(
  userSessionsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [userSessionsTable.userId],
      references: [usersTable.id],
    }),
  }),
);
