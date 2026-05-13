import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Artifacts table: stores metadata for each submitted artifact.
 * Content is stored separately in S3; only metadata and hash are persisted here.
 */
export const artifacts = mysqlTable("artifacts", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: varchar("artifactId", { length: 128 }).notNull().unique(),
  content: text("content"),
  trustScore: decimal("trustScore", { precision: 5, scale: 2 }),
  contentHash: varchar("contentHash", { length: 64 }).notNull(),
  storageUrl: text("storageUrl"),
  storageKey: varchar("storageKey", { length: 256 }),
  submittedBy: int("submittedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = typeof artifacts.$inferInsert;

/**
 * Ledger table: immutable append-only log of all operations.
 * Stores Ω-Gate decisions, I-SPI validation results, and integrity metrics.
 */
export const ledger = mysqlTable("ledger", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: varchar("artifactId", { length: 128 }).notNull(),
  operationType: mysqlEnum("operationType", ["SUBMIT", "EVALUATE", "APPROVE", "BLOCK", "REVIEW"]).notNull(),
  omegaGateDecision: mysqlEnum("omegaGateDecision", ["PASS", "HOLD", "REVIEW", "BLOCK"]).notNull(),
  iSpiValid: boolean("iSpiValid").default(true),
  semanticRiskLevel: mysqlEnum("semanticRiskLevel", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  llmJustification: text("llmJustification"),
  integrityMetrics: json("integrityMetrics"),
  operationHash: varchar("operationHash", { length: 64 }).notNull(),
  previousHash: varchar("previousHash", { length: 64 }),
  actorId: int("actorId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LedgerEntry = typeof ledger.$inferSelect;
export type InsertLedgerEntry = typeof ledger.$inferInsert;

/**
 * Ω-Gate rules: defines decision logic for artifact classification.
 */
export const omegaGateRules = mysqlTable("omegaGateRules", {
  id: int("id").autoincrement().primaryKey(),
  ruleName: varchar("ruleName", { length: 128 }).notNull(),
  condition: text("condition").notNull(),
  decision: mysqlEnum("decision", ["PASS", "HOLD", "REVIEW", "BLOCK"]).notNull(),
  priority: int("priority").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OmegaGateRule = typeof omegaGateRules.$inferSelect;
export type InsertOmegaGateRule = typeof omegaGateRules.$inferInsert;

/**
 * Ω-Gate decisions: tracks all verdicts issued by the system immune.
 */
export const omegaGateDecisions = mysqlTable("omegaGateDecisions", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: varchar("artifactId", { length: 128 }).notNull(),
  decision: mysqlEnum("decision", ["PASS", "HOLD", "REVIEW", "BLOCK"]).notNull(),
  reasoning: text("reasoning"),
  appliedRules: json("appliedRules"),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "BLOCKED", "RELEASED"]).default("PENDING"),
  approvedBy: int("approvedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OmegaGateDecision = typeof omegaGateDecisions.$inferSelect;
export type InsertOmegaGateDecision = typeof omegaGateDecisions.$inferInsert;
