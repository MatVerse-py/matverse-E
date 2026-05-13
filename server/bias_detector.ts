/**
 * Bias Detection Module
 * Identifies political, cultural, and ideological bias in content
 */

export interface BiasIndicator {
  type: "POLITICAL" | "CULTURAL" | "IDEOLOGICAL" | "GENDER" | "RELIGIOUS";
  pattern: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  examples: string[];
}

export interface BiasAnalysisResult {
  biasIndicators: BiasIndicator[];
  politicalBias: number; // -1 (left) to 1 (right)
  culturalBias: number; // -1 (traditional) to 1 (progressive)
  ideologicalBias: number; // 0-1, 0 = neutral, 1 = highly ideological
  overallBiasScore: number; // 0-1
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  issues: string[];
}

export class BiasDetector {
  /**
   * Political bias patterns
   */
  private static POLITICAL_PATTERNS = {
    leftWing: [
      /\b(?:progressive|socialist|communist|marxist|leftist|liberal|woke|cancel culture)\b/gi,
      /\b(?:wealth redistribution|class struggle|bourgeoisie|proletariat)\b/gi,
      /\b(?:systemic racism|white privilege|intersectionality)\b/gi,
    ],
    rightWing: [
      /\b(?:conservative|libertarian|capitalist|nationalist|patriotic|traditional values)\b/gi,
      /\b(?:free market|individual liberty|limited government)\b/gi,
      /\b(?:law and order|strong borders|national sovereignty)\b/gi,
    ],
  };

  /**
   * Cultural bias patterns
   */
  private static CULTURAL_PATTERNS = {
    traditional: [
      /\b(?:traditional|conservative|conventional|heritage|customs|family values)\b/gi,
      /\b(?:respect for authority|hierarchy|order|discipline)\b/gi,
    ],
    progressive: [
      /\b(?:progressive|modern|innovative|diversity|inclusion|equality)\b/gi,
      /\b(?:social justice|equity|representation|empowerment)\b/gi,
    ],
  };

