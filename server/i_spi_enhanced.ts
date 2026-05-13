/**
 * Enhanced I-SPI (Semantic Provenance Invariant) with Advanced Analysis
 * Integrates logical contradiction detection, coherence analysis, and misinformation patterns
 */

import { createHash } from "crypto";
import { SemanticAnalyzer } from "./semantic_analyzer";

export interface ISPIValidationResult {
  valid: boolean;
  issues: string[];
  semanticScore: number; // 0-1
  contradictionScore: number; // 0-1
  coherenceScore: number; // 0-1
  misinformationRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  provenanceHash: string;
  semanticAnalysis: {
    contradictions: number;
    coherence: number;
    misinformationPatterns: number;
    sourceReliability: number;
  };
  details: {
    contradictions: Array<{
      claim1: string;
      claim2: string;
      severity: string;
    }>;
    coherenceIssues: string[];
    misinformationPatterns: Array<{
      pattern: string;
      confidence: number;
    }>;
  };
}

export class ISPIEnhanced {
  /**
   * Validate content with advanced semantic analysis
   */
  static async validate(content: string): Promise<ISPIValidationResult> {
    // Basic validation
    const basicIssues = ISPIEnhanced.validateBasic(content);

    if (basicIssues.length > 0 && content.trim().length === 0) {
      return {
        valid: false,
        issues: basicIssues,
        semanticScore: 0,
        contradictionScore: 0,
        coherenceScore: 0,
        misinformationRisk: "CRITICAL",
        provenanceHash: ISPIEnhanced.computeProvenanceHash(content),
        semanticAnalysis: {
          contradictions: 0,
          coherence: 0,
          misinformationPatterns: 0,
          sourceReliability: 0,
        },
        details: {
          contradictions: [],
          coherenceIssues: [],
          misinformationPatterns: [],
        },
      };
    }

    // Advanced semantic analysis
    const semanticAnalysis = await SemanticAnalyzer.analyze(content);

    // Calculate scores
    const contradictionScore = ISPIEnhanced.calculateContradictionScore(semanticAnalysis);
    const coherenceScore = semanticAnalysis.coherence.score;
    const sourceReliability = semanticAnalysis.misinformation.sourceReliability;

    // Determine misinformation risk
    const misinformationRisk = semanticAnalysis.misinformation.riskLevel;

    // Overall semantic score (weighted average)
    const semanticScore = (coherenceScore * 0.4 + (1 - contradictionScore) * 0.3 + sourceReliability * 0.3);

    // Determine validity
    const issues: string[] = [...basicIssues];

    if (contradictionScore > 0.5) {
      issues.push(`High contradiction score: ${(contradictionScore * 100).toFixed(1)}%`);
    }

    if (coherenceScore < 0.5) {
      issues.push("Low thematic coherence detected");
      issues.push(...semanticAnalysis.coherence.issues);
    }

    if (misinformationRisk === "CRITICAL" || misinformationRisk === "HIGH") {
      issues.push(`High misinformation risk: ${misinformationRisk}`);
    }

    const valid = semanticScore >= 0.6 && misinformationRisk !== "CRITICAL";

    return {
      valid,
      issues,
      semanticScore,
      contradictionScore,
      coherenceScore,
      misinformationRisk,
      provenanceHash: ISPIEnhanced.computeProvenanceHash(content),
      semanticAnalysis: {
        contradictions: semanticAnalysis.contradictions.count,
        coherence: coherenceScore,
        misinformationPatterns: semanticAnalysis.misinformation.patterns.length,
        sourceReliability,
      },
      details: {
        contradictions: semanticAnalysis.contradictions.details.map((c) => ({
          claim1: c.claim1,
          claim2: c.claim2,
          severity: c.severity,
        })),
        coherenceIssues: semanticAnalysis.coherence.issues,
        misinformationPatterns: semanticAnalysis.misinformation.patterns.map((p) => ({
          pattern: p.pattern,
          confidence: p.confidence,
        })),
      },
    };
  }

