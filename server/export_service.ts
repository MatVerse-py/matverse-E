/**
 * Export Service
 * Handles PDF and CSV export for artifact analysis and reports
 */

import { PDFReportGenerator } from "./pdf_report_generator";
import { CSVReportGenerator } from "./csv_report_generator";

export interface ExportRequest {
  type: "pdf" | "csv";
  reportType: "artifact" | "ledger" | "analytics";
  artifactId?: string;
  data: any;
  metadata?: Record<string, any>;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  contentType: string;
  content: Buffer | string;
  size: number;
  error?: string;
}

export class ExportService {
  /**
   * Export artifact analysis to PDF
   */
  static async exportArtifactPDF(artifactId: string, artifactData: any, metadata: Record<string, any> = {}): Promise<ExportResult> {
    try {
      const pdfOptions = {
        title: `Artifact Analysis Report - ${artifactId}`,
        artifactId,
        content: artifactData.content || "No content available",
        metadata: {
          ...metadata,
          artifactId,
          omegaGateDecision: artifactData.omegaGateDecision,
          semanticScore: artifactData.semanticScore,
          semanticRiskLevel: artifactData.semanticRiskLevel,
          temporalCoherence: artifactData.temporalCoherence,
          politicalBias: artifactData.politicalBias,
          culturalBias: artifactData.culturalBias,
          ideologicalBias: artifactData.ideologicalBias,
          biasScore: artifactData.biasScore,
        },
        includeAnalysis: true,
        includeTimeline: true,
        includeBias: true,
      };

      const htmlContent = PDFReportGenerator.generatePDFReport(pdfOptions);

      // In production, this would use a PDF library like puppeteer or wkhtmltopdf
      // For now, we return the HTML that can be converted to PDF
      const filename = `helena-e-artifact-${artifactId}-${new Date().toISOString().split("T")[0]}.pdf`;

      return {
        success: true,
        filename,
        contentType: "application/pdf",
        content: htmlContent,
        size: htmlContent.length,
      };
    } catch (error) {
      return {
        success: false,
        filename: "",
        contentType: "",
        content: "",
        size: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Export artifact analysis to CSV
   */
  static async exportArtifactCSV(artifacts: any[]): Promise<ExportResult> {
    try {
      const csvContent = CSVReportGenerator.generateArtifactCSV(artifacts);
      const filename = CSVReportGenerator.generateFilename("artifact");

      return {
        success: true,
        filename,
        contentType: "text/csv",
        content: csvContent,
        size: csvContent.length,
      };
    } catch (error) {
      return {
        success: false,
        filename: "",
        contentType: "",
        content: "",
        size: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Export ledger to CSV
   */
  static async exportLedgerCSV(ledgerEntries: any[]): Promise<ExportResult> {
    try {
      const csvContent = CSVReportGenerator.generateLedgerCSV(ledgerEntries);
      const filename = CSVReportGenerator.generateFilename("ledger");

      return {
        success: true,
        filename,
        contentType: "text/csv",
        content: csvContent,
        size: csvContent.length,
      };
    } catch (error) {
      return {
        success: false,
        filename: "",
        contentType: "",
        content: "",
        size: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Export analytics to CSV
   */
  static async exportAnalyticsCSV(analyticsData: any): Promise<ExportResult> {
    try {
      const csvContent = CSVReportGenerator.generateAnalyticsCSV(analyticsData);
      const filename = CSVReportGenerator.generateFilename("analytics");

      return {
        success: true,
        filename,
        contentType: "text/csv",
        content: csvContent,
        size: csvContent.length,
      };
    } catch (error) {
      return {
        success: false,
        filename: "",
        contentType: "",
        content: "",
        size: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Export analytics to PDF
   */
  static async exportAnalyticsPDF(analyticsData: any): Promise<ExportResult> {
    try {
      const pdfOptions = {
        title: "Helena-E Analytics Report",
        artifactId: "analytics",
        content: `
Analytics Report Generated: ${new Date().toISOString()}

Total Artifacts: ${analyticsData.artifacts?.totalSubmitted || 0}
Pass Rate: ${analyticsData.artifacts?.passRate ? (analyticsData.artifacts.passRate * 100).toFixed(1) + "%" : "N/A"}
Hold Rate: ${analyticsData.artifacts?.holdRate ? (analyticsData.artifacts.holdRate * 100).toFixed(1) + "%" : "N/A"}
Review Rate: ${analyticsData.artifacts?.reviewRate ? (analyticsData.artifacts.reviewRate * 100).toFixed(1) + "%" : "N/A"}
Block Rate: ${analyticsData.artifacts?.blockRate ? (analyticsData.artifacts.blockRate * 100).toFixed(1) + "%" : "N/A"}

Average Risk Level: ${analyticsData.artifacts?.averageRiskLevel ? (analyticsData.artifacts.averageRiskLevel * 100).toFixed(1) + "%" : "N/A"}
Average Semantic Score: ${analyticsData.artifacts?.averageSemanticScore ? (analyticsData.artifacts.averageSemanticScore * 100).toFixed(1) + "%" : "N/A"}

System Uptime: ${analyticsData.systemHealth?.uptime || "N/A"}%
Average Processing Time: ${analyticsData.systemHealth?.avgProcessingTime.toFixed(0) || "N/A"}ms
Error Rate: ${analyticsData.systemHealth?.errorRate.toFixed(2) || "N/A"}%
        `,
        metadata: analyticsData,
        includeAnalysis: true,
        includeTimeline: false,
        includeBias: false,
      };

      const htmlContent = PDFReportGenerator.generatePDFReport(pdfOptions);
      const filename = `helena-e-analytics-${new Date().toISOString().split("T")[0]}.pdf`;

      return {
        success: true,
        filename,
        contentType: "application/pdf",
        content: htmlContent,
        size: htmlContent.length,
      };
    } catch (error) {
      return {
        success: false,
        filename: "",
        contentType: "",
        content: "",
        size: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generic export handler
   */
  static async export(request: ExportRequest): Promise<ExportResult> {
    switch (request.type) {
      case "pdf":
        if (request.reportType === "artifact") {
          return ExportService.exportArtifactPDF(request.artifactId || "unknown", request.data, request.metadata);
        } else if (request.reportType === "analytics") {
          return ExportService.exportAnalyticsPDF(request.data);
        }
        break;

      case "csv":
        if (request.reportType === "artifact") {
          return ExportService.exportArtifactCSV(Array.isArray(request.data) ? request.data : [request.data]);
        } else if (request.reportType === "ledger") {
          return ExportService.exportLedgerCSV(Array.isArray(request.data) ? request.data : [request.data]);
        } else if (request.reportType === "analytics") {
          return ExportService.exportAnalyticsCSV(request.data);
        }
        break;
    }

    return {
      success: false,
      filename: "",
      contentType: "",
      content: "",
      size: 0,
      error: "Unsupported export type or report type",
    };
  }
}
