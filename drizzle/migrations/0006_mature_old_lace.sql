ALTER TABLE `categories` ADD `products_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `subcategories` ADD `products_count` integer DEFAULT 0 NOT NULL;