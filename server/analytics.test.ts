import { describe, it, expect } from "vitest";
import { AnalyticsService } from "./analytics_service";

describe("AnalyticsService", () => {
  const mockArtifacts = [
    {
      id: "1",
      omegaGateDecision: "PASS",
      semanticRiskLevel: "LOW",
      semanticScore: 0.9,
      createdAt: new Date(),
      processingTimeMs: 150,
    },
    {
      id: "2",
      omegaGateDecision: "HOLD",
      semanticRiskLevel: "MEDIUM",
      semanticScore: 0.6,
      createdAt: new Date(),
      processingTimeMs: 200,
    },
    {
      id: "3",
      omegaGateDecision: "REVIEW",
      semanticRiskLevel: "HIGH",
      semanticScore: 0.4,
      createdAt: new Date(),
      processingTimeMs: 300,
    },
    {
      id: "4",
      omegaGateDecision: "BLOCK",
      semanticRiskLevel: "CRITICAL",
      semanticScore: 0.1,
      createdAt: new Date(),
      processingTimeMs: 100,
    },
  ];

  describe("calculateArtifactMetrics", () => {
    it("should calculate artifact metrics", () => {
      const metrics = AnalyticsService.calculateArtifactMetrics(mockArtifacts);

      expect(metrics.totalSubmitted).toBe(4);
      expect(metrics.totalProcessed).toBe(4);
      expect(metrics.passRate).toBeCloseTo(0.25, 1);
      expect(metrics.holdRate).toBeCloseTo(0.25, 1);
      expect(metrics.reviewRate).toBeCloseTo(0.25, 1);
      expect(metrics.blockRate).toBeCloseTo(0.25, 1);
    });

    it("should handle empty artifacts", () => {
      const metrics = AnalyticsService.calculateArtifactMetrics([]);

      expect(metrics.totalSubmitted).toBe(0);
      expect(metrics.passRate).toBe(0);
    });

    it("should calculate average risk level", () => {
      const metrics = AnalyticsService.calculateArtifactMetrics(mockArtifacts);

      expect(metrics.averageRiskLevel).toBeGreaterThan(0);
      expect(metrics.averageRiskLevel).toBeLessThanOrEqual(1);
    });

    it("should calculate average semantic score", () => {
      const metrics = AnalyticsService.calculateArtifactMetrics(mockArtifacts);

      expect(metrics.averageSemanticScore).toBeGreaterThan(0);
      expect(metrics.averageSemanticScore).toBeLessThanOrEqual(1);
    });
  });

  describe("analyzeTrends", () => {
    it("should analyze trends", () => {
      const trends = AnalyticsService.analyzeTrends(mockArtifacts);

      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
    });

    it("should include trend direction", () => {
      const trends = AnalyticsService.analyzeTrends(mockArtifacts);

      trends.forEach((trend) => {
        expect(["UP", "DOWN", "STABLE"]).toContain(trend.direction);
      });
    });

    it("should include data points", () => {
      const trends = AnalyticsService.analyzeTrends(mockArtifacts, 7);

      trends.forEach((trend) => {
        expect(trend.dataPoints).toBeDefined();
        expect(Array.isArray(trend.dataPoints)).toBe(true);
      });
    });
  });

  describe("identifyTopRisks", () => {
    it("should identify top risks", () => {
      const risks = AnalyticsService.identifyTopRisks(mockArtifacts);

      expect(risks).toBeDefined();
      expect(Array.isArray(risks)).toBe(true);
    });

    it("should include risk counts", () => {
      const risks = AnalyticsService.identifyTopRisks(mockArtifacts);

      risks.forEach((risk) => {
        expect(risk.risk).toBeDefined();
        expect(risk.count).toBeGreaterThanOrEqual(0);
        expect(risk.percentage).toBeGreaterThanOrEqual(0);
      });
    });

    it("should handle empty artifacts", () => {
      const risks = AnalyticsService.identifyTopRisks([]);

      expect(risks).toBeDefined();
      expect(Array.isArray(risks)).toBe(true);
    });
  });

  describe("calculateSystemHealth", () => {
    it("should calculate system health", () => {
      const health = AnalyticsService.calculateSystemHealth(mockArtifacts);

      expect(health.uptime).toBeGreaterThanOrEqual(0);
      expect(health.uptime).toBeLessThanOrEqual(100);
      expect(health.avgProcessingTime).toBeGreaterThan(0);
      expect(health.errorRate).toBeGreaterThanOrEqual(0);
    });

    it("should include error rate", () => {
      const health = AnalyticsService.calculateSystemHealth(mockArtifacts, 1);

      expect(health.errorRate).toBeGreaterThan(0);
    });
  });

  describe("generateDashboardMetrics", () => {
    it("should generate comprehensive dashboard metrics", () => {
      const metrics = AnalyticsService.generateDashboardMetrics(mockArtifacts);

      expect(metrics.artifacts).toBeDefined();
      expect(metrics.trends).toBeDefined();
      expect(metrics.topRisks).toBeDefined();
      expect(metrics.systemHealth).toBeDefined();
    });

    it("should generate analytics report", () => {
      const metrics = AnalyticsService.generateDashboardMetrics(mockArtifacts);
      const report = AnalyticsService.generateReport(metrics);

      expect(report).toContain("HELENA-E ANALYTICS DASHBOARD");
      expect(report).toContain("ARTIFACT METRICS");
      expect(report).toContain("TRENDS");
      expect(report).toContain("TOP RISKS");
      expect(report).toContain("SYSTEM HEALTH");
    });
  });
});
