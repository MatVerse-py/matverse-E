/**
 * PDF Report Generator
 * Generates comprehensive PDF reports for artifact analysis
 */

export interface PDFReportOptions {
  title: string;
  artifactId: string;
  content: string;
  metadata: Record<string, any>;
  includeAnalysis: boolean;
  includeTimeline: boolean;
  includeBias: boolean;
}

export class PDFReportGenerator {
  /**
   * Generate PDF report content (HTML-based)
   */
  static generateHTMLContent(options: PDFReportOptions): string {
    const timestamp = new Date().toISOString();
    const metadata = options.metadata || {};

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${options.title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
      margin: 0;
      padding: 20px;
    }
    .header {
      border-bottom: 3px solid #0066cc;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #0066cc;
      font-size: 28px;
    }
    .metadata {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .metadata-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #ddd;
    }
    .metadata-row:last-child {
      border-bottom: none;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #0066cc;
      border-left: 4px solid #0066cc;
      padding-left: 10px;
      margin-bottom: 15px;
    }
    .content-box {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
      border-left: 3px solid #ccc;
      margin-bottom: 15px;
    }
    .metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    .metric-card {
      background: #f0f7ff;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #0066cc;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #0066cc;
    }
    .verdict {
      display: inline-block;
      padding: 8px 12px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 14px;
      margin: 5px 0;
    }
    .verdict.pass {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .verdict.hold {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeeba;
    }
    .verdict.review {
      background: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
    }
    .verdict.block {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th {
      background: #0066cc;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
    .risk-low { color: #28a745; }
    .risk-medium { color: #ffc107; }
    .risk-high { color: #fd7e14; }
    .risk-critical { color: #dc3545; }
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Helena-E Analysis Report</h1>
    <p style="margin: 5px 0; color: #666;">${options.title}</p>
  </div>

  <div class="metadata">
    <div class="metadata-row">
      <strong>Artifact ID:</strong>
      <span><code>${options.artifactId}</code></span>
    </div>
    <div class="metadata-row">
      <strong>Generated:</strong>
      <span>${timestamp}</span>
    </div>
    <div class="metadata-row">
      <strong>Report Type:</strong>
      <span>Comprehensive Analysis</span>
    </div>
    ${
      metadata.omegaGateDecision
        ? `<div class="metadata-row">
      <strong>Ω-Gate Decision:</strong>
      <span class="verdict ${metadata.omegaGateDecision.toLowerCase()}">${metadata.omegaGateDecision}</span>
    </div>`
        : ""
    }
  </div>

  ${
    options.includeAnalysis
      ? `
  <div class="section">
    <div class="section-title">📊 Analysis Summary</div>
    <div class="content-box">
      ${metadata.semanticScore ? `<p><strong>Semantic Score:</strong> ${(metadata.semanticScore * 100).toFixed(1)}%</p>` : ""}
      ${metadata.semanticRiskLevel ? `<p><strong>Risk Level:</strong> <span class="risk-${metadata.semanticRiskLevel.toLowerCase()}">${metadata.semanticRiskLevel}</span></p>` : ""}
      ${metadata.temporalCoherence ? `<p><strong>Temporal Coherence:</strong> ${(metadata.temporalCoherence * 100).toFixed(1)}%</p>` : ""}
      ${metadata.biasScore ? `<p><strong>Bias Score:</strong> ${(metadata.biasScore * 100).toFixed(1)}%</p>` : ""}
    </div>
  </div>
  `
      : ""
  }

  ${
    options.includeTimeline
      ? `
  <div class="section">
    <div class="section-title">⏱️ Temporal Analysis</div>
    <div class="content-box">
      ${metadata.temporalEvents ? `<p><strong>Events Detected:</strong> ${metadata.temporalEvents.length}</p>` : ""}
      ${metadata.anachronismRisk ? `<p><strong>Anachronism Risk:</strong> ${metadata.anachronismRisk}</p>` : ""}
      ${metadata.chronologicalViolations ? `<p><strong>Chronological Violations:</strong> ${metadata.chronologicalViolations}</p>` : ""}
    </div>
  </div>
  `
      : ""
  }

  ${
    options.includeBias
      ? `
  <div class="section">
    <div class="section-title">⚖️ Bias Detection</div>
    <div class="metrics">
      ${metadata.politicalBias !== undefined ? `<div class="metric-card">
        <div class="metric-label">Political Bias</div>
        <div class="metric-value">${(metadata.politicalBias * 100).toFixed(1)}%</div>
        <div style="font-size: 12px; color: #666; margin-top: 5px;">
          ${metadata.politicalBias > 0 ? "Right-leaning" : "Left-leaning"}
        </div>
      </div>` : ""}
      ${metadata.culturalBias !== undefined ? `<div class="metric-card">
        <div class="metric-label">Cultural Bias</div>
        <div class="metric-value">${(metadata.culturalBias * 100).toFixed(1)}%</div>
        <div style="font-size: 12px; color: #666; margin-top: 5px;">
          ${metadata.culturalBias > 0 ? "Progressive" : "Traditional"}
        </div>
      </div>` : ""}
    </div>
  </div>
  `
      : ""
  }

  <div class="section">
    <div class="section-title">📝 Content</div>
    <div class="content-box">
      ${options.content.replace(/\n/g, "<br>")}
    </div>
  </div>

  <div class="footer">
    <p>This report was generated by Helena-E Platform</p>
    <p>© 2026 MatVerse. All rights reserved.</p>
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Generate PDF report (returns HTML for conversion)
   */
  static generatePDFReport(options: PDFReportOptions): string {
    return PDFReportGenerator.generateHTMLContent(options);
  }

  /**
   * Generate summary statistics for report
   */
  static generateSummary(metadata: Record<string, any>): string {
    const lines = [
      "═══════════════════════════════════════════════════════════",
      "HELENA-E ARTIFACT ANALYSIS REPORT",
      "═══════════════════════════════════════════════════════════",
      "",
      "EXECUTIVE SUMMARY:",
      "",
      `Artifact ID: ${metadata.artifactId || "N/A"}`,
      `Generated: ${new Date().toISOString()}`,
      `Ω-Gate Decision: ${metadata.omegaGateDecision || "PENDING"}`,
      "",
      "KEY METRICS:",
      `  • Semantic Score: ${metadata.semanticScore ? (metadata.semanticScore * 100).toFixed(1) + "%" : "N/A"}`,
      `  • Risk Level: ${metadata.semanticRiskLevel || "N/A"}`,
      `  • Temporal Coherence: ${metadata.temporalCoherence ? (metadata.temporalCoherence * 100).toFixed(1) + "%" : "N/A"}`,
      `  • Bias Score: ${metadata.biasScore ? (metadata.biasScore * 100).toFixed(1) + "%" : "N/A"}`,
      "",
      "TEMPORAL ANALYSIS:",
      `  • Events Detected: ${metadata.temporalEvents?.length || 0}`,
      `  • Anachronism Risk: ${metadata.anachronismRisk || "N/A"}`,
      `  • Chronological Violations: ${metadata.chronologicalViolations || 0}`,
      "",
      "BIAS DIMENSIONS:",
      `  • Political Bias: ${metadata.politicalBias !== undefined ? (metadata.politicalBias * 100).toFixed(1) + "%" : "N/A"}`,
      `  • Cultural Bias: ${metadata.culturalBias !== undefined ? (metadata.culturalBias * 100).toFixed(1) + "%" : "N/A"}`,
      `  • Ideological Intensity: ${metadata.ideologicalBias !== undefined ? (metadata.ideologicalBias * 100).toFixed(1) + "%" : "N/A"}`,
      "",
      "═══════════════════════════════════════════════════════════",
    ];

    return lines.join("\n");
  }
}
