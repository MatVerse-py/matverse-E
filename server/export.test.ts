import { describe, it, expect } from "vitest";
import { PDFReportGenerator } from "./pdf_report_generator";
import { CSVReportGenerator } from "./csv_report_generator";
import { ExportService } from "./export_service";

describe("PDFReportGenerator", () => {
  describe("generateHTMLContent", () => {
    it("should generate HTML content for PDF", () => {
      const options = {
        title: "Test Report",
        artifactId: "test-123",
        content: "Test content",
        metadata: {
          omegaGateDecision: "PASS",
          semanticScore: 0.85,
        },
        includeAnalysis: true,
        includeTimeline: true,
        includeBias: true,
      };

      const html = PDFReportGenerator.generateHTMLContent(options);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Helena-E Analysis Report");
      expect(html).toContain("test-123");
      expect(html).toContain("Test content");
    });

    it("should include analysis section when enabled", () => {
      const options = {
        title: "Test Report",
        artifactId: "test-123",
        content: "Test content",
        metadata: { semanticScore: 0.9 },
        includeAnalysis: true,
        includeTimeline: false,
        includeBias: false,
      };

      const html = PDFReportGenerator.generateHTMLContent(options);

      expect(html).toContain("Analysis Summary");
    });

    it("should include temporal section when enabled", () => {
      const options = {
        title: "Test Report",
        artifactId: "test-123",
        content: "Test content",
        metadata: { temporalCoherence: 0.8 },
        includeAnalysis: false,
        includeTimeline: true,
        includeBias: false,
      };

      const html = PDFReportGenerator.generateHTMLContent(options);

      expect(html).toContain("Temporal Analysis");
    });

    it("should include bias section when enabled", () => {
      const options = {
        title: "Test Report",
        artifactId: "test-123",
        content: "Test content",
        metadata: { politicalBias: 0.5 },
        includeAnalysis: false,
        includeTimeline: false,
        includeBias: true,
      };

      const html = PDFReportGenerator.generateHTMLContent(options);

      expect(html).toContain("Bias Detection");
    });
  });

  describe("generateSummary", () => {
    it("should generate text summary", () => {
      const metadata = {
        artifactId: "test-123",
        omegaGateDecision: "PASS",
        semanticScore: 0.85,
      };

      const summary = PDFReportGenerator.generateSummary(metadata);

      expect(summary).toContain("HELENA-E ARTIFACT ANALYSIS REPORT");
      expect(summary).toContain("test-123");
      expect(summary).toContain("PASS");
    });
  });
});

describe("CSVReportGenerator", () => {
  describe("generateArtifactCSV", () => {
    it("should generate CSV for artifacts", () => {
      const artifacts = [
        {
          id: "art-1",
          omegaGateDecision: "PASS",
          semanticScore: 0.9,
          semanticRiskLevel: "LOW",
          content: "Test content",
        },
        {
          id: "art-2",
          omegaGateDecision: "BLOCK",
          semanticScore: 0.2,
          semanticRiskLevel: "CRITICAL",
          content: "Bad content",
        },
      ];

      const csv = CSVReportGenerator.generateArtifactCSV(artifacts);

      expect(csv).toContain("Artifact ID");
      expect(csv).toContain("art-1");
      expect(csv).toContain("art-2");
      expect(csv).toContain("PASS");
      expect(csv).toContain("BLOCK");
    });

    it("should handle empty artifacts", () => {
      const csv = CSVReportGenerator.generateArtifactCSV([]);

      expect(csv).toContain("Artifact ID");
    });

    it("should escape CSV fields with commas", () => {
      const artifacts = [
        {
          id: "art-1",
          content: "Content with, comma",
          omegaGateDecision: "PASS",
        },
      ];

      const csv = CSVReportGenerator.generateArtifactCSV(artifacts);

      expect(csv).toContain('"Content with, comma"');
    });
  });

  describe("generateLedgerCSV", () => {
    it("should generate CSV for ledger entries", () => {
      const ledgerEntries = [
        {
          id: "entry-1",
          operationType: "SUBMIT",
          artifactId: "art-1",
          omegaGateDecision: "PASS",
          hashSha256: "abc123",
        },
      ];

      const csv = CSVReportGenerator.generateLedgerCSV(ledgerEntries);

      expect(csv).toContain("Entry ID");
      expect(csv).toContain("entry-1");
      expect(csv).toContain("SUBMIT");
      expect(csv).toContain("abc123");
    });
  });

  describe("generateAnalyticsCSV", () => {
    it("should generate CSV for analytics", () => {
      const analyticsData = {
        artifacts: {
          totalSubmitted: 100,
          passRate: 0.8,
          blockRate: 0.1,
        },
        systemHealth: {
          uptime: 99.5,
          avgProcessingTime: 150,
          errorRate: 0.5,
        },
      };

      const csv = CSVReportGenerator.generateAnalyticsCSV(analyticsData);

      expect(csv).toContain("HELENA-E ANALYTICS EXPORT");
      expect(csv).toContain("Total Submitted,100");
      expect(csv).toContain("Pass Rate,80.0%");
    });
  });

  describe("generateFilename", () => {
    it("should generate artifact filename", () => {
      const filename = CSVReportGenerator.generateFilename("artifact", "test-123");

      expect(filename).toContain("helena-e-artifact");
      expect(filename).toContain("test-123");
      expect(filename).toContain(".csv");
    });

    it("should generate ledger filename", () => {
      const filename = CSVReportGenerator.generateFilename("ledger");

      expect(filename).toContain("helena-e-ledger");
      expect(filename).toContain(".csv");
    });

    it("should generate analytics filename", () => {
      const filename = CSVReportGenerator.generateFilename("analytics");

      expect(filename).toContain("helena-e-analytics");
      expect(filename).toContain(".csv");
    });
  });
});

