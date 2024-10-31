CREATE UNIQUE INDEX `users_unique_id_idx` ON `users` (`id`);--> statement-breakpoint
CREATE INDEX `categories_slug_idx` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `subcategories_slug_idx` ON `subcategories` (`slug`);