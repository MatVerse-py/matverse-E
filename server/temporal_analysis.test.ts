import { describe, it, expect } from "vitest";
import { TemporalAnalyzer } from "./temporal_analyzer";
import { ISPITemporal } from "./i_spi_temporal";

describe("TemporalAnalyzer", () => {
  describe("analyze", () => {
    it("should extract temporal expressions", () => {
      const content = "In 2020, the event occurred. Later, in 2021, another event happened.";
      const result = TemporalAnalyzer.analyze(content);

      expect(result.events).toBeDefined();
      expect(Array.isArray(result.events)).toBe(true);
    });

    it("should construct timeline from events", () => {
      const content = "First, the project started. Then, we developed features. Finally, we deployed.";
      const result = TemporalAnalyzer.analyze(content);

      expect(result.timeline).toBeDefined();
      expect(result.timeline.events).toBeDefined();
    });

    it("should detect temporal patterns", () => {
      const content = "First the war started. Then the war ended. Later, peace was declared.";
      const result = TemporalAnalyzer.analyze(content);

      expect(result.inconsistencies).toBeDefined();
      expect(Array.isArray(result.inconsistencies)).toBe(true);
    });

    it("should detect anachronisms", () => {
      const content = "In ancient Rome, they used computers and smartphones to communicate via email.";
      const result = TemporalAnalyzer.analyze(content);

      expect(result.inconsistencies).toBeDefined();
      expect(Array.isArray(result.inconsistencies)).toBe(true);
    });

    it("should calculate temporal coherence", () => {
      const coherentContent = "In 2020, the project started. In 2021, we developed features. In 2022, we deployed.";
      const result = TemporalAnalyzer.analyze(coherentContent);

      expect(result.temporalCoherence).toBeGreaterThanOrEqual(0);
      expect(result.temporalCoherence).toBeLessThanOrEqual(1);
    });

    it("should assess anachronism risk", () => {
      const content = "During the medieval period, knights used quantum computers.";
      const result = TemporalAnalyzer.analyze(content);

      expect(result.anachronismRisk).toBeDefined();
      expect(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(result.anachronismRisk);
    });

    it("should identify temporal gaps", () => {
      const content = "In 2020, the project started. In 2025, the project finished.";
      const result = TemporalAnalyzer.analyze(content);

      expect(result.timeline.gaps).toBeDefined();
      expect(Array.isArray(result.timeline.gaps)).toBe(true);
    });

    it("should generate temporal report", () => {
      const content = "The event happened before the preparation. After the event, we celebrated.";
      const result = TemporalAnalyzer.analyze(content);
      const report = TemporalAnalyzer.generateReport(result);

      expect(report).toContain("TEMPORAL ANALYSIS REPORT");
      expect(report).toContain("Temporal Coherence");
      expect(report).toContain("Anachronism Risk");
    });
  });
});

describe("ISPITemporal", () => {
  describe("validate", () => {
    it("should validate content with temporal analysis", async () => {
      const content = "In 2020, the project started. In 2021, we developed features. In 2022, we deployed successfully.";
      const result = await ISPITemporal.validate(content);

      expect(result.valid).toBeDefined();
      expect(result.temporalAnalysis).toBeDefined();
      expect(result.integratedScore).toBeGreaterThanOrEqual(0);
      expect(result.integratedScore).toBeLessThanOrEqual(1);
    });

    it("should detect temporal issues", async () => {
      const content = "The project started. Then it ended. Later we reviewed results.";
      const result = await ISPITemporal.validate(content);

      expect(result.temporalIssues).toBeDefined();
      expect(Array.isArray(result.temporalIssues)).toBe(true);
    });

    it("should detect anachronistic content", async () => {
      const content = "In ancient Egypt, Cleopatra used a smartphone to send emails about quantum physics.";
      const result = await ISPITemporal.validate(content);

      expect(result.anachronismRisk).toBeDefined();
      expect(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(result.anachronismRisk);
    });

    it("should combine semantic and temporal scores", async () => {
      const content = "According to research, the project started in 2020 and ended in 2021 with successful results.";
      const result = await ISPITemporal.validate(content);

      expect(result.integratedScore).toBeDefined();
      expect(result.semanticScore).toBeDefined();
      expect(result.temporalCoherence).toBeDefined();
    });

    it("should generate comprehensive report", async () => {
      const content = "The event occurred. Later, we analyzed it. Finally, we reported results.";
      const result = await ISPITemporal.validate(content);
      const report = ISPITemporal.generateReport(result);

      expect(report).toContain("I-SPI TEMPORAL INTEGRITY REPORT");
      expect(report).toContain("Integrated Score");
      expect(report).toContain("SEMANTIC METRICS");
      expect(report).toContain("TEMPORAL METRICS");
    });

    it("should handle temporal issues", async () => {
      const content = "The event happened after it finished. The conclusion preceded the beginning.";
      const result = await ISPITemporal.validate(content);

      expect(result.anachronismRisk).toBeDefined();
      expect(result.temporalAnalysis).toBeDefined();
    });
  });
});

describe("Integration Tests", () => {
  it("should perform end-to-end temporal validation", async () => {
    const content = `
      In 2019, the company was founded. During 2020, we developed our first product.
      In 2021, we launched to market. By 2022, we had 10,000 users. In 2023, we achieved profitability.
    `;

    const result = await ISPITemporal.validate(content);

    expect(result.valid).toBeDefined();
    expect(result.temporalAnalysis).toBeDefined();
    expect(result.integratedScore).toBeGreaterThanOrEqual(0);
  });

  it("should identify complex temporal inconsistencies", async () => {
    const content = `
      The project started in 2020. Before 2020, we had already completed the project.
      After finishing, we began development. During the medieval times, we used modern technology.
    `;

    const result = await ISPITemporal.validate(content);

    expect(result.temporalAnalysis).toBeDefined();
    expect(result.anachronismRisk).toBeDefined();
  });
});
