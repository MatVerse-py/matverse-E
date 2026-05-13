import crypto from "crypto";
import { invokeLLM } from "./_core/llm";
import { OmegaGate, OmegaGateDecision, SemanticRiskLevel } from "./omega_gate";
import { ISPI } from "./i_spi";
import { appendLedgerEntry, createOmegaGateDecision, createArtifact } from "./db";

export interface ArtifactSubmission {
  id: string;
  content: string;
  trustScore?: number;
}

export interface ProcessingResult {
  artifactId: string;
  decision: OmegaGateDecision;
  riskLevel: SemanticRiskLevel;
  reasoning: string;
  iSpiValid: boolean;
  iSpiIssues: string[];
  llmAnalysis?: string;
  integrityMetrics: {
    psi: number;
    omega: number;
    theta: number;
  };
  operationHash: string;
  ledgerEntryId?: number;
}

/**
 * Artifact Processor: Orchestrates the full pipeline for artifact evaluation.
 * Integrates I-SPI validation, LLM analysis, and Ω-Gate decision.
 */
export class ArtifactProcessor {
  /**
   * Process an artifact through the full pipeline.
   */
  static async process(submission: ArtifactSubmission, userId?: number): Promise<ProcessingResult> {
    const artifactId = submission.id || `artifact-${Date.now()}`;
    const contentHash = crypto.createHash("sha256").update(submission.content).digest("hex");

    // Step 1: I-SPI Validation
    const iSpiResult = ISPI.validate(submission.content);

    // Step 2: LLM Analysis for semantic risk
    let llmRiskLevel: SemanticRiskLevel = "LOW";
    let llmAnalysis = "";

    try {
      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a semantic integrity analyzer. Evaluate the following artifact for semantic laundering, misinformation, or integrity issues. 
            Respond with JSON: { "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL", "analysis": "brief explanation" }`,
          },
          {
            role: "user",
            content: `Analyze this artifact for semantic integrity:\n\n${submission.content.slice(0, 2000)}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "semantic_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                riskLevel: {
                  type: "string",
                  enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
                },
                analysis: {
                  type: "string",
                },
              },
              required: ["riskLevel", "analysis"],
              additionalProperties: false,
            },
          },
        },
      });

      if (llmResponse.choices?.[0]?.message?.content) {
        const content = llmResponse.choices[0].message.content;
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        const parsed = JSON.parse(contentStr);
        llmRiskLevel = parsed.riskLevel;
        llmAnalysis = parsed.analysis;
      }
    } catch (error) {
      console.warn("[LLM] Analysis failed, defaulting to LOW risk:", error);
      llmRiskLevel = "LOW";
      llmAnalysis = "LLM analysis unavailable";
    }

    // Step 3: Ω-Gate Decision
    const omegaVerdict = await OmegaGate.evaluate({
      artifactId,
      content: submission.content,
      trustScore: submission.trustScore,
      llmRiskLevel,
      llmJustification: llmAnalysis,
      iSpiValid: iSpiResult.valid,
    });

    // Step 4: Compute operation hash
    const operationHash = OmegaGate.computeOperationHash({
      artifactId,
      decision: omegaVerdict.decision,
      timestamp: Date.now(),
    });

    // Step 5: Store artifact metadata
    try {
      await createArtifact({
        artifactId,
        content: submission.content,
        trustScore: submission.trustScore,
        contentHash,
        submittedBy: userId,
      });
    } catch (error) {
      console.warn("[Artifact] Failed to store metadata:", error);
    }

    // Step 6: Create Ω-Gate decision record
    try {
      await createOmegaGateDecision({
        artifactId,
        decision: omegaVerdict.decision,
        reasoning: omegaVerdict.reasoning,
        appliedRules: omegaVerdict.appliedRules,
      });
    } catch (error) {
      console.warn("[OmegaGate] Failed to store decision:", error);
    }

    // Step 7: Append to immutable ledger
    try {
      await appendLedgerEntry({
        artifactId,
        operationType: "SUBMIT",
        omegaGateDecision: omegaVerdict.decision,
        iSpiValid: iSpiResult.valid,
        semanticRiskLevel: omegaVerdict.riskLevel,
        llmJustification: llmAnalysis,
        integrityMetrics: omegaVerdict.integrityMetrics,
        operationHash,
        actorId: userId,
      });
    } catch (error) {
      console.warn("[Ledger] Failed to append entry:", error);
    }

    return {
      artifactId,
      decision: omegaVerdict.decision,
      riskLevel: omegaVerdict.riskLevel,
      reasoning: omegaVerdict.reasoning,
      iSpiValid: iSpiResult.valid,
      iSpiIssues: iSpiResult.issues,
      llmAnalysis,
      integrityMetrics: omegaVerdict.integrityMetrics,
      operationHash,
    };
  }

  /**
   * Evaluate an artifact without processing (no ledger entry).
   */
  static async evaluate(submission: ArtifactSubmission): Promise<Omit<ProcessingResult, "ledgerEntryId">> {
    const artifactId = submission.id || `artifact-eval-${Date.now()}`;

    // I-SPI Validation
    const iSpiResult = ISPI.validate(submission.content);

    // LLM Analysis
    let llmRiskLevel: SemanticRiskLevel = "LOW";
    let llmAnalysis = "";

    try {
      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Evaluate semantic integrity. Respond with JSON: { "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL", "analysis": "brief" }`,
          },
          {
            role: "user",
            content: `Analyze:\n\n${submission.content.slice(0, 2000)}`,
          },
        ],
      });

      if (llmResponse.choices?.[0]?.message?.content) {
        try {
          const content = llmResponse.choices[0].message.content;
          const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
          const parsed = JSON.parse(contentStr);
          llmRiskLevel = parsed.riskLevel;
          llmAnalysis = parsed.analysis;
        } catch {
          const content = llmResponse.choices[0].message.content;
          llmAnalysis = typeof content === 'string' ? content : JSON.stringify(content);
        }
      }
    } catch (error) {
      console.warn("[LLM] Evaluation failed:", error);
    }

    // Ω-Gate Decision
    const omegaVerdict = await OmegaGate.evaluate({
      artifactId,
      content: submission.content,
      trustScore: submission.trustScore,
      llmRiskLevel,
      llmJustification: llmAnalysis,
      iSpiValid: iSpiResult.valid,
    });

    const operationHash = OmegaGate.computeOperationHash({
      artifactId,
      decision: omegaVerdict.decision,
      timestamp: Date.now(),
    });

    return {
      artifactId,
      decision: omegaVerdict.decision,
      riskLevel: omegaVerdict.riskLevel,
      reasoning: omegaVerdict.reasoning,
      iSpiValid: iSpiResult.valid,
      iSpiIssues: iSpiResult.issues,
      llmAnalysis,
      integrityMetrics: omegaVerdict.integrityMetrics,
      operationHash,
    };
  }
}
