/**
 * Analytics Service
 * Provides metrics and trend analysis for the Helena-E platform
 */

export interface ArtifactMetrics {
  totalSubmitted: number;
  totalProcessed: number;
  passRate: number; // 0-1
  holdRate: number; // 0-1
  reviewRate: number; // 0-1
  blockRate: number; // 0-1
  averageRiskLevel: number; // 0-1
  averageSemanticScore: number; // 0-1
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  label: string;
}

export interface TrendAnalysis {
  metric: string;
  direction: "UP" | "DOWN" | "STABLE";
  changePercent: number;
  dataPoints: TimeSeriesDataPoint[];
}

export interface DashboardMetrics {
  artifacts: ArtifactMetrics;
  trends: TrendAnalysis[];
  topRisks: Array<{ risk: string; count: number; percentage: number }>;
  systemHealth: {
    uptime: number; // percentage
    avgProcessingTime: number; // ms
    errorRate: number; // percentage
  };
}

export class AnalyticsService {
  /**
   * Calculate artifact metrics
   */
  static calculateArtifactMetrics(artifacts: any[]): ArtifactMetrics {
    if (artifacts.length === 0) {
      return {
        totalSubmitted: 0,
        totalProcessed: 0,
        passRate: 0,
        holdRate: 0,
        reviewRate: 0,
        blockRate: 0,
        averageRiskLevel: 0,
        averageSemanticScore: 0,
      };
    }

    const decisions = artifacts.map((a) => a.omegaGateDecision || "UNKNOWN");
    const passCount = decisions.filter((d) => d === "PASS").length;
    const holdCount = decisions.filter((d) => d === "HOLD").length;
    const reviewCount = decisions.filter((d) => d === "REVIEW").length;
    const blockCount = decisions.filter((d) => d === "BLOCK").length;

    const avgRiskLevel = artifacts.reduce((sum, a) => sum + (a.semanticRiskLevel === "CRITICAL" ? 1 : a.semanticRiskLevel === "HIGH" ? 0.7 : a.semanticRiskLevel === "MEDIUM" ? 0.4 : 0.1), 0) / artifacts.length;

    const avgSemanticScore = artifacts.reduce((sum, a) => sum + (a.semanticScore || 0.5), 0) / artifacts.length;

    return {
      totalSubmitted: artifacts.length,
      totalProcessed: artifacts.length,
      passRate: passCount / artifacts.length,
      holdRate: holdCount / artifacts.length,
      reviewRate: reviewCount / artifacts.length,
      blockRate: blockCount / artifacts.length,
      averageRiskLevel: avgRiskLevel,
      averageSemanticScore: avgSemanticScore,
    };
  }

  /**
   * Analyze trends over time
   */
  static analyzeTrends(artifacts: any[], timeWindowDays: number = 30): TrendAnalysis[] {
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindowDays * 24 * 60 * 60 * 1000);

    const recentArtifacts = artifacts.filter((a) => {
      const createdAt = new Date(a.createdAt || now);
      return createdAt >= windowStart;
    });

    const trends: TrendAnalysis[] = [];

    // Submission trend
    const submissionTrend = AnalyticsService.calculateTrend("Submissions", recentArtifacts, timeWindowDays);
    trends.push(submissionTrend);

    // Pass rate trend
    const passRateTrend = AnalyticsService.calculateTrend("Pass Rate", recentArtifacts.filter((a) => a.omegaGateDecision === "PASS"), timeWindowDays);
    trends.push(passRateTrend);

    // Risk level trend
    const riskTrend = AnalyticsService.calculateTrend("Average Risk Level", recentArtifacts, timeWindowDays);
    trends.push(riskTrend);

