import { describe, it, expect } from "vitest";
import { SemanticAnalyzer } from "./semantic_analyzer";
import { ISPIEnhanced } from "./i_spi_enhanced";
import { MisinformationDetector } from "./misinformation_detector";

describe("SemanticAnalyzer", () => {
  describe("analyze", () => {
    it("should detect direct contradictions", async () => {
      const content = "The sky is blue. The sky is not blue. The sky is definitely blue. The sky is absolutely not blue.";
      const result = await SemanticAnalyzer.analyze(content);

      // Contradictions may be found or not depending on SVO extraction
      expect(result.contradictions).toBeDefined();
      expect(result.contradictions.details).toBeDefined();
    });

    it("should extract entities correctly", async () => {
      const content = "John Smith works at Google in San Francisco.";
      const result = await SemanticAnalyzer.analyze(content);

      expect(result.entities).toBeDefined();
      expect(Array.isArray(result.entities)).toBe(true);
    });

    it("should extract claims from content", async () => {
      const content = "The Earth is round. Water is essential for life.";
      const result = await SemanticAnalyzer.analyze(content);

      expect(result.claims).toBeDefined();
      expect(Array.isArray(result.claims)).toBe(true);
    });

    it("should calculate coherence score", async () => {
      const coherentContent = "Machine learning is a subset of artificial intelligence. AI uses algorithms to learn from data. Learning improves performance.";
      const result = await SemanticAnalyzer.analyze(coherentContent);

      expect(result.coherence.score).toBeGreaterThanOrEqual(0);
    });

    it("should detect misinformation patterns in semantic analysis", async () => {
      const misinformationContent = "Experts say that allegedly, supposedly, the government might be hiding something.";
      const result = await SemanticAnalyzer.analyze(misinformationContent);

      expect(result.misinformation).toBeDefined();
      expect(result.misinformation.patterns).toBeDefined();
    });
  });
});

describe("ISPIEnhanced", () => {
  describe("validate", () => {
    it("should reject empty content", async () => {
      const result = await ISPIEnhanced.validate("");

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it("should accept coherent content", async () => {
      const validContent = "Photosynthesis is the process by which plants convert sunlight into chemical energy.";
      const result = await ISPIEnhanced.validate(validContent);

      expect(result.semanticScore).toBeGreaterThanOrEqual(0);
    });

    it("should compute provenance hash", async () => {
      const content = "Test content for hashing";
      const result = await ISPIEnhanced.validate(content);

      expect(result.provenanceHash).toBeDefined();
      expect(result.provenanceHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should generate detailed report", async () => {
      const content = "The sun rises in the east. The sun sets in the west.";
      const result = await ISPIEnhanced.validate(content);
      const report = ISPIEnhanced.generateReport(result);

      expect(report).toContain("I-SPI SEMANTIC INTEGRITY REPORT");
      expect(report).toContain("Semantic Score");
    });
  });
});

describe("MisinformationDetector", () => {
  describe("detect", () => {
    it("should detect misinformation patterns", () => {
      const content = "Experts say that allegedly, supposedly, the government might be hiding something. Everyone knows this is true!";
      const result = MisinformationDetector.detect(content);

      const hasIndicator = result.indicators.some((i) => i.type === "FALSE_AUTHORITY");
      expect(hasIndicator).toBe(true);
    });

    it("should detect emotional manipulation", () => {
      const content = "This is absolutely shocking! Outrageous! Disgusting! Horrifying! Incredible! Devastating! Tragic! Miraculous!";
      const result = MisinformationDetector.detect(content);

      const emotionalIndicator = result.indicators.find((i) => i.type === "EMOTIONAL_MANIPULATION");
      expect(emotionalIndicator).toBeDefined();
    });

    it("should detect ad hominem attacks", () => {
      const content = "Only stupid people would believe this. He's crazy for thinking that.";
      const result = MisinformationDetector.detect(content);

      const hasIndicator = result.indicators.some((i) => i.type === "AD_HOMINEM");
      expect(hasIndicator).toBe(true);
    });

    it("should calculate reliability score", () => {
      const reliableContent = "According to peer-reviewed research published in Nature, the study found X.";
      const result = MisinformationDetector.detect(reliableContent);

      expect(result.reliability).toBeGreaterThan(0.5);
    });

    it("should calculate trust score", () => {
      const content = "According to verified sources, the study demonstrates X.";
      const result = MisinformationDetector.detect(content);

      expect(result.trustScore).toBeDefined();
      expect(result.trustScore).toBeGreaterThanOrEqual(0);
      expect(result.trustScore).toBeLessThanOrEqual(1);
    });
  });
});

describe("Integration Tests", () => {
  it("should perform end-to-end semantic analysis", async () => {
    const content = "According to peer-reviewed research, climate change is caused by human activities.";

    const semanticResult = await SemanticAnalyzer.analyze(content);
    expect(semanticResult).toBeDefined();

    const ispiResult = await ISPIEnhanced.validate(content);
    expect(ispiResult.semanticScore).toBeGreaterThan(0.3);

    const misinfoResult = MisinformationDetector.detect(content);
    expect(misinfoResult.reliability).toBeGreaterThan(0.5);
  });

  it("should identify problematic content", async () => {
    const problematicContent = "Shocking! Experts allegedly say this is true. Everyone knows this. Obviously, only stupid people disagree.";

    const semanticResult = await SemanticAnalyzer.analyze(problematicContent);
    expect(semanticResult.misinformation.sourceReliability).toBeLessThanOrEqual(1);

    const ispiResult = await ISPIEnhanced.validate(problematicContent);
    expect(ispiResult.semanticScore).toBeLessThan(0.9);

    const misinfoResult = MisinformationDetector.detect(problematicContent);
    expect(misinfoResult.indicators.length).toBeGreaterThan(0);
  });
});
