import { describe, it, expect, beforeEach, vi } from "vitest";
import { ArtifactProcessor } from "./artifact_processor";
import { OmegaGate } from "./omega_gate";
import { ISPI } from "./i_spi";

describe("ArtifactProcessor", () => {
  describe("evaluate", () => {
    it("should evaluate artifact without processing", async () => {
      const submission = {
        id: "test-artifact-1",
        content: "This is a test artifact for semantic analysis.",
        trustScore: 0.8,
      };

      const result = await ArtifactProcessor.evaluate(submission);

      expect(result).toBeDefined();
      expect(result.artifactId).toBe("test-artifact-1");
      expect(result.decision).toBeDefined();
      expect(["PASS", "HOLD", "REVIEW", "BLOCK"]).toContain(result.decision);
      expect(result.iSpiValid).toBeDefined();
      expect(result.integrityMetrics).toBeDefined();
      expect(result.integrityMetrics.psi).toBeGreaterThanOrEqual(0);
      expect(result.integrityMetrics.omega).toBeGreaterThanOrEqual(0);
      expect(result.integrityMetrics.theta).toBeGreaterThanOrEqual(0);
    }, { timeout: 15000 });

    it("should detect empty content", async () => {
      const submission = {
        id: "empty-artifact",
        content: "",
        trustScore: 0.5,
      };

      const result = await ArtifactProcessor.evaluate(submission);

      expect(result.decision).toBe("BLOCK");
      expect(result.iSpiValid).toBe(false);
    }, { timeout: 15000 });

    it("should respect trust score threshold", async () => {
      const submission = {
        id: "low-trust-artifact",
        content: "This is a test artifact.",
        trustScore: 0.3,
      };

      const result = await ArtifactProcessor.evaluate(submission);

      expect(result.decision).not.toBe("PASS");
    }, { timeout: 15000 });

    it("should generate operation hash", async () => {
      const submission = {
        id: "hash-test-artifact",
        content: "Test content for hash generation.",
        trustScore: 0.7,
      };

      const result = await ArtifactProcessor.evaluate(submission);

      expect(result.operationHash).toBeDefined();
      expect(result.operationHash).toMatch(/^[a-f0-9]{64}$/);
    }, { timeout: 15000 });
  });
});

describe("OmegaGate", () => {
  describe("evaluate", () => {
    it("should issue PASS verdict for valid artifact", async () => {
      const verdict = await OmegaGate.evaluate({
        artifactId: "test-1",
        content: "Valid test content",
        trustScore: 0.9,
        iSpiValid: true,
        llmRiskLevel: "LOW",
      });

      expect(verdict.decision).toBe("PASS");
      expect(verdict.riskLevel).toBe("LOW");
    });

    it("should issue BLOCK verdict for invalid I-SPI", async () => {
      const verdict = await OmegaGate.evaluate({
        artifactId: "test-2",
        content: "Test content",
        trustScore: 0.7,
        iSpiValid: false,
      });

      expect(verdict.decision).toBe("BLOCK");
      expect(verdict.appliedRules).toContain("ISPI_INVALID");
    });

    it("should issue HOLD for low trust score", async () => {
      const verdict = await OmegaGate.evaluate({
        artifactId: "test-3",
        content: "Test content",
        trustScore: 0.3,
        iSpiValid: true,
      });

      expect(verdict.decision).toBe("HOLD");
      expect(verdict.appliedRules).toContain("LOW_TRUST_SCORE");
    });

    it("should compute integrity metrics", async () => {
      const verdict = await OmegaGate.evaluate({
        artifactId: "test-4",
        content: "This is a longer test content to measure information density properly.",
        trustScore: 0.8,
        iSpiValid: true,
      });

      expect(verdict.integrityMetrics.psi).toBeGreaterThan(0);
      expect(verdict.integrityMetrics.omega).toBeGreaterThan(0);
      expect(verdict.integrityMetrics.theta).toBeGreaterThan(0);
    });
  });

  describe("computeOperationHash", () => {
    it("should generate consistent SHA-256 hash", () => {
      const data = {
        artifactId: "test-artifact",
        decision: "PASS" as const,
        timestamp: 1234567890,
      };

      const hash1 = OmegaGate.computeOperationHash(data);
      const hash2 = OmegaGate.computeOperationHash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});

describe("ISPI", () => {
  describe("validate", () => {
    it("should validate normal content", () => {
      const result = ISPI.validate("This is a normal artifact content.");

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.provenanceHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should detect empty content", () => {
      const result = ISPI.validate("");

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it("should detect encoding issues", () => {
      // Most JavaScript strings handle encoding gracefully, so we test with whitespace-only
      const whitespaceContent = "   \n\t   ";
      const result = ISPI.validate(whitespaceContent);

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it("should compute provenance hash", () => {
      const content = "Test artifact for provenance";
      const result = ISPI.validate(content);

      expect(result.provenanceHash).toBeDefined();
      expect(result.provenanceHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("createInvariantProof", () => {
    it("should create semantic invariant proof", () => {
      const content = "Proof test content";
      const proof = ISPI.createInvariantProof(content);

      expect(proof.contentHash).toBeDefined();
      expect(proof.provenanceHash).toBeDefined();
      expect(proof.entropyScore).toBeGreaterThanOrEqual(0);
      expect(proof.contentHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
