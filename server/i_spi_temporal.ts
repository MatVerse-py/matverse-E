/**
 * I-SPI Temporal Enhancement
 * Integrates temporal analysis into semantic provenance validation
 */

import { ISPIEnhanced, ISPIValidationResult } from "./i_spi_enhanced";
import { TemporalAnalyzer, TemporalAnalysisResult } from "./temporal_analyzer";

export interface TemporalValidationResult extends ISPIValidationResult {
  temporalAnalysis: TemporalAnalysisResult;
  temporalCoherence: number;
  anachronismRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  integratedScore: number; // Combines semantic + temporal
  temporalIssues: string[];
}

export class ISPITemporal {
  /**
   * Validate content with both semantic and temporal analysis
   */
  static async validate(content: string): Promise<TemporalValidationResult> {
    // Step 1: Semantic validation
    const semanticResult = await ISPIEnhanced.validate(content);

    // Step 2: Temporal analysis
    const temporalResult = TemporalAnalyzer.analyze(content);

    // Step 3: Integrate results
    const integratedScore = ISPITemporal.calculateIntegratedScore(semanticResult, temporalResult);

    // Step 4: Combine issues
    const temporalIssues = temporalResult.issues;

    // Step 5: Adjust validity based on temporal analysis
    let valid = semanticResult.valid;
    if (temporalResult.anachronismRisk === "CRITICAL") {
      valid = false;
    }

    return {
      ...semanticResult,
      valid,
      temporalAnalysis: temporalResult,
      temporalCoherence: temporalResult.temporalCoherence,
      anachronismRisk: temporalResult.anachronismRisk,
      integratedScore,
      temporalIssues,
      issues: [...semanticResult.issues, ...temporalIssues],
    };
  }

  /**
   * Calculate integrated score combining semantic and temporal metrics
   */
  private static calculateIntegratedScore(semanticResult: ISPIValidationResult, temporalResult: TemporalAnalysisResult): number {
    // Weights: 0.5 semantic, 0.5 temporal
    const semanticComponent = semanticResult.semanticScore * 0.5;
    const temporalComponent = temporalResult.temporalCoherence * 0.5;

    return semanticComponent + temporalComponent;
  }

  /**
   * Generate comprehensive report
   */
  static generateReport(result: TemporalValidationResult): string {
    const lines = [
      "═══════════════════════════════════════════════════════════",
      "I-SPI TEMPORAL INTEGRITY REPORT",
      "═══════════════════════════════════════════════════════════",
      "",
      `Status: ${result.valid ? "✓ VALID" : "✗ INVALID"}`,
      `Integrated Score: ${(result.integratedScore * 100).toFixed(1)}%`,
      "",
      "SEMANTIC METRICS:",
      `  • Semantic Score: ${(result.semanticScore * 100).toFixed(1)}%`,
      `  • Coherence Score: ${(result.coherenceScore * 100).toFixed(1)}%`,
      `  • Contradiction Score: ${(result.contradictionScore * 100).toFixed(1)}%`,
      `  • Misinformation Risk: ${result.misinformationRisk}`,
      "",
      "TEMPORAL METRICS:",
      `  • Temporal Coherence: ${(result.temporalCoherence * 100).toFixed(1)}%`,
      `  • Anachronism Risk: ${result.anachronismRisk}`,
      `  • Events Analyzed: ${result.temporalAnalysis.events.length}`,
      `  • Inconsistencies: ${result.temporalAnalysis.inconsistencies.length}`,
      "",
    ];

    if (result.temporalAnalysis.inconsistencies.length > 0) {
      lines.push("TEMPORAL INCONSISTENCIES:");
      result.temporalAnalysis.inconsistencies.forEach((inc: any) => {
        lines.push(`  [${inc.severity.toUpperCase()}] ${inc.type}: ${inc.description}`);
      });
      lines.push("");
    }

    if (result.issues.length > 0) {
      lines.push("ALL ISSUES:");
      result.issues.forEach((issue: string) => {
        lines.push(`  ⚠ ${issue}`);
      });
      lines.push("");
    }

    lines.push(`Provenance Hash: ${result.provenanceHash.substring(0, 16)}...`);
    lines.push("═══════════════════════════════════════════════════════════");

    return lines.join("\n");
  }
}
