/**
 * Advanced Misinformation Detector
 * Identifies patterns, source reliability, and temporal inconsistencies
 */

interface MisinformationIndicator {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  description: string;
  examples: string[];
}

interface SourceProfile {
  reliability: number; // 0-1
  indicators: MisinformationIndicator[];
  riskFactors: string[];
  trustScore: number; // 0-1
}

export class MisinformationDetector {
  /**
   * Comprehensive misinformation detection
   */
  static detect(content: string): SourceProfile {
    const indicators: MisinformationIndicator[] = [];

    // Run all detection patterns
    indicators.push(...MisinformationDetector.detectFalseAuthority(content));
    indicators.push(...MisinformationDetector.detectEmotionalManipulation(content));
    indicators.push(...MisinformationDetector.detectFalseEquivalence(content));
    indicators.push(...MisinformationDetector.detectStrawman(content));
    indicators.push(...MisinformationDetector.detectAdHominem(content));
    indicators.push(...MisinformationDetector.detectSlipperySlope(content));
    indicators.push(...MisinformationDetector.detectConfirmationBias(content));
    indicators.push(...MisinformationDetector.detectSourceOmission(content));
    indicators.push(...MisinformationDetector.detectTemporalInconsistency(content));

    // Calculate reliability and trust scores
    const reliability = MisinformationDetector.calculateReliability(indicators);
    const trustScore = MisinformationDetector.calculateTrustScore(indicators, reliability);
    const riskFactors = MisinformationDetector.identifyRiskFactors(indicators);

    return {
      reliability,
      indicators,
      riskFactors,
      trustScore,
    };
  }