describe("ExportService", () => {
  describe("exportArtifactCSV", () => {
    it("should export artifacts to CSV", async () => {
      const artifacts = [
        {
          id: "art-1",
          omegaGateDecision: "PASS",
          semanticScore: 0.9,
        },
      ];

      const result = await ExportService.exportArtifactCSV(artifacts);

      expect(result.success).toBe(true);
      expect(result.contentType).toBe("text/csv");
      expect(result.filename).toContain("helena-e-artifact");
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe("exportLedgerCSV", () => {
    it("should export ledger to CSV", async () => {
      const ledgerEntries = [
        {
          id: "entry-1",
          operationType: "SUBMIT",
          artifactId: "art-1",
        },
      ];

      const result = await ExportService.exportLedgerCSV(ledgerEntries);

      expect(result.success).toBe(true);
      expect(result.contentType).toBe("text/csv");
      expect(result.filename).toContain("helena-e-ledger");
    });
  });

  describe("exportAnalyticsCSV", () => {
    it("should export analytics to CSV", async () => {
      const analyticsData = {
        artifacts: { totalSubmitted: 100, passRate: 0.8, holdRate: 0.1, reviewRate: 0.05, blockRate: 0.05, averageRiskLevel: 0.3, averageSemanticScore: 0.75 },
        systemHealth: { uptime: 99.5, avgProcessingTime: 150, errorRate: 0.5 },
        trends: [],
        topRisks: [],
      };

      const result = await ExportService.exportAnalyticsCSV(analyticsData);

      expect(result.success).toBe(true);
      expect(result.contentType).toBe("text/csv");
      expect(result.filename).toContain("helena-e-analytics");
    });
  });

  describe("exportArtifactPDF", () => {
    it("should export artifact to PDF", async () => {
      const artifactData = {
        content: "Test content",
        omegaGateDecision: "PASS",
        semanticScore: 0.9,
      };

      const result = await ExportService.exportArtifactPDF("art-1", artifactData);

      expect(result.success).toBe(true);
      expect(result.contentType).toBe("application/pdf");
      expect(result.filename).toContain("helena-e-artifact");
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe("exportAnalyticsPDF", () => {
    it("should export analytics to PDF", async () => {
      const analyticsData = {
        artifacts: { totalSubmitted: 100, passRate: 0.8, holdRate: 0.1, reviewRate: 0.05, blockRate: 0.05, averageRiskLevel: 0.3, averageSemanticScore: 0.75 },
        systemHealth: { uptime: 99.5, avgProcessingTime: 150, errorRate: 0.5 },
      };

      const result = await ExportService.exportAnalyticsPDF(analyticsData);

      expect(result.success).toBe(true);
      expect(result.contentType).toBe("application/pdf");
      expect(result.filename).toContain("helena-e-analytics");
    });
  });

  describe("export", () => {
    it("should handle generic export request for artifact CSV", async () => {
      const result = await ExportService.export({
        type: "csv",
        reportType: "artifact",
        data: [{ id: "art-1" }],
      });

      expect(result.success).toBe(true);
      expect(result.contentType).toBe("text/csv");
    });

    it("should handle generic export request for artifact PDF", async () => {
      const result = await ExportService.export({
        type: "pdf",
        reportType: "artifact",
        artifactId: "art-1",
        data: { content: "Test" },
      });

      expect(result.success).toBe(true);
      expect(result.contentType).toBe("application/pdf");
    });
  });
});
