CREATE TABLE `token_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`tokenAmount` int NOT NULL,
	`priceInCents` int NOT NULL,
	`pricePerToken` int NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `token_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `token_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('purchase','usage','refund','bonus') NOT NULL,
	`amount` int NOT NULL,
	`balanceBefore` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`packageId` int,
	`renderId` int,
	`priceInCents` int,
	`paymentStatus` enum('pending','completed','failed','refunded'),
	`paymentMethod` varchar(50),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `token_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `tokenBalance` int DEFAULT 3 NOT NULL;