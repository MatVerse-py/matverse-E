/**
 * Advanced Semantic Analyzer for I-SPI
 * Detects logical contradictions, thematic coherence, and misinformation patterns
 */

interface Entity {
  text: string;
  type: "PERSON" | "ORGANIZATION" | "LOCATION" | "CONCEPT" | "EVENT";
  mentions: number;
}

interface Claim {
  text: string;
  subject: string;
  predicate: string;
  object: string;
  polarity: "positive" | "negative" | "neutral";
  confidence: number;
}

interface SemanticAnalysisResult {
  contradictions: {
    found: boolean;
    count: number;
    details: Array<{
      claim1: string;
      claim2: string;
      severity: "low" | "medium" | "high";
      explanation: string;
    }>;
  };
  coherence: {
    score: number; // 0-1
    topicConsistency: number;
    semanticDensity: number;
    issues: string[];
  };
  misinformation: {
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    patterns: Array<{
      pattern: string;
      confidence: number;
      description: string;
    }>;
    sourceReliability: number; // 0-1
  };
  entities: Entity[];
  claims: Claim[];
}

export class SemanticAnalyzer {
  /**
   * Perform comprehensive semantic analysis
   */
  static async analyze(content: string): Promise<SemanticAnalysisResult> {
    const sentences = SemanticAnalyzer.extractSentences(content);
    const entities = SemanticAnalyzer.extractEntities(content);
    const claims = SemanticAnalyzer.extractClaims(sentences);

    const contradictions = SemanticAnalyzer.detectContradictions(claims);
    const coherence = SemanticAnalyzer.analyzeCoherence(sentences, entities, claims);
    const misinformation = SemanticAnalyzer.detectMisinformationPatterns(content, claims);

    return {
      contradictions,
      coherence,
      misinformation,
      entities,
      claims,
    };
  }