  /**
   * Basic validation checks
   */
  private static validateBasic(content: string): string[] {
    const issues: string[] = [];

    if (!content || content.trim().length === 0) {
      issues.push("Content is empty");
      return issues;
    }

    if (content.length < 20) {
      issues.push("Content too short for meaningful analysis");
    }

    // Check for encoding issues (non-printable characters)
    if (/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g.test(content)) {
      issues.push("Invalid encoding detected");
    }

    // Check for excessive whitespace
    const whitespaceRatio = (content.match(/\s/g) || []).length / content.length;
    if (whitespaceRatio > 0.5) {
      issues.push("Excessive whitespace detected");
    }

    return issues;
  }

  /**
   * Calculate contradiction score (0-1, higher = more contradictions)
   */
  private static calculateContradictionScore(semanticAnalysis: Awaited<ReturnType<typeof SemanticAnalyzer.analyze>>): number {
    const contradictions = semanticAnalysis.contradictions;

    if (!contradictions.found) return 0;

    // Weight by severity
    let score = 0;
    contradictions.details.forEach((detail) => {
      if (detail.severity === "high") score += 0.4;
      else if (detail.severity === "medium") score += 0.2;
      else score += 0.1;
    });

    return Math.min(1, score);
  }

  /**
   * Compute provenance hash
   */
  private static computeProvenanceHash(content: string): string {
    return createHash("sha256").update(content).digest("hex");
  }

  /**
   * Get semantic integrity report
   */
  static generateReport(result: ISPIValidationResult): string {
    const lines = [
      "═══════════════════════════════════════",
      "I-SPI SEMANTIC INTEGRITY REPORT",
      "═══════════════════════════════════════",
      "",
      `Status: ${result.valid ? "✓ VALID" : "✗ INVALID"}`,
      `Overall Semantic Score: ${(result.semanticScore * 100).toFixed(1)}%`,
      "",
      "DETAILED METRICS:",
      `  • Coherence Score: ${(result.coherenceScore * 100).toFixed(1)}%`,
      `  • Contradiction Score: ${(result.contradictionScore * 100).toFixed(1)}%`,
      `  • Misinformation Risk: ${result.misinformationRisk}`,
      `  • Source Reliability: ${(result.semanticAnalysis.sourceReliability * 100).toFixed(1)}%`,
      "",
      "ANALYSIS FINDINGS:",
      `  • Contradictions Detected: ${result.semanticAnalysis.contradictions}`,
      `  • Coherence Issues: ${result.details.coherenceIssues.length}`,
      `  • Misinformation Patterns: ${result.semanticAnalysis.misinformationPatterns}`,
      "",
    ];

    if (result.details.contradictions.length > 0) {
      lines.push("CONTRADICTIONS:");
      result.details.contradictions.forEach((c) => {
        lines.push(`  [${c.severity.toUpperCase()}] "${c.claim1}" vs "${c.claim2}"`);
      });
      lines.push("");
    }

    if (result.details.coherenceIssues.length > 0) {
      lines.push("COHERENCE ISSUES:");
      result.details.coherenceIssues.forEach((issue) => {
        lines.push(`  • ${issue}`);
      });
      lines.push("");
    }

    if (result.details.misinformationPatterns.length > 0) {
      lines.push("MISINFORMATION PATTERNS:");
      result.details.misinformationPatterns.forEach((p) => {
        lines.push(`  • ${p.pattern} (confidence: ${(p.confidence * 100).toFixed(0)}%)`);
      });
      lines.push("");
    }

    if (result.issues.length > 0) {
      lines.push("ISSUES:");
      result.issues.forEach((issue) => {
        lines.push(`  ⚠ ${issue}`);
      });
      lines.push("");
    }

    lines.push(`Provenance Hash: ${result.provenanceHash.substring(0, 16)}...`);
    lines.push("═══════════════════════════════════════");

    return lines.join("\n");
  }
}
