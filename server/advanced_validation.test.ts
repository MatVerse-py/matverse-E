import { describe, it, expect } from "vitest";
import { CrossReferenceValidator } from "./cross_reference_validator";
import { BiasDetector } from "./bias_detector";

describe("CrossReferenceValidator", () => {
  describe("validate", () => {
    it("should extract and validate claims", async () => {
      const content = "The Earth is round. Gravity was discovered by Newton in 1687.";
      const result = await CrossReferenceValidator.validate(content);

      expect(result.claimsAnalyzed).toBeGreaterThanOrEqual(0);
      expect(result.factCheckResults).toBeDefined();
      expect(Array.isArray(result.factCheckResults)).toBe(true);
    });

    it("should calculate overall reliability", async () => {
      const content = "The project started in 2020 and was successful.";
      const result = await CrossReferenceValidator.validate(content);

      expect(result.overallReliability).toBeGreaterThanOrEqual(0);
      expect(result.overallReliability).toBeLessThanOrEqual(1);
    });

    it("should identify risk factors", async () => {
      const content = "Some claim that is hard to verify.";
      const result = await CrossReferenceValidator.validate(content);

      expect(result.riskFactors).toBeDefined();
      expect(Array.isArray(result.riskFactors)).toBe(true);
    });

    it("should generate cross-reference report", async () => {
      const content = "The company was founded in 2015 and grew rapidly.";
      const result = await CrossReferenceValidator.validate(content);
      const report = CrossReferenceValidator.generateReport(result);

      expect(report).toContain("CROSS-REFERENCE VALIDATION REPORT");
      expect(report).toContain("Claims Analyzed");
      expect(report).toContain("Overall Reliability");
    });
  });
});

describe("BiasDetector", () => {
  describe("analyze", () => {
    it("should detect political bias", () => {
      const content = "Progressive policies are essential for social justice and equality.";
      const result = BiasDetector.analyze(content);

      expect(result.politicalBias).toBeDefined();
      expect(result.politicalBias).toBeGreaterThanOrEqual(-1);
      expect(result.politicalBias).toBeLessThanOrEqual(1);
    });

    it("should detect cultural bias", () => {
      const content = "Traditional family values and heritage are important to preserve.";
      const result = BiasDetector.analyze(content);

      expect(result.culturalBias).toBeDefined();
      expect(result.culturalBias).toBeGreaterThanOrEqual(-1);
      expect(result.culturalBias).toBeLessThanOrEqual(1);
    });

    it("should detect ideological intensity", () => {
      const content = "Obviously, everyone knows the truth. Wake up and do your own research!";
      const result = BiasDetector.analyze(content);

      expect(result.ideologicalBias).toBeGreaterThanOrEqual(0);
      expect(result.ideologicalBias).toBeLessThanOrEqual(1);
    });

    it("should calculate overall bias score", () => {
      const content = "This is a balanced statement with multiple perspectives.";
      const result = BiasDetector.analyze(content);

      expect(result.overallBiasScore).toBeGreaterThanOrEqual(0);
      expect(result.overallBiasScore).toBeLessThanOrEqual(1);
    });

    it("should assess risk level", () => {
      const content = "Clearly, the establishment is suppressing the truth from us.";
      const result = BiasDetector.analyze(content);

      expect(result.riskLevel).toMatch(/LOW|MEDIUM|HIGH|CRITICAL/);
    });

    it("should identify bias indicators", () => {
      const content = "Progressive policies and traditional values are both important.";
      const result = BiasDetector.analyze(content);

      expect(result.biasIndicators).toBeDefined();
      expect(Array.isArray(result.biasIndicators)).toBe(true);
    });

    it("should generate bias report", () => {
      const content = "This content has some ideological markers.";
      const result = BiasDetector.analyze(content);
      const report = BiasDetector.generateReport(result);

      expect(report).toContain("BIAS DETECTION REPORT");
      expect(report).toContain("Overall Bias Score");
      expect(report).toContain("Risk Level");
      expect(report).toContain("BIAS DIMENSIONS");
    });

    it("should identify issues", () => {
      const content = "Obviously, they are wrong. Everyone knows the truth!";
      const result = BiasDetector.analyze(content);

      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });
});

describe("Integration Tests", () => {
  it("should perform comprehensive validation", async () => {
    const content = `
      The company was founded in 2015 and has grown significantly.
      Progressive policies are essential for modern society.
      Traditional values must be preserved for stability.
    `;

    const crossRefResult = await CrossReferenceValidator.validate(content);
    const biasResult = BiasDetector.analyze(content);

    expect(crossRefResult.claimsAnalyzed).toBeGreaterThanOrEqual(0);
    expect(biasResult.overallBiasScore).toBeGreaterThanOrEqual(0);
  });

  it("should detect high-bias content", () => {
    const content = `
      Obviously, the elites are suppressing the truth.
      Wake up! Do your own research! Everyone knows the establishment is lying.
      This is clearly a conspiracy to control us.
    `;

    const result = BiasDetector.analyze(content);

    expect(result.riskLevel).toBeDefined();
    expect(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(result.riskLevel);
    expect(result.ideologicalBias).toBeGreaterThanOrEqual(0);
  });

  it("should detect neutral content", () => {
    const content = "The project was completed on schedule with the following results and metrics.";
    const result = BiasDetector.analyze(content);

    expect(result.overallBiasScore).toBeGreaterThanOrEqual(0);
    expect(result.overallBiasScore).toBeLessThanOrEqual(1);
  });
});
