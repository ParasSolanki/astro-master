CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_sessions_id_unique` ON `user_sessions` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_sessions_unique_id_user_id_idx` ON `user_sessions` (`id`,`user_id`);