/**
 * CSV Report Generator
 * Generates CSV reports for artifact analysis and ledger export
 */

export interface CSVExportOptions {
  type: "artifact" | "ledger" | "analytics";
  data: any[];
  includeHeaders: boolean;
}

export class CSVReportGenerator {
  /**
   * Escape CSV field value
   */
  private static escapeCSVField(value: any): string {
    if (value === null || value === undefined) {
      return "";
    }

    const stringValue = String(value);

    // If contains comma, newline, or quote, wrap in quotes and escape quotes
    if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Generate artifact analysis CSV
   */
  static generateArtifactCSV(artifacts: any[]): string {
    const headers = [
      "Artifact ID",
      "Created At",
      "Ω-Gate Decision",
      "Semantic Score",
      "Risk Level",
      "Temporal Coherence",
      "Political Bias",
      "Cultural Bias",
      "Ideological Intensity",
      "Bias Score",
      "Trust Score",
      "Content Preview",
    ];

    const rows: string[] = [headers.map((h) => CSVReportGenerator.escapeCSVField(h)).join(",")];

    artifacts.forEach((artifact) => {
      const row = [
        artifact.id || "",
        artifact.createdAt ? new Date(artifact.createdAt).toISOString() : "",
        artifact.omegaGateDecision || "PENDING",
        artifact.semanticScore ? (artifact.semanticScore * 100).toFixed(1) : "",
        artifact.semanticRiskLevel || "",
        artifact.temporalCoherence ? (artifact.temporalCoherence * 100).toFixed(1) : "",
        artifact.politicalBias !== undefined ? (artifact.politicalBias * 100).toFixed(1) : "",
        artifact.culturalBias !== undefined ? (artifact.culturalBias * 100).toFixed(1) : "",
        artifact.ideologicalBias !== undefined ? (artifact.ideologicalBias * 100).toFixed(1) : "",
        artifact.biasScore ? (artifact.biasScore * 100).toFixed(1) : "",
        artifact.trustScore || "",
        artifact.content ? artifact.content.substring(0, 100) : "",
      ];

      rows.push(row.map((v) => CSVReportGenerator.escapeCSVField(v)).join(","));
    });

    return rows.join("\n");
  }

  /**
   * Generate ledger CSV
   */
  static generateLedgerCSV(ledgerEntries: any[]): string {
    const headers = [
      "Entry ID",
      "Timestamp",
      "Operation Type",
      "Artifact ID",
      "Ω-Gate Decision",
      "Hash SHA-256",
      "Status",
      "Reason",
    ];

    const rows: string[] = [headers.map((h) => CSVReportGenerator.escapeCSVField(h)).join(",")];

    ledgerEntries.forEach((entry) => {
      const row = [
        entry.id || "",
        entry.timestamp ? new Date(entry.timestamp).toISOString() : "",
        entry.operationType || "",
        entry.artifactId || "",
        entry.omegaGateDecision || "",
        entry.hashSha256 || "",
        entry.status || "",
        entry.reason || "",
      ];

      rows.push(row.map((v) => CSVReportGenerator.escapeCSVField(v)).join(","));
    });

    return rows.join("\n");
  }

  /**
   * Generate analytics CSV
   */
  static generateAnalyticsCSV(analyticsData: any): string {
    const rows: string[] = [];

    // Summary section
    rows.push("HELENA-E ANALYTICS EXPORT");
    rows.push(`Generated,${new Date().toISOString()}`);
    rows.push("");

    // Artifact metrics
    rows.push("ARTIFACT METRICS");
    rows.push("Metric,Value");
    rows.push(`Total Submitted,${analyticsData.artifacts?.totalSubmitted || 0}`);
    rows.push(`Total Processed,${analyticsData.artifacts?.totalProcessed || 0}`);
    rows.push(`Pass Rate,${analyticsData.artifacts?.passRate ? (analyticsData.artifacts.passRate * 100).toFixed(1) + "%" : ""}`);
    rows.push(`Hold Rate,${analyticsData.artifacts?.holdRate ? (analyticsData.artifacts.holdRate * 100).toFixed(1) + "%" : ""}`);
    rows.push(`Review Rate,${analyticsData.artifacts?.reviewRate ? (analyticsData.artifacts.reviewRate * 100).toFixed(1) + "%" : ""}`);
    rows.push(`Block Rate,${analyticsData.artifacts?.blockRate ? (analyticsData.artifacts.blockRate * 100).toFixed(1) + "%" : ""}`);
    rows.push("");

    // Trends
    if (analyticsData.trends && analyticsData.trends.length > 0) {
      rows.push("TRENDS");
      rows.push("Metric,Direction,Change %");
      analyticsData.trends.forEach((trend: any) => {
        rows.push(`${trend.metric},${trend.direction},${trend.changePercent.toFixed(1)}`);
      });
      rows.push("");
    }

    // Top risks
    if (analyticsData.topRisks && analyticsData.topRisks.length > 0) {
      rows.push("TOP RISKS");
      rows.push("Risk Level,Count,Percentage");
      analyticsData.topRisks.forEach((risk: any) => {
        rows.push(`${risk.risk},${risk.count},${risk.percentage.toFixed(1)}%`);
      });
      rows.push("");
    }

    // System health
    if (analyticsData.systemHealth) {
      rows.push("SYSTEM HEALTH");
      rows.push("Metric,Value");
      rows.push(`Uptime,${analyticsData.systemHealth.uptime}%`);
      rows.push(`Avg Processing Time,${analyticsData.systemHealth.avgProcessingTime.toFixed(0)}ms`);
      rows.push(`Error Rate,${analyticsData.systemHealth.errorRate.toFixed(2)}%`);
    }

    return rows.join("\n");
  }

  /**
   * Generate comprehensive CSV export
   */
  static generateCSV(options: CSVExportOptions): string {
    switch (options.type) {
      case "artifact":
        return CSVReportGenerator.generateArtifactCSV(options.data);
      case "ledger":
        return CSVReportGenerator.generateLedgerCSV(options.data);
      case "analytics":
        return CSVReportGenerator.generateAnalyticsCSV(options.data[0] || {});
      default:
        return "";
    }
  }

  /**
   * Generate filename for export
   */
  static generateFilename(type: "artifact" | "ledger" | "analytics", artifactId?: string): string {
    const timestamp = new Date().toISOString().split("T")[0];

    switch (type) {
      case "artifact":
        return `helena-e-artifact-${artifactId || "all"}-${timestamp}.csv`;
      case "ledger":
        return `helena-e-ledger-${timestamp}.csv`;
      case "analytics":
        return `helena-e-analytics-${timestamp}.csv`;
      default:
        return `helena-e-export-${timestamp}.csv`;
    }
  }

  /**
   * Parse CSV back to objects (for import)
   */
  static parseCSV(csvContent: string, type: "artifact" | "ledger"): any[] {
    const lines = csvContent.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    const objects: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = CSVReportGenerator.parseCSVLine(lines[i]);

      if (values.length !== headers.length) {
        continue;
      }

      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });

      objects.push(obj);
    }

    return objects;
  }

  /**
   * Parse a single CSV line handling quoted fields
   */
  private static parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }
}
