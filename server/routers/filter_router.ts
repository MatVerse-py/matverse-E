import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { FilterService, FilterCriteria, SortOption } from "../filter_service";
import { getDb } from "../db";

export const filterRouter = router({
  /**
   * Get available filter options based on current artifacts
   */
  getFilterOptions: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        decisions: ["PASS", "HOLD", "REVIEW", "BLOCK"],
        riskLevels: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        dateRange: { min: new Date(), max: new Date() },
        scoreRanges: {
          semantic: { min: 0, max: 1 },
          bias: { min: 0, max: 1 },
          temporal: { min: 0, max: 1 },
        },
      };
    }

    // In a real implementation, fetch from database
    // For now, return default options
    return {
      decisions: ["PASS", "HOLD", "REVIEW", "BLOCK"],
      riskLevels: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      dateRange: { min: new Date(2026, 0, 1), max: new Date() },
      scoreRanges: {
        semantic: { min: 0, max: 1 },
        bias: { min: 0, max: 1 },
        temporal: { min: 0, max: 1 },
      },
    };
  }),

  /**
   * Get preset filter configurations
   */
  getPresets: publicProcedure.query(() => {
    const presets = FilterService.getPresetFilters();
    return Object.entries(presets).map(([name, criteria]) => ({
      name,
      label: name
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase()),
      criteria,
    }));
  }),

  /**
   * Apply filters and sorting to artifacts
   */
  filterArtifacts: publicProcedure
    .input(
      z.object({
        filters: z.object({
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          decisions: z.array(z.string()).optional(),
          riskLevels: z.array(z.string()).optional(),
          semanticScoreMin: z.number().optional(),
          semanticScoreMax: z.number().optional(),
          biasScoreMin: z.number().optional(),
          biasScoreMax: z.number().optional(),
          temporalCoherenceMin: z.number().optional(),
          temporalCoherenceMax: z.number().optional(),
          searchText: z.string().optional(),
        }),
        sorts: z
          .array(
            z.object({
              field: z.string(),
              direction: z.enum(["asc", "desc"]),
              priority: z.number(),
            })
          )
          .optional(),
      })
    )
    .query(({ input }) => {
      // Mock data - in production, fetch from database
      const mockArtifacts = [
        {
          id: "art-1",
          createdAt: new Date("2026-05-01"),
          omegaGateDecision: "PASS",
          semanticScore: 0.9,
          biasScore: 0.2,
          temporalCoherence: 0.85,
          semanticRiskLevel: "LOW",
          trustScore: 0.95,
          content: "High quality content",
        },
        {
          id: "art-2",
          createdAt: new Date("2026-05-05"),
          omegaGateDecision: "BLOCK",
          semanticScore: 0.3,
          biasScore: 0.9,
          temporalCoherence: 0.4,
          semanticRiskLevel: "CRITICAL",
          trustScore: 0.2,
          content: "Blocked content",
        },
      ];

      // Convert date strings to Date objects
      const criteria: FilterCriteria = {
        dateFrom: input.filters.dateFrom ? new Date(input.filters.dateFrom) : undefined,
        dateTo: input.filters.dateTo ? new Date(input.filters.dateTo) : undefined,
        decisions: input.filters.decisions,
        riskLevels: input.filters.riskLevels,
        semanticScoreMin: input.filters.semanticScoreMin,
        semanticScoreMax: input.filters.semanticScoreMax,
        biasScoreMin: input.filters.biasScoreMin,
        biasScoreMax: input.filters.biasScoreMax,
        temporalCoherenceMin: input.filters.temporalCoherenceMin,
        temporalCoherenceMax: input.filters.temporalCoherenceMax,
        searchText: input.filters.searchText,
      };

      const sorts: SortOption[] = input.sorts || [];

      const result = FilterService.filterAndSort(mockArtifacts, criteria, sorts);

      return result;
    }),

  /**
   * Apply filters and sorting to ledger entries
   */
  filterLedger: publicProcedure
    .input(
      z.object({
        filters: z.object({
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          decisions: z.array(z.string()).optional(),
          searchText: z.string().optional(),
        }),
        sorts: z
          .array(
            z.object({
              field: z.string(),
              direction: z.enum(["asc", "desc"]),
              priority: z.number(),
            })
          )
          .optional(),
      })
    )
    .query(({ input }) => {
      // Mock data - in production, fetch from database
      const mockLedger = [
        {
          id: "ledger-1",
          artifactId: "art-1",
          timestamp: new Date("2026-05-01"),
          omegaGateDecision: "PASS",
          reason: "High quality content",
        },
        {
          id: "ledger-2",
          artifactId: "art-2",
          timestamp: new Date("2026-05-05"),
          omegaGateDecision: "BLOCK",
          reason: "Critical semantic risk detected",
        },
      ];

      // Convert date strings to Date objects
      const criteria: FilterCriteria = {
        dateFrom: input.filters.dateFrom ? new Date(input.filters.dateFrom) : undefined,
        dateTo: input.filters.dateTo ? new Date(input.filters.dateTo) : undefined,
        decisions: input.filters.decisions,
        searchText: input.filters.searchText,
      };

      const sorts: SortOption[] = input.sorts || [];

      const filtered = FilterService.filterLedger(mockLedger, criteria);
      const sorted = sorts.length > 0 ? FilterService.sortItems(filtered, sorts) : filtered;

      return {
        items: sorted,
        total: mockLedger.length,
        filtered: sorted.length,
        appliedFilters: [],
      };
    }),
});
