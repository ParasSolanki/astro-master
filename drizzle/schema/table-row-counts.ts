import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// @see https://github.com/tursodatabase/example-billing-tips/blob/main/04_triggers_for_table_row_count.sql

export const tableRowCountsTable = sqliteTable(
  "table_row_counts",
  {
    tableName: text("table_name").notNull().unique().primaryKey(),
    rowCount: integer("row_count").notNull().default(0),
  },
  (t) => ({
    tableNameIdx: uniqueIndex("table_row_counts_table_name_idx").on(
      t.tableName,
    ),
  }),
);