  /**
   * Extract sentences from content
   */
  private static extractSentences(content: string): string[] {
    return content
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);
  }

  /**
   * Extract entities (simplified NER)
   */
  private static extractEntities(content: string): Entity[] {
    const entities: Map<string, Entity> = new Map();

    // Capitalized words (potential proper nouns)
    const properNouns = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    properNouns.forEach((noun) => {
      const key = noun.toLowerCase();
      if (!entities.has(key)) {
        entities.set(key, {
          text: noun,
          type: "PERSON",
          mentions: 1,
        });
      } else {
        const entity = entities.get(key)!;
        entity.mentions++;
      }
    });

    // Organization patterns
    const orgPatterns = /\b(?:Company|Corporation|Organization|Inc|Ltd|LLC|Group)\b/gi;
    const orgs = content.match(new RegExp(`\\b\\w+\\s+(?:${orgPatterns.source})\\b`, "gi")) || [];
    orgs.forEach((org) => {
      const key = org.toLowerCase();
      if (!entities.has(key)) {
        entities.set(key, {
          text: org,
          type: "ORGANIZATION",
          mentions: 1,
        });
      }
    });

    // Location patterns
    const locationPatterns = /\b(?:City|Country|State|Region|Province)\b/gi;
    const locations = content.match(
      new RegExp(`\\b\\w+\\s+(?:${locationPatterns.source})\\b`, "gi")
    ) || [];
    locations.forEach((loc) => {
      const key = loc.toLowerCase();
      if (!entities.has(key)) {
        entities.set(key, {
          text: loc,
          type: "LOCATION",
          mentions: 1,
        });
      }
    });

    return Array.from(entities.values());
  }

  /**
   * Extract claims from sentences
   */
  private static extractClaims(sentences: string[]): Claim[] {
    const claims: Claim[] = [];

    sentences.forEach((sentence) => {
      // Simple SVO (Subject-Verb-Object) extraction
      const svoMatch = sentence.match(/^([^,]+?)\s+(is|are|was|were|have|has|do|does|did|will|would|can|could|should|may|might)\s+(.+?)(?:\.|$)/i);

      if (svoMatch) {
        const [, subject, verb, object] = svoMatch;
        const polarity = /not|no|never|false|deny|reject/i.test(sentence) ? "negative" : "positive";

        claims.push({
          text: sentence,
          subject: subject.trim(),
          predicate: verb.trim(),
          object: object.trim(),
          polarity,
          confidence: 0.7,
        });
      }
    });

    return claims;
  }

  /**
   * Detect logical contradictions
   */
  private static detectContradictions(claims: Claim[]) {
    const contradictions: Array<{
      claim1: string;
      claim2: string;
      severity: "low" | "medium" | "high";
      explanation: string;
    }> = [];

    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        const claim1 = claims[i];
        const claim2 = claims[j];

        // Check if same subject but opposite polarity
        if (
          claim1.subject.toLowerCase() === claim2.subject.toLowerCase() &&
          claim1.object.toLowerCase() === claim2.object.toLowerCase() &&
          claim1.polarity !== claim2.polarity
        ) {
          contradictions.push({
            claim1: claim1.text,
            claim2: claim2.text,
            severity: "high",
            explanation: `Direct contradiction: "${claim1.text}" vs "${claim2.text}"`,
          });
        }

        // Check for temporal contradictions
        const hasTimeRef1 = /\b(?:before|after|during|while|when|previously|later)\b/i.test(
          claim1.text
        );
        const hasTimeRef2 = /\b(?:before|after|during|while|when|previously|later)\b/i.test(
          claim2.text
        );

        if (hasTimeRef1 && hasTimeRef2) {
          const timeOrder1 = /before|previously/i.test(claim1.text) ? "before" : "after";
          const timeOrder2 = /before|previously/i.test(claim2.text) ? "before" : "after";

          if (timeOrder1 !== timeOrder2 && claim1.subject === claim2.subject) {
            contradictions.push({
              claim1: claim1.text,
              claim2: claim2.text,
              severity: "medium",
              explanation: `Temporal inconsistency: conflicting time references`,
            });
          }
        }
      }
    }

    return {
      found: contradictions.length > 0,
      count: contradictions.length,
      details: contradictions,
    };
  }

  /**
   * Analyze thematic coherence
   */
  private static analyzeCoherence(
    sentences: string[],
    entities: Entity[],
    claims: Claim[]
  ) {
    // Topic consistency: measure semantic similarity between sentences
    const keywords = SemanticAnalyzer.extractKeywords(sentences.join(" "));
    const topicConsistency = SemanticAnalyzer.calculateTopicConsistency(sentences, keywords);

    // Semantic density: ratio of meaningful content to total words
    const totalWords = sentences.join(" ").split(/\s+/).length;
    const meaningfulWords = keywords.length;
    const semanticDensity = meaningfulWords > 0 ? meaningfulWords / totalWords : 0;

    // Entity consistency: check if entities are mentioned consistently
    const entityConsistency = entities.filter((e) => e.mentions > 1).length / Math.max(entities.length, 1);

    const coherenceScore = (topicConsistency + semanticDensity + entityConsistency) / 3;

    const issues: string[] = [];
    if (topicConsistency < 0.5) issues.push("Low topic consistency detected");
    if (semanticDensity < 0.3) issues.push("Low semantic density (possibly padding or filler)");
    if (entityConsistency < 0.4) issues.push("Entities mentioned inconsistently");

    return {
      score: Math.min(1, coherenceScore),
      topicConsistency,
      semanticDensity,
      issues,
    };
  }

  /**
   * Extract keywords using frequency analysis
   */
  private static extractKeywords(text: string): string[] {
    const stopwords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "can",
      "this",
      "that",
      "these",
      "those",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
    ]);

    const words = text
      .toLowerCase()
      .match(/\b\w+\b/g) || [];
    const frequency: Record<string, number> = {};

    words.forEach((word) => {
      if (!stopwords.has(word) && word.length > 3) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .filter(([, count]) => count >= 2)
      .map(([word]) => word)
      .slice(0, 10);
  }

  /**
   * Calculate topic consistency between sentences
   */
  private static calculateTopicConsistency(sentences: string[], keywords: string[]): number {
    if (keywords.length === 0) return 0;

    let consistentSentences = 0;
    sentences.forEach((sentence) => {
      const sentenceKeywords = keywords.filter((kw) => sentence.toLowerCase().includes(kw));
      if (sentenceKeywords.length > 0) {
        consistentSentences++;
      }
    });

    return sentences.length > 0 ? consistentSentences / sentences.length : 0;
  }

  /**
   * Detect misinformation patterns
   */
  private static detectMisinformationPatterns(content: string, claims: Claim[]) {
    const patterns: Array<{
      pattern: string;
      confidence: number;
      description: string;
    }> = [];

    // Pattern 1: Excessive hedging (uncertainty indicators)
    const hedgingWords = /\b(?:may|might|could|possibly|allegedly|reportedly|supposedly|seems|appears|arguably)\b/gi;
    const hedgingCount = (content.match(hedgingWords) || []).length;
    if (hedgingCount > 5) {
      patterns.push({
        pattern: "EXCESSIVE_HEDGING",
        confidence: Math.min(1, hedgingCount / 10),
        description: `Excessive use of uncertainty indicators (${hedgingCount} instances)`,
      });
    }

    // Pattern 2: Appeal to authority without evidence
    const appealPatterns = /\b(?:experts say|scientists claim|sources say|they say|people say)\b/gi;
    const appealCount = (content.match(appealPatterns) || []).length;
    if (appealCount > 2) {
      patterns.push({
        pattern: "VAGUE_AUTHORITY",
        confidence: 0.8,
        description: "Appeals to unnamed authorities or sources",
      });
    }

    // Pattern 3: Emotional language (potential manipulation)
    const emotionalWords = /\b(?:shocking|outrageous|disgusting|terrible|amazing|incredible|unbelievable|horrifying)\b/gi;
    const emotionalCount = (content.match(emotionalWords) || []).length;
    if (emotionalCount > 3) {
      patterns.push({
        pattern: "EMOTIONAL_LANGUAGE",
        confidence: 0.7,
        description: `Excessive emotional language (${emotionalCount} instances)`,
      });
    }

    // Pattern 4: Absence of evidence
    if (claims.length === 0) {
      patterns.push({
        pattern: "NO_VERIFIABLE_CLAIMS",
        confidence: 0.9,
        description: "Content contains no verifiable factual claims",
      });
    }

    // Pattern 5: Circular reasoning
    const circularPatterns = /because\s+(.+?)[,.].*\1/gi;
    if (circularPatterns.test(content)) {
      patterns.push({
        pattern: "CIRCULAR_REASONING",
        confidence: 0.8,
        description: "Potential circular reasoning detected",
      });
    }

    // Calculate overall misinformation risk
    const baseRisk = patterns.length * 0.25;
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";

    if (baseRisk >= 0.75) riskLevel = "CRITICAL";
    else if (baseRisk >= 0.5) riskLevel = "HIGH";
    else if (baseRisk >= 0.25) riskLevel = "MEDIUM";

    // Source reliability (inverse of misinformation patterns)
    const sourceReliability = Math.max(0, 1 - baseRisk);

    return {
      riskLevel,
      patterns,
      sourceReliability,
    };
  }
}
