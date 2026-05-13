import { describe, it, expect } from "vitest";
import { TimeSeriesAnalytics } from "./timeseries_analytics";

describe("TimeSeriesAnalytics", () => {
  const mockArtifacts = [
    {
      id: "art-1",
      createdAt: new Date("2026-05-01"),
      omegaGateDecision: "PASS",
      semanticScore: 0.9,
      biasScore: 0.3,
      temporalCoherence: 0.85,
      semanticRiskLevel: "LOW",
    },
    {
      id: "art-2",
      createdAt: new Date("2026-05-02"),
      omegaGateDecision: "HOLD",
      semanticScore: 0.7,
      biasScore: 0.6,
      temporalCoherence: 0.7,
      semanticRiskLevel: "MEDIUM",
    },
    {
      id: "art-3",
      createdAt: new Date("2026-05-03"),
      omegaGateDecision: "BLOCK",
      semanticScore: 0.2,
      biasScore: 0.9,
      temporalCoherence: 0.3,
      semanticRiskLevel: "CRITICAL",
    },
  ];

  describe("calculateTrend", () => {
    it("should calculate trend from data points", () => {
      const dataPoints = [10, 15, 20, 25, 30];
      const trend = TimeSeriesAnalytics.calculateTrend(dataPoints);

      expect(trend.direction).toBe("up");
      expect(trend.startValue).toBe(10);
      expect(trend.endValue).toBe(30);
      expect(trend.changePercent).toBeGreaterThan(0);
    });

    it("should detect downward trend", () => {
      const dataPoints = [30, 25, 20, 15, 10];
      const trend = TimeSeriesAnalytics.calculateTrend(dataPoints);

      expect(trend.direction).toBe("down");
      expect(trend.changePercent).toBeLessThan(0);
    });

    it("should detect stable trend", () => {
      const dataPoints = [10, 10.2, 10.1, 10.3, 10];
      const trend = TimeSeriesAnalytics.calculateTrend(dataPoints);

      expect(trend.direction).toBe("stable");
    });
  });

  describe("aggregateByDecision", () => {
    it("should aggregate artifacts by decision", () => {
      const result = TimeSeriesAnalytics.aggregateByDecision(mockArtifacts);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("timestamp");
      expect(result[0]).toHaveProperty("value");
      expect(result[0]).toHaveProperty("label");
    });
  });

  describe("calculateSemanticTrend", () => {
    it("should calculate semantic score trend", () => {
      const trend = TimeSeriesAnalytics.calculateSemanticTrend(mockArtifacts);

      expect(trend).toHaveProperty("metric");
      expect(trend).toHaveProperty("direction");
      expect(trend).toHaveProperty("changePercent");
    });
  });

  describe("calculateBiasTrend", () => {
    it("should calculate bias score trend", () => {
      const trend = TimeSeriesAnalytics.calculateBiasTrend(mockArtifacts);

      expect(trend).toHaveProperty("metric");
      expect(trend).toHaveProperty("direction");
      expect(trend).toHaveProperty("changePercent");
    });
  });

  describe("detectMisinformationPatterns", () => {
    it("should detect misinformation patterns", () => {
      const patterns = TimeSeriesAnalytics.detectMisinformationPatterns(mockArtifacts);

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toHaveProperty("pattern");
      expect(patterns[0]).toHaveProperty("frequency");
      expect(patterns[0]).toHaveProperty("severity");
    });

    it("should detect critical patterns", () => {
      const patterns = TimeSeriesAnalytics.detectMisinformationPatterns(mockArtifacts);
      const criticalPatterns = patterns.filter((p) => p.severity === "critical");

      expect(criticalPatterns.length).toBeGreaterThan(0);
    });
  });

  describe("analyzePeriod", () => {
    it("should analyze period statistics", () => {
      const startDate = new Date("2026-05-01");
      const endDate = new Date("2026-05-03");

      const analysis = TimeSeriesAnalytics.analyzePeriod(mockArtifacts, startDate, endDate);

      expect(analysis.totalArtifacts).toBe(3);
      expect(analysis.passCount).toBe(1);
      expect(analysis.holdCount).toBe(1);
      expect(analysis.blockCount).toBe(1);
      expect(analysis.averageSemanticScore).toBeGreaterThan(0);
    });

    it("should filter artifacts by date range", () => {
      const startDate = new Date("2026-05-02");
      const endDate = new Date("2026-05-02");

      const analysis = TimeSeriesAnalytics.analyzePeriod(mockArtifacts, startDate, endDate);

      expect(analysis.totalArtifacts).toBe(1);
      expect(analysis.holdCount).toBe(1);
    });
  });

  describe("calculateDecisionDistribution", () => {
    it("should calculate decision distribution", () => {
      const distribution = TimeSeriesAnalytics.calculateDecisionDistribution(mockArtifacts);

      expect(distribution).toHaveLength(4);
      expect(distribution.find((d) => d.decision === "PASS")).toBeDefined();
      expect(distribution.find((d) => d.decision === "BLOCK")).toBeDefined();
    });

    it("should calculate percentages correctly", () => {
      const distribution = TimeSeriesAnalytics.calculateDecisionDistribution(mockArtifacts);
      const totalPercentage = distribution.reduce((sum, d) => sum + d.percentage, 0);

      expect(totalPercentage).toBeCloseTo(100, 1);
    });
  });

  describe("calculateRiskDistribution", () => {
    it("should calculate risk distribution", () => {
      const distribution = TimeSeriesAnalytics.calculateRiskDistribution(mockArtifacts);

      expect(distribution).toHaveLength(4);
      expect(distribution.find((d) => d.risk === "LOW")).toBeDefined();
      expect(distribution.find((d) => d.risk === "CRITICAL")).toBeDefined();
    });
  });

  describe("generateReport", () => {
    it("should generate comprehensive report", () => {
      const report = TimeSeriesAnalytics.generateReport(mockArtifacts, 30);

      expect(report).toHaveProperty("period");
      expect(report).toHaveProperty("trends");
      expect(report).toHaveProperty("patterns");
      expect(report).toHaveProperty("distribution");
    });

    it("should include all report sections", () => {
      const report = TimeSeriesAnalytics.generateReport(mockArtifacts, 30);

      expect(report.period.totalArtifacts).toBe(3);
      expect(report.trends.semantic).toBeDefined();
      expect(report.trends.bias).toBeDefined();
      expect(report.patterns.length).toBeGreaterThan(0);
      expect(report.distribution.decisions).toBeDefined();
      expect(report.distribution.risks).toBeDefined();
    });
  });
});