  /**
   * Detect false authority appeals
   */
  private static detectFalseAuthority(content: string): MisinformationIndicator[] {
    const indicators: MisinformationIndicator[] = [];

    const patterns = [
      { regex: /\b(?:experts say|scientists claim|sources say|they say|people say)\b/gi, desc: "Vague authority appeals" },
      { regex: /\b(?:I've heard|I was told|someone told me|word on the street)\b/gi, desc: "Anecdotal claims" },
      { regex: /\b(?:everyone knows|it's common knowledge|obviously)\b/gi, desc: "Assumed consensus" },
    ];

    patterns.forEach(({ regex, desc }) => {
      const matches = content.match(regex);
      if (matches && matches.length > 0) {
        indicators.push({
          type: "FALSE_AUTHORITY",
          severity: matches.length > 3 ? "high" : "medium",
          confidence: Math.min(1, matches.length / 5),
          description: desc,
          examples: matches.slice(0, 3),
        });
      }
    });

    return indicators;
  }

  /**
   * Detect emotional manipulation
   */
  private static detectEmotionalManipulation(content: string): MisinformationIndicator[] {
    const indicators: MisinformationIndicator[] = [];

    const emotionalWords = /\b(?:shocking|outrageous|disgusting|terrible|amazing|incredible|unbelievable|horrifying|devastating|tragic|miraculous|evil|demonic)\b/gi;
    const matches = content.match(emotionalWords) || [];

    if (matches.length > 3) {
      indicators.push({
        type: "EMOTIONAL_MANIPULATION",
        severity: matches.length > 8 ? "high" : "medium",
        confidence: Math.min(1, matches.length / 10),
        description: "Excessive emotional language designed to bypass rational analysis",
        examples: matches.slice(0, 3),
      });
    }

    return indicators;
  }

  /**
   * Detect false equivalence
   */
  private static detectFalseEquivalence(content: string): MisinformationIndicator[] {
    const indicators: MisinformationIndicator[] = [];

    const patterns = [
      /\b(?:just like|similar to|equivalent to|same as)\s+[^.!?]*(?:therefore|thus|so)\b/gi,
      /\b(?:both sides|equally|same thing)\b.*(?:therefore|thus|so)\b/gi,
    ];

    const matches: string[] = [];
    patterns.forEach((pattern) => {
      const found = content.match(pattern);
      if (found) matches.push(...found);
    });

    if (matches.length > 0) {
      indicators.push({
        type: "FALSE_EQUIVALENCE",
        severity: "medium",
        confidence: 0.7,
        description: "Comparing fundamentally different things as equivalent",
        examples: matches.slice(0, 2),
      });
    }

    return indicators;
  }

  /**
   * Detect strawman arguments
   */
  private static detectStrawman(content: string): MisinformationIndicator[] {
    const indicators: MisinformationIndicator[] = [];

    const patterns = [
      /\b(?:they want to|they're trying to|the goal is to)\s+[^.!?]*(?:therefore|thus|so)\b/gi,
      /\b(?:if we allow|if we accept)\s+[^.!?]*then\s+[^.!?]*will\s+(?:happen|occur|result)\b/gi,
    ];

    const matches: string[] = [];
    patterns.forEach((pattern) => {
      const found = content.match(pattern);
      if (found) matches.push(...found);
    });

    if (matches.length > 0) {
      indicators.push({
        type: "STRAWMAN_ARGUMENT",
        severity: "medium",
        confidence: 0.6,
        description: "Misrepresenting an argument to make it easier to attack",
        examples: matches.slice(0, 2),
      });
    }

    return indicators;
  }

  /**
   * Detect ad hominem attacks
   */
  private static detectAdHominem(content: string): MisinformationIndicator[] {
    const indicators: MisinformationIndicator[] = [];

    const patterns = [
      /\b(?:he's|she's|they're)\s+(?:stupid|dumb|crazy|insane|evil|corrupt|biased)\b/gi,
      /\b(?:only|just)\s+(?:stupid|dumb|crazy)\s+(?:people|person)\s+would\b/gi,
    ];

    const matches: string[] = [];
    patterns.forEach((pattern) => {
      const found = content.match(pattern);
      if (found) matches.push(...found);
    });

    if (matches.length > 0) {
      indicators.push({
        type: "AD_HOMINEM",
        severity: "medium",
        confidence: 0.8,
        description: "Attacking the person instead of addressing the argument",
        examples: matches.slice(0, 2),
      });
    }

    return indicators;
  }

  /**
   * Detect slippery slope fallacy
   */
  private static detectSlipperySlope(content: string): MisinformationIndicator[] {
    const indicators: MisinformationIndicator[] = [];

    const pattern = /\b(?:if we allow|once we accept|first they|eventually)\s+[^.!?]*(?:then|next|eventually|will lead to)\s+[^.!?]*(?:chaos|collapse|disaster|end)\b/gi;
    const matches = content.match(pattern) || [];

    if (matches.length > 0) {
      indicators.push({
        type: "SLIPPERY_SLOPE",
        severity: "medium",
        confidence: 0.7,
        description: "Assuming one event will lead to extreme consequences without evidence",
        examples: matches.slice(0, 2),
      });
    }

    return indicators;
  }

  /**
   * Detect confirmation bias patterns
   */
  private static detectConfirmationBias(content: string): MisinformationIndicator[] {
    const indicators: MisinformationIndicator[] = [];

    const patterns = [
      /\b(?:this proves|this shows|this confirms|this demonstrates)\s+(?:that\s+)?[^.!?]*(?:always|never|all|none)\b/gi,
      /\b(?:as we all know|it's obvious|clearly)\s+[^.!?]*(?:always|never)\b/gi,
    ];

    const matches: string[] = [];
    patterns.forEach((pattern) => {
      const found = content.match(pattern);
      if (found) matches.push(...found);
    });

    if (matches.length > 0) {
      indicators.push({
        type: "CONFIRMATION_BIAS",
        severity: "low",
        confidence: 0.6,
        description: "Selective use of evidence to support pre-existing beliefs",
        examples: matches.slice(0, 2),
      });
    }

    return indicators;
  }

  /**
   * Detect source omission
   */
  private static detectSourceOmission(content: string): MisinformationIndicator[] {
    const indicators: MisinformationIndicator[] = [];

    // Check for claims without citations or sources
    const claimPatterns = /\b(?:research shows|studies prove|data indicates|evidence suggests)\s+[^.!?]*(?:\.|$)/gi;
    const claims = content.match(claimPatterns) || [];

    const citationPatterns = /\b(?:according to|citing|from|source:|reference:|doi:|http|www)\b/gi;
    const citations = content.match(citationPatterns) || [];

    const uncitedRatio = claims.length > 0 ? (claims.length - citations.length) / claims.length : 0;

    if (uncitedRatio > 0.5 && claims.length > 2) {
      indicators.push({
        type: "SOURCE_OMISSION",
        severity: "high",
        confidence: Math.min(1, uncitedRatio),
        description: `${(uncitedRatio * 100).toFixed(0)}% of claims lack citations`,
        examples: claims.slice(0, 2),
      });
    }

    return indicators;
  }

  /**
   * Detect temporal inconsistencies
   */
  private static detectTemporalInconsistency(content: string): MisinformationIndicator[] {
    const indicators: MisinformationIndicator[] = [];

    const timeReferences = content.match(/\b(?:before|after|during|while|when|previously|later|earlier|recently|long ago)\b/gi) || [];

    // Extract sentences with time references
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const timeSentences = sentences.filter((s) => /\b(?:before|after|during|while|when|previously|later|earlier)\b/i.test(s));

    if (timeSentences.length > 2) {
      // Check for contradictory time orders
      const beforeAfter = timeSentences.filter((s) => /before|previously|earlier/i.test(s)).length;
      const afterBefore = timeSentences.filter((s) => /after|later|subsequently/i.test(s)).length;

      if (beforeAfter > 0 && afterBefore > 0) {
        const ratio = Math.abs(beforeAfter - afterBefore) / timeSentences.length;

        if (ratio > 0.3) {
          indicators.push({
            type: "TEMPORAL_INCONSISTENCY",
            severity: "medium",
            confidence: ratio,
            description: "Contradictory or unclear temporal references",
            examples: timeSentences.slice(0, 2),
          });
        }
      }
    }

    return indicators;
  }

  /**
   * Calculate overall reliability score
   */
  private static calculateReliability(indicators: MisinformationIndicator[]): number {
    if (indicators.length === 0) return 1;

    let penalty = 0;
    indicators.forEach((indicator) => {
      const severityWeight = {
        critical: 0.4,
        high: 0.3,
        medium: 0.15,
        low: 0.05,
      };
      penalty += (severityWeight[indicator.severity] || 0) * indicator.confidence;
    });

    return Math.max(0, 1 - penalty);
  }

  /**
   * Calculate trust score
   */
  private static calculateTrustScore(indicators: MisinformationIndicator[], reliability: number): number {
    // Trust score factors in reliability and number of indicators
    const indicatorPenalty = Math.min(0.3, indicators.length * 0.05);
    return Math.max(0, reliability - indicatorPenalty);
  }

  /**
   * Identify key risk factors
   */
  private static identifyRiskFactors(indicators: MisinformationIndicator[]): string[] {
    const factors: string[] = [];

    const criticalIndicators = indicators.filter((i) => i.severity === "critical" || i.severity === "high");
    if (criticalIndicators.length > 0) {
      factors.push(`${criticalIndicators.length} high-severity misinformation patterns detected`);
    }

    const uniqueTypes = new Set(indicators.map((i) => i.type));
    if (uniqueTypes.size > 3) {
      factors.push("Multiple distinct misinformation techniques present");
    }

    const highConfidence = indicators.filter((i) => i.confidence > 0.8);
    if (highConfidence.length > 0) {
      factors.push(`${highConfidence.length} high-confidence misinformation indicators`);
    }

    return factors;
  }
}
