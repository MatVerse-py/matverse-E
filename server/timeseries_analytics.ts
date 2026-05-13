/**
 * Time-Series Analytics Service
 * Aggregates artifact data over time and detects trends
 */

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  label: string;
}

export interface TrendData {
  metric: string;
  direction: "up" | "down" | "stable";
  changePercent: number;
  startValue: number;
  endValue: number;
  dataPoints: TimeSeriesPoint[];
}

export interface MisinformationPattern {
  pattern: string;
  frequency: number;
  trend: "increasing" | "decreasing" | "stable";
  severity: "low" | "medium" | "high" | "critical";
  lastSeen: Date;
  affectedArtifacts: number;
}

export interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
  totalArtifacts: number;
  passCount: number;
  holdCount: number;
  reviewCount: number;
  blockCount: number;
  averageSemanticScore: number;
  averageBiasScore: number;
  averageTemporalCoherence: number;
  misinformationPatterns: MisinformationPattern[];
}

export class TimeSeriesAnalytics {
  /**
   * Calculate trend from data points
   */
  static calculateTrend(dataPoints: number[]): TrendData {
    if (dataPoints.length < 2) {
      return {
        metric: "insufficient_data",
        direction: "stable",
        changePercent: 0,
        startValue: dataPoints[0] || 0,
        endValue: dataPoints[dataPoints.length - 1] || 0,
        dataPoints: [],
      };
    }

    const startValue = dataPoints[0];
    const endValue = dataPoints[dataPoints.length - 1];
    const changePercent = ((endValue - startValue) / Math.abs(startValue || 1)) * 100;

    // Determine direction
    let direction: "up" | "down" | "stable" = "stable";
    if (changePercent > 5) direction = "up";
    else if (changePercent < -5) direction = "down";

    return {
      metric: "trend",
      direction,
      changePercent,
      startValue,
      endValue,
      dataPoints: [],
    };
  }

