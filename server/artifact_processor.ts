import crypto from "crypto";
import { invokeLLM } from "./_core/llm";
import { OmegaGate, OmegaGateDecision, SemanticRiskLevel } from "./omega_gate";
import { ISPI } from "./i_spi";
import { ISPIEnhanced } from "./i_spi_enhanced";
import { MisinformationDetector } from "./misinformation_detector";
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
  semanticScore: number;
  misinformationRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  llmAnalysis?: string;
  integrityMetrics: {
    psi: number;
    omega: number;
    theta: number;
  };
  operationHash: string;
  ledgerEntryId?: number;
  advancedAnalysis?: {
    contradictions: number;
    coherenceScore: number;
    misinformationPatterns: number;
    sourceReliability: number;
  };
}

/**
 * Artifact Processor: Orchestrates the full pipeline for artifact evaluation.
 * Integrates I-SPI validation, Enhanced I-SPI with advanced semantic analysis, LLM analysis, and Ω-Gate decision.
 */
export class ArtifactProcessor {
  /**
   * Process an artifact through the full pipeline.
   */
  static async process(submission: ArtifactSubmission, userId?: number): Promise<ProcessingResult> {
    const artifactId = submission.id || `artifact-${Date.now()}`;
    const contentHash = crypto.createHash("sha256").update(submission.content).digest("hex");

    // Step 1: I-SPI Validation (Basic)
    const iSpiResult = ISPI.validate(submission.content);

    // Step 1b: Enhanced I-SPI with Advanced Semantic Analysis
    const enhancedIspResult = await ISPIEnhanced.validate(submission.content);
    const misinfoProfile = MisinformationDetector.detect(submission.content);

    // Step 2: Map enhanced I-SPI results to risk level
    let llmRiskLevel: SemanticRiskLevel = "LOW";
    if (enhancedIspResult.misinformationRisk === "CRITICAL") {
      llmRiskLevel = "CRITICAL";
    } else if (enhancedIspResult.misinformationRisk === "HIGH") {
      llmRiskLevel = "HIGH";
    } else if (enhancedIspResult.misinformationRisk === "MEDIUM") {
      llmRiskLevel = "MEDIUM";
    }

    // Step 3: LLM Analysis for semantic risk
    let llmAnalysis = "";

    try {
      // Use enhanced semantic analysis in LLM context
      const semanticContext = `
Semantic Analysis Results:
- Semantic Score: ${(enhancedIspResult.semanticScore * 100).toFixed(1)}%
- Coherence Score: ${(enhancedIspResult.coherenceScore * 100).toFixed(1)}%
- Contradiction Score: ${(enhancedIspResult.contradictionScore * 100).toFixed(1)}%
- Misinformation Risk: ${enhancedIspResult.misinformationRisk}
- Source Reliability: ${(misinfoProfile.reliability * 100).toFixed(1)}%
- Detected Patterns: ${misinfoProfile.indicators.length}

Analysis Issues:
${enhancedIspResult.issues.map((i) => `- ${i}`).join("\n")}
`;

      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a semantic integrity analyzer. Evaluate the following artifact for semantic laundering, misinformation, or integrity issues.
            Consider the provided semantic analysis results.
            Respond with JSON: { "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL", "analysis": "brief explanation" }`,
          },
          {
            role: "user",
            content: `Semantic Analysis Context:\n${semanticContext}\n\nArtifact to analyze:\n${submission.content.slice(0, 2000)}`,
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
        const contentStr = typeof content === "string" ? content : JSON.stringify(content);
        const parsed = JSON.parse(contentStr);
        llmRiskLevel = parsed.riskLevel;
        llmAnalysis = parsed.analysis;
      }
    } catch (error) {
      console.warn("[LLM] Analysis failed, using semantic analysis results:", error);
      llmAnalysis = `Semantic analysis: ${enhancedIspResult.misinformationRisk} risk with ${misinfoProfile.indicators.length} patterns detected`;
    }

    // Step 4: Ω-Gate Decision
    const omegaVerdict = await OmegaGate.evaluate({
      artifactId,
      content: submission.content,
      trustScore: submission.trustScore,
      llmRiskLevel,
      llmJustification: llmAnalysis,
      iSpiValid: iSpiResult.valid,
    });

    // Step 5: Compute operation hash
    const operationHash = OmegaGate.computeOperationHash({
      artifactId,
      decision: omegaVerdict.decision,
      timestamp: Date.now(),
    });

    // Step 6: Store artifact metadata
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

    // Step 7: Create Ω-Gate decision record
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

    // Step 8: Append to immutable ledger
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
      semanticScore: enhancedIspResult.semanticScore,
      misinformationRisk: enhancedIspResult.misinformationRisk,
      llmAnalysis,
      integrityMetrics: omegaVerdict.integrityMetrics,
      operationHash,
      advancedAnalysis: {
        contradictions: enhancedIspResult.semanticAnalysis.contradictions,
        coherenceScore: enhancedIspResult.coherenceScore,
        misinformationPatterns: enhancedIspResult.semanticAnalysis.misinformationPatterns,
        sourceReliability: misinfoProfile.reliability,
      },
    };
  }

  /**
   * Evaluate an artifact without processing (no ledger entry).
   */
  static async evaluate(submission: ArtifactSubmission): Promise<Omit<ProcessingResult, "ledgerEntryId">> {
    const artifactId = submission.id || `artifact-eval-${Date.now()}`;

    // I-SPI Validation (Basic)
    const iSpiResult = ISPI.validate(submission.content);

    // Enhanced I-SPI with Advanced Semantic Analysis
    const enhancedIspResult = await ISPIEnhanced.validate(submission.content);
    const misinfoProfile = MisinformationDetector.detect(submission.content);

    // Map enhanced I-SPI results to risk level
    let llmRiskLevel: SemanticRiskLevel = "LOW";
    if (enhancedIspResult.misinformationRisk === "CRITICAL") {
      llmRiskLevel = "CRITICAL";
    } else if (enhancedIspResult.misinformationRisk === "HIGH") {
      llmRiskLevel = "HIGH";
    } else if (enhancedIspResult.misinformationRisk === "MEDIUM") {
      llmRiskLevel = "MEDIUM";
    }

    // LLM Analysis
    let llmAnalysis = "";

    try {
      const semanticContext = `
Semantic Analysis Results:
- Semantic Score: ${(enhancedIspResult.semanticScore * 100).toFixed(1)}%
- Coherence Score: ${(enhancedIspResult.coherenceScore * 100).toFixed(1)}%
- Contradiction Score: ${(enhancedIspResult.contradictionScore * 100).toFixed(1)}%
- Misinformation Risk: ${enhancedIspResult.misinformationRisk}
- Source Reliability: ${(misinfoProfile.reliability * 100).toFixed(1)}%
`;

      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Evaluate semantic integrity. Consider the provided analysis. Respond with JSON: { "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL", "analysis": "brief" }`,
          },
          {
            role: "user",
            content: `Semantic Context:\n${semanticContext}\n\nArtifact:\n${submission.content.slice(0, 2000)}`,
          },
        ],
      });

      if (llmResponse.choices?.[0]?.message?.content) {
        try {
          const content = llmResponse.choices[0].message.content;
          const contentStr = typeof content === "string" ? content : JSON.stringify(content);
          const parsed = JSON.parse(contentStr);
          llmRiskLevel = parsed.riskLevel;
          llmAnalysis = parsed.analysis;
        } catch {
          const content = llmResponse.choices[0].message.content;
          llmAnalysis = typeof content === "string" ? content : JSON.stringify(content);
        }
      }
    } catch (error) {
      console.warn("[LLM] Evaluation failed:", error);
      llmAnalysis = `Semantic analysis: ${enhancedIspResult.misinformationRisk} risk`;
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
      semanticScore: enhancedIspResult.semanticScore,
      misinformationRisk: enhancedIspResult.misinformationRisk,
      llmAnalysis,
      integrityMetrics: omegaVerdict.integrityMetrics,
      operationHash,
      advancedAnalysis: {
        contradictions: enhancedIspResult.semanticAnalysis.contradictions,
        coherenceScore: enhancedIspResult.coherenceScore,
        misinformationPatterns: enhancedIspResult.semanticAnalysis.misinformationPatterns,
        sourceReliability: misinfoProfile.reliability,
      },
    };
  }
}
