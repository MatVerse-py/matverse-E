import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, artifacts, ledger, omegaGateDecisions, omegaGateRules, Artifact, LedgerEntry, OmegaGateDecision, OmegaGateRule } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Artifact operations
 */
export async function createArtifact(data: {
  artifactId: string;
  content?: string;
  trustScore?: number;
  contentHash: string;
  storageUrl?: string;
  storageKey?: string;
  submittedBy?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(artifacts).values({
    artifactId: data.artifactId,
    content: data.content,
    trustScore: data.trustScore ? String(data.trustScore) as any : undefined,
    contentHash: data.contentHash,
    storageUrl: data.storageUrl,
    storageKey: data.storageKey,
    submittedBy: data.submittedBy,
  });

  return result;
}

export async function getArtifactById(artifactId: string): Promise<Artifact | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(artifacts).where(eq(artifacts.artifactId, artifactId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllArtifacts() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(artifacts).orderBy(desc(artifacts.createdAt));
}

/**
 * Ledger operations (append-only)
 */
export async function appendLedgerEntry(data: {
  artifactId: string;
  operationType: "SUBMIT" | "EVALUATE" | "APPROVE" | "BLOCK" | "REVIEW";
  omegaGateDecision: "PASS" | "HOLD" | "REVIEW" | "BLOCK";
  iSpiValid?: boolean;
  semanticRiskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  llmJustification?: string;
  integrityMetrics?: any;
  operationHash: string;
  previousHash?: string;
  actorId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(ledger).values({
    artifactId: data.artifactId,
    operationType: data.operationType,
    omegaGateDecision: data.omegaGateDecision,
    iSpiValid: data.iSpiValid ?? true,
    semanticRiskLevel: data.semanticRiskLevel,
    llmJustification: data.llmJustification,
    integrityMetrics: data.integrityMetrics,
    operationHash: data.operationHash,
    previousHash: data.previousHash,
    actorId: data.actorId,
  });

  return result;
}

export async function getLedgerByArtifactId(artifactId: string): Promise<LedgerEntry[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(ledger).where(eq(ledger.artifactId, artifactId)).orderBy(desc(ledger.createdAt));
}

export async function getAllLedgerEntries() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(ledger).orderBy(desc(ledger.createdAt));
}

export async function getLastLedgerEntry(): Promise<LedgerEntry | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(ledger).orderBy(desc(ledger.createdAt)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Ω-Gate decisions
 */
export async function createOmegaGateDecision(data: {
  artifactId: string;
  decision: "PASS" | "HOLD" | "REVIEW" | "BLOCK";
  reasoning?: string;
  appliedRules?: any;
  status?: "PENDING" | "APPROVED" | "BLOCKED" | "RELEASED";
  approvedBy?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(omegaGateDecisions).values({
    artifactId: data.artifactId,
    decision: data.decision,
    reasoning: data.reasoning,
    appliedRules: data.appliedRules,
    status: data.status ?? "PENDING",
    approvedBy: data.approvedBy,
  });
}

export async function getOmegaGateDecisionByArtifactId(artifactId: string): Promise<OmegaGateDecision | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(omegaGateDecisions).where(eq(omegaGateDecisions.artifactId, artifactId)).orderBy(desc(omegaGateDecisions.createdAt)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOmegaGateDecisionsByStatus(status: "PENDING" | "APPROVED" | "BLOCKED" | "RELEASED") {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(omegaGateDecisions).where(eq(omegaGateDecisions.status, status)).orderBy(desc(omegaGateDecisions.createdAt));
}

export async function updateOmegaGateDecisionStatus(id: number, status: "PENDING" | "APPROVED" | "BLOCKED" | "RELEASED", approvedBy?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (approvedBy !== undefined) {
    updateData.approvedBy = approvedBy;
  }

  return db.update(omegaGateDecisions).set(updateData).where(eq(omegaGateDecisions.id, id));
}

/**
 * Ω-Gate rules
 */
export async function createOmegaGateRule(data: {
  ruleName: string;
  condition: string;
  decision: "PASS" | "HOLD" | "REVIEW" | "BLOCK";
  priority?: number;
  active?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(omegaGateRules).values({
    ruleName: data.ruleName,
    condition: data.condition,
    decision: data.decision,
    priority: data.priority ?? 0,
    active: data.active ?? true,
  });
}

export async function getActiveOmegaGateRules(): Promise<OmegaGateRule[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(omegaGateRules).where(eq(omegaGateRules.active, true));
}

export async function getAllOmegaGateRules(): Promise<OmegaGateRule[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(omegaGateRules).orderBy(desc(omegaGateRules.priority));
}

/**
 * Statistics
 */
export async function getOmegaGateStatistics() {
  const db = await getDb();
  if (!db) return { PASS: 0, HOLD: 0, REVIEW: 0, BLOCK: 0 };

  const allDecisions = await db.select().from(omegaGateDecisions);
  
  const stats = {
    PASS: 0,
    HOLD: 0,
    REVIEW: 0,
    BLOCK: 0,
  };

  allDecisions.forEach((d) => {
    stats[d.decision]++;
  });

  return stats;
}

export async function getOrganismMetrics() {
  const db = await getDb();
  if (!db) return { totalArtifacts: 0, totalOperations: 0, ledgerSize: 0, integrityScore: 0 };

  const artifactCount = await db.select().from(artifacts);
  const ledgerCount = await db.select().from(ledger);

  return {
    totalArtifacts: artifactCount.length,
    totalOperations: ledgerCount.length,
    ledgerSize: ledgerCount.length,
    integrityScore: 1.0, // Placeholder: can be computed from ledger hashes
  };
}
