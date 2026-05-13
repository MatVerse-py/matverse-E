/**
 * Export Router
 * tRPC procedures for exporting reports in PDF and CSV formats
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { ExportService } from "../export_service";

export const exportRouter = router({
  /**
   * Export single artifact analysis to PDF
   */
  exportArtifactPDF: protectedProcedure
    .input(
      z.object({
        artifactId: z.string(),
        artifactData: z.object({
          content: z.string().optional(),
          omegaGateDecision: z.string().optional(),
          semanticScore: z.number().optional(),
          semanticRiskLevel: z.string().optional(),
          temporalCoherence: z.number().optional(),
          politicalBias: z.number().optional(),
          culturalBias: z.number().optional(),
          ideologicalBias: z.number().optional(),
          biasScore: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const result = await ExportService.exportArtifactPDF(input.artifactId, input.artifactData);

      if (!result.success) {
        throw new Error(`Export failed: ${result.error}`);
      }

      return {
        filename: result.filename,
        contentType: result.contentType,
        size: result.size,
        // All content is base64-encoded for consistent transport
        content: typeof result.content === "string" ? Buffer.from(result.content).toString("base64") : (result.content as any).toString("base64"),
      };
    }),

  /**
   * Export artifacts to CSV
   */
  exportArtifactsCSV: protectedProcedure
    .input(
      z.object({
        artifacts: z.array(
          z.object({
            id: z.string().optional(),
            createdAt: z.date().optional(),
            omegaGateDecision: z.string().optional(),
            semanticScore: z.number().optional(),
            semanticRiskLevel: z.string().optional(),
            content: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const result = await ExportService.exportArtifactCSV(input.artifacts);

      if (!result.success) {
        throw new Error(`Export failed: ${result.error}`);
      }

      return {
        filename: result.filename,
        contentType: result.contentType,
        size: result.size,
        // Encode CSV as base64 for consistent transport
        content: Buffer.from(result.content as string).toString("base64"),
      };
    }),

  /**
   * Export ledger to CSV
   */
  exportLedgerCSV: protectedProcedure
    .input(
      z.object({
        ledgerEntries: z.array(
          z.object({
            id: z.string().optional(),
            timestamp: z.date().optional(),
            operationType: z.string().optional(),
            artifactId: z.string().optional(),
            omegaGateDecision: z.string().optional(),
            hashSha256: z.string().optional(),
            status: z.string().optional(),
            reason: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const result = await ExportService.exportLedgerCSV(input.ledgerEntries);

      if (!result.success) {
        throw new Error(`Export failed: ${result.error}`);
      }

      return {
        filename: result.filename,
        contentType: result.contentType,
        size: result.size,
        // Encode CSV as base64 for consistent transport
        content: Buffer.from(result.content as string).toString("base64"),
      };
    }),

  /**
   * Export analytics to CSV
   */
  exportAnalyticsCSV: protectedProcedure
    .input(
      z.object({
        analyticsData: z.object({
          artifacts: z.object({}).optional(),
          trends: z.array(z.object({})).optional(),
          topRisks: z.array(z.object({})).optional(),
          systemHealth: z.object({}).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const result = await ExportService.exportAnalyticsCSV(input.analyticsData);

      if (!result.success) {
        throw new Error(`Export failed: ${result.error}`);
      }

      return {
        filename: result.filename,
        contentType: result.contentType,
        size: result.size,
        // Encode CSV as base64 for consistent transport
        content: Buffer.from(result.content as string).toString("base64"),
      };
    }),

  /**
   * Export analytics to PDF
   */
  exportAnalyticsPDF: protectedProcedure
    .input(
      z.object({
        analyticsData: z.object({
          artifacts: z.object({}).optional(),
          trends: z.array(z.object({})).optional(),
          topRisks: z.array(z.object({})).optional(),
          systemHealth: z.object({}).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const result = await ExportService.exportAnalyticsPDF(input.analyticsData);

      if (!result.success) {
        throw new Error(`Export failed: ${result.error}`);
      }

      return {
        filename: result.filename,
        contentType: result.contentType,
        size: result.size,
        // All content is base64-encoded for consistent transport
        content: typeof result.content === "string" ? Buffer.from(result.content).toString("base64") : (result.content as any).toString("base64"),
      };
    }),

  /**
   * Get supported export formats
   */
  getSupportedFormats: protectedProcedure.query(() => {
    return {
      formats: [
        {
          type: "pdf",
          description: "Portable Document Format (HTML-based)",
          mimeType: "application/pdf",
          extensions: [".pdf"],
          encoding: "base64",
        },
        {
          type: "csv",
          description: "Comma-Separated Values",
          mimeType: "text/csv",
          extensions: [".csv"],
          encoding: "base64",
        },
      ],
      reportTypes: [
        {
          type: "artifact",
          description: "Single artifact analysis report",
          supportedFormats: ["pdf", "csv"],
        },
        {
          type: "ledger",
          description: "Immutable ledger export",
          supportedFormats: ["csv"],
        },
        {
          type: "analytics",
          description: "Platform analytics and metrics",
          supportedFormats: ["pdf", "csv"],
        },
      ],
      note: "All content is base64-encoded for consistent transport. Decode on client before saving.",
    };
  }),
});
