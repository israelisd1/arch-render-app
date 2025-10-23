CREATE TABLE `renders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalImageUrl` text NOT NULL,
	`renderedImageUrl` text,
	`sceneType` enum('interior','exterior') NOT NULL,
	`outputFormat` varchar(10) NOT NULL,
	`prompt` text,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `renders_id` PRIMARY KEY(`id`)
);
