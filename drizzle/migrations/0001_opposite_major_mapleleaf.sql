CREATE TABLE `categories` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`image_url` text,
	`collection_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `categories_collection_id_idx` ON `categories` (`collection_id`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price` numeric NOT NULL,
	`image_url` text,
	`subcategory_slug` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT NULL,
	FOREIGN KEY (`subcategory_slug`) REFERENCES `subcategories`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `products_subcategory_slug_idx` ON `products` (`subcategory_slug`);--> statement-breakpoint
CREATE TABLE `subcategories` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`image_url` text,
	`subcollection_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT NULL,
	FOREIGN KEY (`subcollection_id`) REFERENCES `subcollections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subcategories_subcollection_id_idx` ON `subcategories` (`subcollection_id`);--> statement-breakpoint
CREATE TABLE `subcollections` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category_slug` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT NULL,
	FOREIGN KEY (`category_slug`) REFERENCES `categories`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subcollections_category_slug_idx` ON `subcollections` (`category_slug`);