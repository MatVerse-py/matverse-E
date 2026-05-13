CREATE TABLE `artifacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artifactId` varchar(128) NOT NULL,
	`content` text,
	`trustScore` decimal(5,2),
	`contentHash` varchar(64) NOT NULL,
	`storageUrl` text,
	`storageKey` varchar(256),
	`submittedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `artifacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `artifacts_artifactId_unique` UNIQUE(`artifactId`)
);
--> statement-breakpoint
CREATE TABLE `ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artifactId` varchar(128) NOT NULL,
	`operationType` enum('SUBMIT','EVALUATE','APPROVE','BLOCK','REVIEW') NOT NULL,
	`omegaGateDecision` enum('PASS','HOLD','REVIEW','BLOCK') NOT NULL,
	`iSpiValid` boolean DEFAULT true,
	`semanticRiskLevel` enum('LOW','MEDIUM','HIGH','CRITICAL'),
	`llmJustification` text,
	`integrityMetrics` json,
	`operationHash` varchar(64) NOT NULL,
	`previousHash` varchar(64),
	`actorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `omegaGateDecisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artifactId` varchar(128) NOT NULL,
	`decision` enum('PASS','HOLD','REVIEW','BLOCK') NOT NULL,
	`reasoning` text,
	`appliedRules` json,
	`status` enum('PENDING','APPROVED','BLOCKED','RELEASED') DEFAULT 'PENDING',
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `omegaGateDecisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `omegaGateRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleName` varchar(128) NOT NULL,
	`condition` text NOT NULL,
	`decision` enum('PASS','HOLD','REVIEW','BLOCK') NOT NULL,
	`priority` int DEFAULT 0,
	`active` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `omegaGateRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `artifacts` ADD CONSTRAINT `artifacts_submittedBy_users_id_fk` FOREIGN KEY (`submittedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ledger` ADD CONSTRAINT `ledger_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `omegaGateDecisions` ADD CONSTRAINT `omegaGateDecisions_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;