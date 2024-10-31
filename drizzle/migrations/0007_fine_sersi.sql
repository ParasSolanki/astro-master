CREATE TABLE `table_row_counts` (
	`table_name` text PRIMARY KEY NOT NULL,
	`row_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `table_row_counts_table_name_unique` ON `table_row_counts` (`table_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `table_row_counts_table_name_idx` ON `table_row_counts` (`table_name`);