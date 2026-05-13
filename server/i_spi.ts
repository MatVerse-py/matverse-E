import crypto from "crypto";

/**
 * I-SPI: Semantic Provenance Invariant
 * Protects against semantic laundering by preserving provenance through transformations.
 */
export class ISPI {
  /**
   * Validate semantic integrity of an artifact.
   * Checks for signs of semantic laundering or provenance corruption.
   */
  static validate(content: string, metadata?: Record<string, any>): {
    valid: boolean;
    issues: string[];
    provenanceHash: string;
  } {
    const issues: string[] = [];

    // Check 1: Content consistency
    if (!content || content.trim().length === 0) {
      issues.push("Empty or whitespace-only content");
    }

    // Check 2: Encoding integrity
    try {
      // Verify UTF-8 encoding
      const buffer = Buffer.from(content, "utf-8");
      const decoded = buffer.toString("utf-8");
      if (decoded !== content) {
        issues.push("Encoding mismatch detected");
      }
    } catch (e) {
      issues.push("Invalid UTF-8 encoding");
    }

    // Check 3: Semantic coherence (placeholder)
    if (ISPI.detectSemanticLaundering(content)) {
      issues.push("Potential semantic laundering pattern detected");
    }

    // Check 4: Metadata consistency
    if (metadata) {
      if (metadata.originalHash && !ISPI.verifyMetadataHash(content, metadata.originalHash)) {
        issues.push("Metadata hash mismatch");
      }
    }

    // Compute provenance hash
    const provenanceHash = ISPI.computeProvenanceHash(content, metadata);

    return {
      valid: issues.length === 0,
      issues,
      provenanceHash,
    };
  }

  /**
   * Detect semantic laundering patterns.
   * Semantic laundering = recontextualizing information to obscure origin or intent.
   */
  private static detectSemanticLaundering(content: string): boolean {
    // Pattern 1: Excessive obfuscation (high entropy, low semantic density)
    const entropy = ISPI.calculateEntropy(content);
    if (entropy > 7.5) {
      // High entropy may indicate compression or obfuscation
      return true;
    }

    // Pattern 2: Suspicious recontextualization markers
    const suspiciousPatterns = [
      /(?:allegedly|supposedly|rumor has it|unconfirmed|anonymous sources?)/gi,
      /(?:no longer|previously|was once|used to be)/gi,
    ];

    let suspiciousCount = 0;
    suspiciousPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 3) suspiciousCount++;
    });

    if (suspiciousCount >= 2) {
      return true;
    }

    // Pattern 3: Contradiction detection (placeholder)
    if (ISPI.detectContradictions(content)) {
      return true;
    }

    return false;
  }

  /**
   * Calculate Shannon entropy of content.
   */
  private static calculateEntropy(content: string): number {
    const len = content.length;
    const frequencies: Record<string, number> = {};

    for (const char of content) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const freq of Object.values(frequencies)) {
      const p = freq / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Detect logical contradictions in content.
   */
  private static detectContradictions(content: string): boolean {
    // Placeholder: Simple contradiction detection
    // In production, use NLP or semantic analysis
    const sentences = content.split(/[.!?]+/);
    const claims: string[] = [];

    for (const sentence of sentences) {
      const trimmed = sentence.trim().toLowerCase();
      if (trimmed.length > 10) {
        claims.push(trimmed);
      }
    }

    // Check for direct contradictions (e.g., "X is true" vs "X is false")
    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        if (ISPI.areContradictory(claims[i], claims[j])) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if two claims are contradictory.
   */
  private static areContradictory(claim1: string, claim2: string): boolean {
    // Extract subjects (placeholder)
    const subject1 = claim1.split(" ")[0];
    const subject2 = claim2.split(" ")[0];

    if (subject1 === subject2) {
      // Check for negation patterns
      const isNegated1 = /\b(not|no|never|false)\b/i.test(claim1);
      const isNegated2 = /\b(not|no|never|false)\b/i.test(claim2);

      if (isNegated1 !== isNegated2) {
        return true; // Likely contradictory
      }
    }

    return false;
  }

  /**
   * Verify metadata hash against content.
   */
  private static verifyMetadataHash(content: string, expectedHash: string): boolean {
    const computed = crypto.createHash("sha256").update(content).digest("hex");
    return computed === expectedHash;
  }

  /**
   * Compute provenance hash for tracking semantic lineage.
   */
  static computeProvenanceHash(content: string, metadata?: Record<string, any>): string {
    const input = JSON.stringify({
      content: content.slice(0, 1000), // Use first 1000 chars for efficiency
      metadata: metadata || {},
      timestamp: Date.now(),
    });

    return crypto.createHash("sha256").update(input).digest("hex");
  }

  /**
   * Create a semantic invariant proof (simplified).
   */
  static createInvariantProof(content: string): {
    contentHash: string;
    provenanceHash: string;
    entropyScore: number;
  } {
    return {
      contentHash: crypto.createHash("sha256").update(content).digest("hex"),
      provenanceHash: ISPI.computeProvenanceHash(content),
      entropyScore: ISPI.calculateEntropy(content),
    };
  }
}