    return trends;
  }

  /**
   * Calculate trend for a metric
   */
  private static calculateTrend(metric: string, data: any[], timeWindowDays: number): TrendAnalysis {
    const dataPoints: TimeSeriesDataPoint[] = [];

    for (let i = 0; i < timeWindowDays; i++) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - (timeWindowDays - i));
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayData = data.filter((d) => {
        const createdAt = new Date(d.createdAt || new Date());
        return createdAt >= dayStart && createdAt < dayEnd;
      });

      dataPoints.push({
        timestamp: dayStart,
        value: dayData.length,
        label: dayStart.toISOString().split("T")[0],
      });
    }

    // Calculate direction
    const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
    const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

    const firstAvg = firstHalf.reduce((sum, dp) => sum + dp.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, dp) => sum + dp.value, 0) / secondHalf.length;

    const changePercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    const direction = Math.abs(changePercent) < 5 ? "STABLE" : changePercent > 0 ? "UP" : "DOWN";

    return {
      metric,
      direction,
      changePercent,
      dataPoints,
    };
  }

  /**
   * Identify top risks
   */
  static identifyTopRisks(artifacts: any[]): Array<{ risk: string; count: number; percentage: number }> {
    const riskCounts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    artifacts.forEach((a) => {
      const riskLevel = a.semanticRiskLevel || "LOW";
      if (riskLevel in riskCounts) {
        riskCounts[riskLevel as keyof typeof riskCounts]++;
      }
    });

    const total = artifacts.length || 1;

    return [
      { risk: "CRITICAL", count: riskCounts.CRITICAL, percentage: (riskCounts.CRITICAL / total) * 100 },
      { risk: "HIGH", count: riskCounts.HIGH, percentage: (riskCounts.HIGH / total) * 100 },
      { risk: "MEDIUM", count: riskCounts.MEDIUM, percentage: (riskCounts.MEDIUM / total) * 100 },
      { risk: "LOW", count: riskCounts.LOW, percentage: (riskCounts.LOW / total) * 100 },
    ].filter((r) => r.count > 0);
  }

  /**
   * Calculate system health metrics
   */
  static calculateSystemHealth(artifacts: any[], errorCount: number = 0): DashboardMetrics["systemHealth"] {
    const totalArtifacts = artifacts.length || 1;
    const avgProcessingTime = artifacts.reduce((sum, a) => sum + (a.processingTimeMs || 100), 0) / totalArtifacts;

    return {
      uptime: 99.5, // Placeholder
      avgProcessingTime,
      errorRate: (errorCount / totalArtifacts) * 100,
    };
  }

  /**
   * Generate comprehensive dashboard metrics
   */
  static generateDashboardMetrics(artifacts: any[], errorCount: number = 0): DashboardMetrics {
    return {
      artifacts: AnalyticsService.calculateArtifactMetrics(artifacts),
      trends: AnalyticsService.analyzeTrends(artifacts),
      topRisks: AnalyticsService.identifyTopRisks(artifacts),
      systemHealth: AnalyticsService.calculateSystemHealth(artifacts, errorCount),
    };
  }

  /**
   * Generate analytics report
   */
  static generateReport(metrics: DashboardMetrics): string {
    const lines = [
      "═══════════════════════════════════════════════════════════",
      "HELENA-E ANALYTICS DASHBOARD",
      "═══════════════════════════════════════════════════════════",
      "",
      "ARTIFACT METRICS:",
      `  • Total Submitted: ${metrics.artifacts.totalSubmitted}`,
      `  • Total Processed: ${metrics.artifacts.totalProcessed}`,
      `  • Pass Rate: ${(metrics.artifacts.passRate * 100).toFixed(1)}%`,
      `  • Hold Rate: ${(metrics.artifacts.holdRate * 100).toFixed(1)}%`,
      `  • Review Rate: ${(metrics.artifacts.reviewRate * 100).toFixed(1)}%`,
      `  • Block Rate: ${(metrics.artifacts.blockRate * 100).toFixed(1)}%`,
      `  • Average Risk Level: ${(metrics.artifacts.averageRiskLevel * 100).toFixed(1)}%`,
      `  • Average Semantic Score: ${(metrics.artifacts.averageSemanticScore * 100).toFixed(1)}%`,
      "",
      "TRENDS (30-day window):",
      ...metrics.trends.map((t) => `  • ${t.metric}: ${t.direction} (${t.changePercent > 0 ? "+" : ""}${t.changePercent.toFixed(1)}%)`),
      "",
      "TOP RISKS:",
      ...metrics.topRisks.map((r) => `  • ${r.risk}: ${r.count} artifacts (${r.percentage.toFixed(1)}%)`),
      "",
      "SYSTEM HEALTH:",
      `  • Uptime: ${metrics.systemHealth.uptime}%`,
      `  • Avg Processing Time: ${metrics.systemHealth.avgProcessingTime.toFixed(0)}ms`,
      `  • Error Rate: ${metrics.systemHealth.errorRate.toFixed(2)}%`,
      "",
      "═══════════════════════════════════════════════════════════",
    ];

    return lines.join("\n");
  }
}