  /**
   * Ideological intensity markers
   */
  private static IDEOLOGICAL_MARKERS = [
    /\b(?:obviously|clearly|undeniably|everyone knows|it's common sense)\b/gi,
    /\b(?:they|those people|the elites|the establishment)\b/gi,
    /\b(?:us vs them|good vs evil|right vs wrong)\b/gi,
    /\b(?:wake up|open your eyes|do your own research)\b/gi,
    /\b(?:conspiracy|coverup|hidden truth|suppressed)\b/gi,
  ];

  /**
   * Emotionally charged language
   */
  private static EMOTIONAL_MARKERS = [
    /\b(?:disgusting|abominable|evil|vile|despicable)\b/gi,
    /\b(?:amazing|wonderful|brilliant|incredible|fantastic)\b/gi,
    /\b(?:destroy|annihilate|eradicate|eliminate)\b/gi,
    /\b(?:love|adore|cherish|treasure)\b/gi,
  ];

  /**
   * Detect bias in content
   */
  static analyze(content: string): BiasAnalysisResult {
    const biasIndicators: BiasIndicator[] = [];

    // Detect political bias
    const politicalBias = BiasDetector.detectPoliticalBias(content, biasIndicators);

    // Detect cultural bias
    const culturalBias = BiasDetector.detectCulturalBias(content, biasIndicators);

    // Detect ideological intensity
    const ideologicalBias = BiasDetector.detectIdeologicalIntensity(content, biasIndicators);

    // Calculate overall bias score
    const overallBiasScore = Math.abs(politicalBias) * 0.4 + Math.abs(culturalBias) * 0.3 + ideologicalBias * 0.3;

    // Determine risk level
    const riskLevel = BiasDetector.assessRiskLevel(overallBiasScore, biasIndicators);

    // Identify issues
    const issues = BiasDetector.identifyIssues(biasIndicators, politicalBias, culturalBias, ideologicalBias);

    return {
      biasIndicators,
      politicalBias,
      culturalBias,
      ideologicalBias,
      overallBiasScore,
      riskLevel,
      issues,
    };
  }

  /**
   * Detect political bias
   */
  private static detectPoliticalBias(content: string, indicators: BiasIndicator[]): number {
    let leftScore = 0;
    let rightScore = 0;

    // Count left-wing patterns
    BiasDetector.POLITICAL_PATTERNS.leftWing.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        leftScore += matches.length;
        indicators.push({
          type: "POLITICAL",
          pattern: pattern.source,
          severity: matches.length > 3 ? "high" : "medium",
          confidence: 0.7,
          examples: matches.slice(0, 2),
        });
      }
    });

    // Count right-wing patterns
    BiasDetector.POLITICAL_PATTERNS.rightWing.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        rightScore += matches.length;
        indicators.push({
          type: "POLITICAL",
          pattern: pattern.source,
          severity: matches.length > 3 ? "high" : "medium",
          confidence: 0.7,
          examples: matches.slice(0, 2),
        });
      }
    });

    // Normalize to -1 (left) to 1 (right)
    const total = leftScore + rightScore;
    if (total === 0) return 0;

    return (rightScore - leftScore) / total;
  }

  /**
   * Detect cultural bias
   */
  private static detectCulturalBias(content: string, indicators: BiasIndicator[]): number {
    let traditionalScore = 0;
    let progressiveScore = 0;

    // Count traditional patterns
    BiasDetector.CULTURAL_PATTERNS.traditional.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        traditionalScore += matches.length;
        indicators.push({
          type: "CULTURAL",
          pattern: pattern.source,
          severity: matches.length > 2 ? "medium" : "low",
          confidence: 0.6,
          examples: matches.slice(0, 2),
        });
      }
    });

    // Count progressive patterns
    BiasDetector.CULTURAL_PATTERNS.progressive.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        progressiveScore += matches.length;
        indicators.push({
          type: "CULTURAL",
          pattern: pattern.source,
          severity: matches.length > 2 ? "medium" : "low",
          confidence: 0.6,
          examples: matches.slice(0, 2),
        });
      }
    });

    // Normalize to -1 (traditional) to 1 (progressive)
    const total = traditionalScore + progressiveScore;
    if (total === 0) return 0;

    return (progressiveScore - traditionalScore) / total;
  }

  /**
   * Detect ideological intensity
   */
  private static detectIdeologicalIntensity(content: string, indicators: BiasIndicator[]): number {
    let intensityScore = 0;
    let markerCount = 0;

    // Count ideological markers
    BiasDetector.IDEOLOGICAL_MARKERS.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        intensityScore += matches.length * 0.15;
        markerCount += matches.length;
        indicators.push({
          type: "IDEOLOGICAL",
          pattern: pattern.source,
          severity: matches.length > 2 ? "high" : "medium",
          confidence: 0.75,
          examples: matches.slice(0, 2),
        });
      }
    });

    // Count emotional markers
    BiasDetector.EMOTIONAL_MARKERS.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        intensityScore += matches.length * 0.1;
        markerCount += matches.length;
      }
    });

    // Normalize to 0-1
    return Math.min(1, intensityScore / Math.max(1, markerCount));
  }

  /**
   * Assess overall risk level
   */
  private static assessRiskLevel(overallBiasScore: number, indicators: BiasIndicator[]): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    const highSeverityCount = indicators.filter((i) => i.severity === "high").length;

    if (overallBiasScore > 0.8 || highSeverityCount > 5) {
      return "CRITICAL";
    } else if (overallBiasScore > 0.6 || highSeverityCount > 3) {
      return "HIGH";
    } else if (overallBiasScore > 0.4 || highSeverityCount > 1) {
      return "MEDIUM";
    }

    return "LOW";
  }

  /**
   * Identify specific issues
   */
  private static identifyIssues(indicators: BiasIndicator[], politicalBias: number, culturalBias: number, ideologicalBias: number): string[] {
    const issues: string[] = [];

    if (Math.abs(politicalBias) > 0.5) {
      const direction = politicalBias > 0 ? "right-wing" : "left-wing";
      issues.push(`Strong ${direction} political bias detected (${(Math.abs(politicalBias) * 100).toFixed(0)}%)`);
    }

    if (Math.abs(culturalBias) > 0.5) {
      const direction = culturalBias > 0 ? "progressive" : "traditional";
      issues.push(`Strong ${direction} cultural bias detected (${(Math.abs(culturalBias) * 100).toFixed(0)}%)`);
    }

    if (ideologicalBias > 0.6) {
      issues.push(`High ideological intensity with us-vs-them framing (${(ideologicalBias * 100).toFixed(0)}%)`);
    }

    const highSeverityCount = indicators.filter((i) => i.severity === "high").length;
    if (highSeverityCount > 3) {
      issues.push(`${highSeverityCount} high-severity bias indicators detected`);
    }

    if (issues.length === 0) {
      issues.push("Content appears relatively neutral or balanced");
    }

    return issues;
  }

  /**
   * Generate bias analysis report
   */
  static generateReport(result: BiasAnalysisResult): string {
    const lines = [
      "═══════════════════════════════════════",
      "BIAS DETECTION REPORT",
      "═══════════════════════════════════════",
      "",
      `Overall Bias Score: ${(result.overallBiasScore * 100).toFixed(1)}%`,
      `Risk Level: ${result.riskLevel}`,
      "",
      "BIAS DIMENSIONS:",
      `  • Political Bias: ${(result.politicalBias * 100).toFixed(1)}% (${result.politicalBias > 0 ? "right-wing" : "left-wing"})`,
      `  • Cultural Bias: ${(result.culturalBias * 100).toFixed(1)}% (${result.culturalBias > 0 ? "progressive" : "traditional"})`,
      `  • Ideological Intensity: ${(result.ideologicalBias * 100).toFixed(1)}%`,
      "",
      "DETECTED INDICATORS:",
      `  Total: ${result.biasIndicators.length}`,
      `  High Severity: ${result.biasIndicators.filter((i) => i.severity === "high").length}`,
      `  Medium Severity: ${result.biasIndicators.filter((i) => i.severity === "medium").length}`,
      `  Low Severity: ${result.biasIndicators.filter((i) => i.severity === "low").length}`,
      "",
    ];

    if (result.issues.length > 0) {
      lines.push("ISSUES:");
      result.issues.forEach((issue) => {
        lines.push(`  ⚠ ${issue}`);
      });
      lines.push("");
    }

    lines.push("═══════════════════════════════════════");
    return lines.join("\n");
  }
}
