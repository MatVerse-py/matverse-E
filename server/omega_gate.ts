import crypto from "crypto";
import { getActiveOmegaGateRules } from "./db";

export type OmegaGateDecision = "PASS" | "HOLD" | "REVIEW" | "BLOCK";
export type SemanticRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface OmegaGateContext {
  artifactId: string;
  content: string;
  trustScore?: number;
  llmRiskLevel?: SemanticRiskLevel;
  llmJustification?: string;
  iSpiValid?: boolean;
}

export interface OmegaGateVerdict {
  decision: OmegaGateDecision;
  reasoning: string;
  riskLevel: SemanticRiskLevel;
  appliedRules: string[];
  integrityMetrics: {
    psi: number; // Information density (0-1)
    omega: number; // Governance closure (0-1)
    theta: number; // System energy (0-1)
  };
}

/**
 * Ω-Gate: Immune system for semantic integrity and governance.
 * Evaluates artifacts against rules and LLM analysis to issue verdicts.
 */
export class OmegaGate {
  /**
   * Evaluate an artifact and issue a verdict.
   */
  static async evaluate(ctx: OmegaGateContext): Promise<OmegaGateVerdict> {
    const rules = await getActiveOmegaGateRules();
    const appliedRules: string[] = [];
    let decision: OmegaGateDecision = "PASS";
    let riskLevel: SemanticRiskLevel = "LOW";

    // Rule 1: Trust score threshold
    if (ctx.trustScore !== undefined && ctx.trustScore < 0.5) {
      appliedRules.push("LOW_TRUST_SCORE");
      decision = "HOLD";
      riskLevel = "MEDIUM";
    }

    // Rule 2: I-SPI validation
    if (ctx.iSpiValid === false) {
      appliedRules.push("ISPI_INVALID");
      decision = "BLOCK";
      riskLevel = "CRITICAL";
    }

    // Rule 3: LLM risk assessment
    if (ctx.llmRiskLevel) {
      if (ctx.llmRiskLevel === "CRITICAL") {
        appliedRules.push("LLM_CRITICAL_RISK");
        decision = "BLOCK";
        riskLevel = "CRITICAL";
      } else if (ctx.llmRiskLevel === "HIGH") {
        appliedRules.push("LLM_HIGH_RISK");
        if (decision !== "BLOCK") decision = "REVIEW";
        riskLevel = "HIGH";
      } else if (ctx.llmRiskLevel === "MEDIUM") {
        appliedRules.push("LLM_MEDIUM_RISK");
        if (decision === "PASS") decision = "HOLD";
        riskLevel = "MEDIUM";
      }
    }

    // Rule 4: Content length sanity check
    if (ctx.content.length === 0) {
      appliedRules.push("EMPTY_CONTENT");
      decision = "BLOCK";
      riskLevel = "HIGH";
    }

    // Rule 5: Semantic laundering detection (placeholder)
    if (ctx.content.includes("SEMANTIC_LAUNDERING_PATTERN")) {
      appliedRules.push("SEMANTIC_LAUNDERING_DETECTED");
      decision = "BLOCK";
      riskLevel = "CRITICAL";
    }

    // Compute integrity metrics
    const integrityMetrics = OmegaGate.computeIntegrityMetrics(ctx, decision, riskLevel);

    return {
      decision,
      reasoning: OmegaGate.generateReasoning(decision, appliedRules, ctx),
      riskLevel,
      appliedRules,
      integrityMetrics,
    };
  }

  /**
   * Compute integrity metrics (Ψ, Ω, Θ).
   */
  private static computeIntegrityMetrics(
    ctx: OmegaGateContext,
    decision: OmegaGateDecision,
    riskLevel: SemanticRiskLevel
  ) {
    // Ψ (Psi): Information density
    const contentLength = ctx.content.length;
    const psi = Math.min(1, contentLength / 10000); // Normalize to 0-1

    // Ω (Omega): Governance closure
    const trustScore = ctx.trustScore ?? 0.5;
    const iSpiValid = ctx.iSpiValid ?? true;
    const omega = (trustScore * 0.6 + (iSpiValid ? 1 : 0) * 0.4);

    // Θ (Theta): System energy / resource availability
    const riskPenalty = riskLevel === "CRITICAL" ? 0.2 : riskLevel === "HIGH" ? 0.4 : riskLevel === "MEDIUM" ? 0.6 : 1;
    const theta = riskPenalty;

    return { psi, omega, theta };
  }

  /**
   * Generate human-readable reasoning for the verdict.
   */
  private static generateReasoning(
    decision: OmegaGateDecision,
    appliedRules: string[],
    ctx: OmegaGateContext
  ): string {
    const ruleDescriptions: Record<string, string> = {
      LOW_TRUST_SCORE: "Trust score below threshold (< 0.5)",
      ISPI_INVALID: "I-SPI validation failed: semantic provenance compromised",
      LLM_CRITICAL_RISK: "LLM detected critical semantic risk",
      LLM_HIGH_RISK: "LLM detected high semantic risk",
      LLM_MEDIUM_RISK: "LLM detected medium semantic risk",
      EMPTY_CONTENT: "Artifact content is empty",
      SEMANTIC_LAUNDERING_DETECTED: "Semantic laundering pattern detected",
    };

    const reasons = appliedRules.map((rule) => ruleDescriptions[rule] || rule);

    if (decision === "PASS") {
      return "Artifact passed all integrity checks. Ω-Gate verdict: PASS.";
    } else if (decision === "HOLD") {
      return `Artifact placed on hold pending review. Reasons: ${reasons.join("; ")}. Ω-Gate verdict: HOLD.`;
    } else if (decision === "REVIEW") {
      return `Artifact requires manual review. Reasons: ${reasons.join("; ")}. Ω-Gate verdict: REVIEW.`;
    } else {
      return `Artifact blocked by Ω-Gate. Reasons: ${reasons.join("; ")}. Ω-Gate verdict: BLOCK.`;
    }
  }

  /**
   * Compute operation hash for ledger chain.
   */
  static computeOperationHash(data: {
    artifactId: string;
    decision: OmegaGateDecision;
    timestamp: number;
    previousHash?: string;
  }): string {
    const input = `${data.artifactId}|${data.decision}|${data.timestamp}|${data.previousHash || "genesis"}`;
    return crypto.createHash("sha256").update(input).digest("hex");
  }
}