  /**
   * Aggregate artifacts by decision over time
   */
  static aggregateByDecision(artifacts: any[], bucketSize: number = 86400000): TimeSeriesPoint[] {
    const buckets = new Map<number, { pass: number; hold: number; review: number; block: number }>();

    artifacts.forEach((artifact) => {
      const timestamp = new Date(artifact.createdAt).getTime();
      const bucketKey = Math.floor(timestamp / bucketSize) * bucketSize;

      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, { pass: 0, hold: 0, review: 0, block: 0 });
      }

      const bucket = buckets.get(bucketKey)!;
      const decision = artifact.omegaGateDecision?.toLowerCase() || "unknown";

      if (decision === "pass") bucket.pass++;
      else if (decision === "hold") bucket.hold++;
      else if (decision === "review") bucket.review++;
      else if (decision === "block") bucket.block++;
    });

    return Array.from(buckets.entries())
      .sort(([keyA], [keyB]) => keyA - keyB)
      .map(([key, bucket]) => ({
        timestamp: new Date(key),
        value: bucket.pass + bucket.hold + bucket.review + bucket.block,
        label: new Date(key).toLocaleDateString(),
      }));
  }

  /**
   * Calculate semantic score trend
   */
  static calculateSemanticTrend(artifacts: any[], bucketSize: number = 86400000): TrendData {
    const buckets = new Map<number, { scores: number[] }>();

    artifacts.forEach((artifact) => {
      if (artifact.semanticScore === undefined) return;

      const timestamp = new Date(artifact.createdAt).getTime();
      const bucketKey = Math.floor(timestamp / bucketSize) * bucketSize;

      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, { scores: [] });
      }

      buckets.get(bucketKey)!.scores.push(artifact.semanticScore);
    });

    const dataPoints = Array.from(buckets.entries())
      .sort(([keyA], [keyB]) => keyA - keyB)
      .map(([key, bucket]) => ({
        timestamp: new Date(key),
        value: bucket.scores.reduce((a, b) => a + b, 0) / bucket.scores.length,
        label: new Date(key).toLocaleDateString(),
      }));

    const values = dataPoints.map((p) => p.value);
    return TimeSeriesAnalytics.calculateTrend(values);
  }

  /**
   * Calculate bias score trend
   */
  static calculateBiasTrend(artifacts: any[], bucketSize: number = 86400000): TrendData {
    const buckets = new Map<number, { scores: number[] }>();

    artifacts.forEach((artifact) => {
      if (artifact.biasScore === undefined) return;

      const timestamp = new Date(artifact.createdAt).getTime();
      const bucketKey = Math.floor(timestamp / bucketSize) * bucketSize;

      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, { scores: [] });
      }

      buckets.get(bucketKey)!.scores.push(artifact.biasScore);
    });

    const dataPoints = Array.from(buckets.entries())
      .sort(([keyA], [keyB]) => keyA - keyB)
      .map(([key, bucket]) => ({
        timestamp: new Date(key),
        value: bucket.scores.reduce((a, b) => a + b, 0) / bucket.scores.length,
        label: new Date(key).toLocaleDateString(),
      }));

    const values = dataPoints.map((p) => p.value);
    return TimeSeriesAnalytics.calculateTrend(values);
  }

  /**
   * Detect misinformation patterns
   */
  static detectMisinformationPatterns(artifacts: any[]): MisinformationPattern[] {
    const patterns = new Map<string, { count: number; severity: string; lastSeen: Date; artifacts: number }>();

    artifacts.forEach((artifact) => {
      // Detect high-risk patterns
      if (artifact.semanticRiskLevel === "CRITICAL") {
        const key = "critical_semantic_risk";
        if (!patterns.has(key)) {
          patterns.set(key, { count: 0, severity: "critical", lastSeen: new Date(), artifacts: 0 });
        }
        const pattern = patterns.get(key)!;
        pattern.count++;
        pattern.lastSeen = new Date(artifact.createdAt);
        pattern.artifacts++;
      }

      // Detect high bias
      if (artifact.biasScore !== undefined && artifact.biasScore > 0.8) {
        const key = "high_bias_detected";
        if (!patterns.has(key)) {
          patterns.set(key, { count: 0, severity: "high", lastSeen: new Date(), artifacts: 0 });
        }
        const pattern = patterns.get(key)!;
        pattern.count++;
        pattern.lastSeen = new Date(artifact.createdAt);
        pattern.artifacts++;
      }

      // Detect temporal inconsistencies
      if (artifact.temporalCoherence !== undefined && artifact.temporalCoherence < 0.5) {
        const key = "temporal_inconsistencies";
        if (!patterns.has(key)) {
          patterns.set(key, { count: 0, severity: "medium", lastSeen: new Date(), artifacts: 0 });
        }
        const pattern = patterns.get(key)!;
        pattern.count++;
        pattern.lastSeen = new Date(artifact.createdAt);
        pattern.artifacts++;
      }

      // Detect blocked artifacts
      if (artifact.omegaGateDecision === "BLOCK") {
        const key = "blocked_artifacts";
        if (!patterns.has(key)) {
          patterns.set(key, { count: 0, severity: "critical", lastSeen: new Date(), artifacts: 0 });
        }
        const pattern = patterns.get(key)!;
        pattern.count++;
        pattern.lastSeen = new Date(artifact.createdAt);
        pattern.artifacts++;
      }
    });

    // Calculate trend for each pattern
    return Array.from(patterns.entries()).map(([patternName, data]) => {
      // Simple trend detection: if count is increasing, mark as increasing
      const trend: "increasing" | "decreasing" | "stable" = data.count > 5 ? "increasing" : "stable";

      return {
        pattern: patternName,
        frequency: data.count,
        trend,
        severity: data.severity as "low" | "medium" | "high" | "critical",
        lastSeen: data.lastSeen,
        affectedArtifacts: data.artifacts,
      };
    });
  }

  /**
   * Analyze period statistics
   */
  static analyzePeriod(artifacts: any[], startDate: Date, endDate: Date): AnalyticsPeriod {
    const periodArtifacts = artifacts.filter((a) => {
      const date = new Date(a.createdAt);
      return date >= startDate && date <= endDate;
    });

    const decisions = {
      pass: periodArtifacts.filter((a) => a.omegaGateDecision === "PASS").length,
      hold: periodArtifacts.filter((a) => a.omegaGateDecision === "HOLD").length,
      review: periodArtifacts.filter((a) => a.omegaGateDecision === "REVIEW").length,
      block: periodArtifacts.filter((a) => a.omegaGateDecision === "BLOCK").length,
    };

    const semanticScores = periodArtifacts
      .filter((a) => a.semanticScore !== undefined)
      .map((a) => a.semanticScore);
    const biasScores = periodArtifacts.filter((a) => a.biasScore !== undefined).map((a) => a.biasScore);
    const temporalCoherence = periodArtifacts
      .filter((a) => a.temporalCoherence !== undefined)
      .map((a) => a.temporalCoherence);

    const avgSemantic = semanticScores.length > 0 ? semanticScores.reduce((a, b) => a + b, 0) / semanticScores.length : 0;
    const avgBias = biasScores.length > 0 ? biasScores.reduce((a, b) => a + b, 0) / biasScores.length : 0;
    const avgTemporal = temporalCoherence.length > 0 ? temporalCoherence.reduce((a, b) => a + b, 0) / temporalCoherence.length : 0;

    return {
      startDate,
      endDate,
      totalArtifacts: periodArtifacts.length,
      passCount: decisions.pass,
      holdCount: decisions.hold,
      reviewCount: decisions.review,
      blockCount: decisions.block,
      averageSemanticScore: avgSemantic,
      averageBiasScore: avgBias,
      averageTemporalCoherence: avgTemporal,
      misinformationPatterns: TimeSeriesAnalytics.detectMisinformationPatterns(periodArtifacts),
    };
  }

  /**
   * Calculate decision distribution
   */
  static calculateDecisionDistribution(artifacts: any[]): { decision: string; count: number; percentage: number }[] {
    const total = artifacts.length;
    const decisions = {
      PASS: artifacts.filter((a) => a.omegaGateDecision === "PASS").length,
      HOLD: artifacts.filter((a) => a.omegaGateDecision === "HOLD").length,
      REVIEW: artifacts.filter((a) => a.omegaGateDecision === "REVIEW").length,
      BLOCK: artifacts.filter((a) => a.omegaGateDecision === "BLOCK").length,
    };

    return Object.entries(decisions).map(([decision, count]) => ({
      decision,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));
  }

  /**
   * Calculate risk distribution
   */
  static calculateRiskDistribution(artifacts: any[]): { risk: string; count: number; percentage: number }[] {
    const total = artifacts.length;
    const risks = {
      LOW: artifacts.filter((a) => a.semanticRiskLevel === "LOW").length,
      MEDIUM: artifacts.filter((a) => a.semanticRiskLevel === "MEDIUM").length,
      HIGH: artifacts.filter((a) => a.semanticRiskLevel === "HIGH").length,
      CRITICAL: artifacts.filter((a) => a.semanticRiskLevel === "CRITICAL").length,
    };

    return Object.entries(risks).map(([risk, count]) => ({
      risk,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));
  }

  /**
   * Generate comprehensive analytics report
   */
  static generateReport(artifacts: any[], days: number = 30): {
    period: AnalyticsPeriod;
    trends: { semantic: TrendData; bias: TrendData };
    patterns: MisinformationPattern[];
    distribution: { decisions: any[]; risks: any[] };
  } {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    return {
      period: TimeSeriesAnalytics.analyzePeriod(artifacts, startDate, endDate),
      trends: {
        semantic: TimeSeriesAnalytics.calculateSemanticTrend(artifacts),
        bias: TimeSeriesAnalytics.calculateBiasTrend(artifacts),
      },
      patterns: TimeSeriesAnalytics.detectMisinformationPatterns(artifacts),
      distribution: {
        decisions: TimeSeriesAnalytics.calculateDecisionDistribution(artifacts),
        risks: TimeSeriesAnalytics.calculateRiskDistribution(artifacts),
      },
    };
  }
}
