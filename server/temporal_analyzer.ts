/**
 * Advanced Temporal Analyzer
 * Extracts events, constructs timelines, and detects chronological inconsistencies
 */

interface TemporalExpression {
  text: string;
  type: "ABSOLUTE" | "RELATIVE" | "DURATION" | "FREQUENCY";
  value?: string;
  year?: number;
  month?: number;
  day?: number;
  confidence: number;
}

interface Event {
  text: string;
  subject: string;
  action: string;
  timestamp?: Date;
  temporalExpression?: TemporalExpression;
  relativeOrder?: "BEFORE" | "AFTER" | "DURING" | "SIMULTANEOUS";
  confidence: number;
}

interface Timeline {
  events: Event[];
  startDate?: Date;
  endDate?: Date;
  duration?: number; // in days
  gaps: Array<{ start: Date; end: Date; duration: number }>;
}

interface TemporalInconsistency {
  type: "CHRONOLOGICAL_VIOLATION" | "ANACHRONISM" | "TEMPORAL_GAP" | "DURATION_VIOLATION";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  events: Event[];
  confidence: number;
}

export interface TemporalAnalysisResult {
  events: Event[];
  timeline: Timeline;
  inconsistencies: TemporalInconsistency[];
  temporalCoherence: number; // 0-1
  anachronismRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  issues: string[];
}

export class TemporalAnalyzer {
  /**
   * Perform comprehensive temporal analysis
   */
  static analyze(content: string): TemporalAnalysisResult {
    const sentences = TemporalAnalyzer.extractSentences(content);
    const temporalExpressions = TemporalAnalyzer.extractTemporalExpressions(content);
    const events = TemporalAnalyzer.extractEvents(sentences, temporalExpressions);
    const timeline = TemporalAnalyzer.constructTimeline(events);
    const inconsistencies = TemporalAnalyzer.detectInconsistencies(events, timeline);

    const temporalCoherence = TemporalAnalyzer.calculateCoherence(events, inconsistencies);
    const anachronismRisk = TemporalAnalyzer.assessAnachronismRisk(inconsistencies);
    const issues = TemporalAnalyzer.identifyIssues(inconsistencies);

    return {
      events,
      timeline,
      inconsistencies,
      temporalCoherence,
      anachronismRisk,
      issues,
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
   * Extract temporal expressions (dates, times, durations)
   */
  private static extractTemporalExpressions(content: string): TemporalExpression[] {
    const expressions: TemporalExpression[] = [];

    // Absolute dates (YYYY, YYYY-MM-DD, Month Year)
    const absolutePatterns = [
      { regex: /\b(\d{4})\b/g, type: "ABSOLUTE" as const, processor: (m: string) => ({ year: parseInt(m) }) },
      { regex: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi, type: "ABSOLUTE" as const },
      { regex: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, type: "ABSOLUTE" as const },
    ];

    absolutePatterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        expressions.push({
          text: match[0],
          type,
          confidence: 0.9,
        });
      }
    });

    // Relative temporal expressions
    const relativePatterns = [
      /\b(before|after|during|while|when|previously|later|earlier|soon|recently|long ago|then|now)\b/gi,
      /\b(yesterday|today|tomorrow|last\s+(?:week|month|year)|next\s+(?:week|month|year))\b/gi,
    ];

    relativePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        expressions.push({
          text: match[0],
          type: "RELATIVE",
          confidence: 0.7,
        });
      }
    });

    // Durations
    const durationPattern = /\b(\d+)\s+(?:days?|weeks?|months?|years?|hours?|minutes?|seconds?)\b/gi;
    let match;
    while ((match = durationPattern.exec(content)) !== null) {
      expressions.push({
        text: match[0],
        type: "DURATION",
        value: match[1],
        confidence: 0.85,
      });
    }

    return expressions;
  }

  /**
   * Extract events from sentences
   */
  private static extractEvents(sentences: string[], temporalExpressions: TemporalExpression[]): Event[] {
    const events: Event[] = [];

    sentences.forEach((sentence, index) => {
      // Find temporal expression in sentence
      const sentenceTemporalExpr = temporalExpressions.find((te) => sentence.includes(te.text));

      // Extract subject-verb-object
      const svoMatch = sentence.match(/^([^,]+?)\s+(was|were|is|are|did|does|has|have|will|would|could|should)\s+(.+?)(?:\.|$)/i);

      if (svoMatch) {
        const [, subject, verb, action] = svoMatch;

        // Extract relative temporal order
        let relativeOrder: Event["relativeOrder"] = undefined;
        if (/before|previously|earlier|ago/i.test(sentence)) relativeOrder = "BEFORE";
        else if (/after|later|subsequently|then/i.test(sentence)) relativeOrder = "AFTER";
        else if (/during|while|when/i.test(sentence)) relativeOrder = "DURING";
        else if (/simultaneously|at the same time|meanwhile/i.test(sentence)) relativeOrder = "SIMULTANEOUS";

        events.push({
          text: sentence,
          subject: subject.trim(),
          action: action.trim(),
          temporalExpression: sentenceTemporalExpr,
          relativeOrder,
          confidence: 0.75,
        });
      }
    });

    return events;
  }

  /**
   * Construct timeline from events
   */
  private static constructTimeline(events: Event[]): Timeline {
    const timeline: Timeline = {
      events: events.sort((a, b) => {
        // Sort by temporal order
        if (a.relativeOrder === "BEFORE" && b.relativeOrder === "AFTER") return -1;
        if (a.relativeOrder === "AFTER" && b.relativeOrder === "BEFORE") return 1;
        return 0;
      }),
      gaps: [],
    };

    // Identify temporal gaps
    for (let i = 0; i < timeline.events.length - 1; i++) {
      const current = timeline.events[i];
      const next = timeline.events[i + 1];

      if (
        current.relativeOrder === "BEFORE" &&
        next.relativeOrder === "AFTER" &&
        current.timestamp &&
        next.timestamp
      ) {
        const gapDuration = Math.floor((next.timestamp.getTime() - current.timestamp.getTime()) / (1000 * 60 * 60 * 24));
        if (gapDuration > 30) {
          // Significant gap
          timeline.gaps.push({
            start: current.timestamp,
            end: next.timestamp,
            duration: gapDuration,
          });
        }
      }
    }

    return timeline;
  }

  /**
   * Detect chronological inconsistencies
   */
  private static detectInconsistencies(events: Event[], timeline: Timeline): TemporalInconsistency[] {
    const inconsistencies: TemporalInconsistency[] = [];

    // Check for chronological violations
    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];

      // Violation: event marked as "AFTER" appears before "BEFORE"
      if (current.relativeOrder === "AFTER" && next.relativeOrder === "BEFORE") {
        inconsistencies.push({
          type: "CHRONOLOGICAL_VIOLATION",
          severity: "high",
          description: `Chronological violation: "${current.text}" marked as AFTER but appears before "${next.text}" marked as BEFORE`,
          events: [current, next],
          confidence: 0.8,
        });
      }

      // Violation: same subject with contradictory actions in wrong order
      if (
        current.subject.toLowerCase() === next.subject.toLowerCase() &&
        current.relativeOrder === "AFTER" &&
        next.relativeOrder === "BEFORE"
      ) {
        inconsistencies.push({
          type: "CHRONOLOGICAL_VIOLATION",
          severity: "critical",
          description: `Same subject (${current.subject}) performs contradictory actions in wrong temporal order`,
          events: [current, next],
          confidence: 0.9,
        });
      }
    }

    // Check for anachronisms (events referencing future technology/knowledge in past)
    const anachronismPatterns = [
      /\b(?:computer|internet|email|smartphone|television|airplane|nuclear|rocket|satellite|DNA|quantum|AI|robot)\b/gi,
      /\b(?:in the year \d{4}|in \d{4}|during the \d{4}s)\b/gi,
    ];

    events.forEach((event, index) => {
      anachronismPatterns.forEach((pattern) => {
        if (pattern.test(event.text)) {
          // Check if event is marked as historical/past
          if (event.relativeOrder === "BEFORE" || /\b(?:ancient|medieval|victorian|renaissance|classical)\b/i.test(event.text)) {
            inconsistencies.push({
              type: "ANACHRONISM",
              severity: "high",
              description: `Potential anachronism: modern concept in historical context - "${event.text}"`,
              events: [event],
              confidence: 0.7,
            });
          }
        }
      });
    });

    // Check for temporal gaps indicating missing information
    timeline.gaps.forEach((gap) => {
      if (gap.duration > 365) {
        // Gap > 1 year
        inconsistencies.push({
          type: "TEMPORAL_GAP",
          severity: "medium",
          description: `Significant temporal gap of ${gap.duration} days detected in narrative`,
          events: [],
          confidence: 0.6,
        });
      }
    });

    // Check for duration violations
    events.forEach((event) => {
      if (event.temporalExpression?.type === "DURATION") {
        const durationMatch = event.text.match(/took|lasted|continued for|spent|required\s+(\d+)\s+(?:days?|weeks?|months?|years?)/i);
        if (durationMatch) {
          // Verify duration makes sense in context
          if (/impossible|instant|immediate/i.test(event.text) && parseInt(durationMatch[1]) > 30) {
            inconsistencies.push({
              type: "DURATION_VIOLATION",
              severity: "medium",
              description: `Duration violation: action described as impossible/instant but attributed ${durationMatch[1]} time units`,
              events: [event],
              confidence: 0.7,
            });
          }
        }
      }
    });

    return inconsistencies;
  }

  /**
   * Calculate temporal coherence
   */
  private static calculateCoherence(events: Event[], inconsistencies: TemporalInconsistency[]): number {
    if (events.length === 0) return 0;

    const violationCount = inconsistencies.filter((i) => i.type === "CHRONOLOGICAL_VIOLATION").length;
    const anachronismCount = inconsistencies.filter((i) => i.type === "ANACHRONISM").length;

    const penalty = (violationCount * 0.3 + anachronismCount * 0.2) / Math.max(events.length, 1);
    return Math.max(0, 1 - penalty);
  }

  /**
   * Assess anachronism risk
   */
  private static assessAnachronismRisk(inconsistencies: TemporalInconsistency[]): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    const anachronisms = inconsistencies.filter((i) => i.type === "ANACHRONISM");
    const criticalViolations = inconsistencies.filter((i) => i.severity === "critical");

    if (criticalViolations.length > 0) return "CRITICAL";
    if (anachronisms.length > 2) return "HIGH";
    if (anachronisms.length > 0) return "MEDIUM";
    return "LOW";
  }

  /**
   * Identify issues for reporting
   */
  private static identifyIssues(inconsistencies: TemporalInconsistency[]): string[] {
    return inconsistencies.map((inc) => `[${inc.severity.toUpperCase()}] ${inc.description}`);
  }

  /**
   * Generate temporal analysis report
   */
  static generateReport(result: TemporalAnalysisResult): string {
    const lines = [
      "═══════════════════════════════════════",
      "TEMPORAL ANALYSIS REPORT",
      "═══════════════════════════════════════",
      "",
      `Temporal Coherence: ${(result.temporalCoherence * 100).toFixed(1)}%`,
      `Anachronism Risk: ${result.anachronismRisk}`,
      `Events Analyzed: ${result.events.length}`,
      `Inconsistencies Found: ${result.inconsistencies.length}`,
      "",
      "TIMELINE OVERVIEW:",
      `Total Events: ${result.timeline.events.length}`,
      `Temporal Gaps: ${result.timeline.gaps.length}`,
      result.timeline.gaps.length > 0
        ? `Largest Gap: ${Math.max(...result.timeline.gaps.map((g) => g.duration))} days`
        : "No significant gaps",
      "",
    ];

    if (result.inconsistencies.length > 0) {
      lines.push("INCONSISTENCIES DETECTED:");
      result.inconsistencies.forEach((inc) => {
        lines.push(`  [${inc.severity.toUpperCase()}] ${inc.type}: ${inc.description}`);
      });
      lines.push("");
    }

    if (result.issues.length > 0) {
      lines.push("ISSUES:");
      result.issues.forEach((issue) => {
        lines.push(`  ⚠ ${issue}`);
      });
      lines.push("");
    }

    lines.push("═══════════════════════════════════════");
    return lines.join("\n");
  }
}
