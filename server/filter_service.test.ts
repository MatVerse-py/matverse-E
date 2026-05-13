import { describe, it, expect } from "vitest";
import { FilterService, FilterCriteria, SortOption } from "./filter_service";

describe("FilterService", () => {
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
    {
      id: "art-3",
      createdAt: new Date("2026-05-10"),
      omegaGateDecision: "HOLD",
      semanticScore: 0.6,
      biasScore: 0.5,
      temporalCoherence: 0.7,
      semanticRiskLevel: "MEDIUM",
      trustScore: 0.6,
      content: "Medium quality content",
    },
  ];

  describe("filterArtifacts", () => {
    it("should filter by decision", () => {
      const criteria: FilterCriteria = { decisions: ["PASS"] };
      const result = FilterService.filterArtifacts(mockArtifacts, criteria);

      expect(result).toHaveLength(1);
      expect(result[0].omegaGateDecision).toBe("PASS");
    });

    it("should filter by multiple decisions", () => {
      const criteria: FilterCriteria = { decisions: ["PASS", "HOLD"] };
      const result = FilterService.filterArtifacts(mockArtifacts, criteria);

      expect(result).toHaveLength(2);
    });

    it("should filter by risk level", () => {
      const criteria: FilterCriteria = { riskLevels: ["CRITICAL"] };
      const result = FilterService.filterArtifacts(mockArtifacts, criteria);

      expect(result).toHaveLength(1);
      expect(result[0].semanticRiskLevel).toBe("CRITICAL");
    });

    it("should filter by date range", () => {
      const criteria: FilterCriteria = {
        dateFrom: new Date("2026-05-04"),
        dateTo: new Date("2026-05-08"),
      };
      const result = FilterService.filterArtifacts(mockArtifacts, criteria);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("art-2");
    });

    it("should filter by semantic score range", () => {
      const criteria: FilterCriteria = {
        semanticScoreMin: 0.5,
        semanticScoreMax: 0.95,
      };
      const result = FilterService.filterArtifacts(mockArtifacts, criteria);

      expect(result).toHaveLength(2);
    });

    it("should filter by bias score range", () => {
      const criteria: FilterCriteria = {
        biasScoreMin: 0.8,
      };
      const result = FilterService.filterArtifacts(mockArtifacts, criteria);

      expect(result).toHaveLength(1);
      expect(result[0].biasScore).toBeGreaterThanOrEqual(0.8);
    });

    it("should filter by text search", () => {
      const criteria: FilterCriteria = { searchText: "blocked" };
      const result = FilterService.filterArtifacts(mockArtifacts, criteria);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("art-2");
    });

    it("should combine multiple filters", () => {
      const criteria: FilterCriteria = {
        decisions: ["PASS", "HOLD"],
        semanticScoreMin: 0.5,
      };
      const result = FilterService.filterArtifacts(mockArtifacts, criteria);

      expect(result).toHaveLength(2);
    });
  });

  describe("sortItems", () => {
    it("should sort by single field ascending", () => {
      const sortOptions: SortOption[] = [
        { field: "semanticScore", direction: "asc", priority: 1 },
      ];
      const result = FilterService.sortItems(mockArtifacts, sortOptions);

      expect(result[0].semanticScore).toBe(0.3);
      expect(result[2].semanticScore).toBe(0.9);
    });

    it("should sort by single field descending", () => {
      const sortOptions: SortOption[] = [
        { field: "semanticScore", direction: "desc", priority: 1 },
      ];
      const result = FilterService.sortItems(mockArtifacts, sortOptions);

      expect(result[0].semanticScore).toBe(0.9);
      expect(result[2].semanticScore).toBe(0.3);
    });

    it("should sort by multiple fields with priority", () => {
      const sortOptions: SortOption[] = [
        { field: "semanticRiskLevel", direction: "asc", priority: 1 },
        { field: "semanticScore", direction: "desc", priority: 2 },
      ];
      const result = FilterService.sortItems(mockArtifacts, sortOptions);

      expect(result[0].semanticRiskLevel).toBe("CRITICAL");
      expect(result[1].semanticRiskLevel).toBe("LOW");
    });

    it("should sort by date", () => {
      const sortOptions: SortOption[] = [
        { field: "createdAt", direction: "asc", priority: 1 },
      ];
      const result = FilterService.sortItems(mockArtifacts, sortOptions);

      expect(result[0].id).toBe("art-1");
      expect(result[2].id).toBe("art-3");
    });
  });

  describe("filterAndSort", () => {
    it("should apply filters and sorting together", () => {
      const criteria: FilterCriteria = { decisions: ["PASS", "HOLD"] };
      const sortOptions: SortOption[] = [
        { field: "semanticScore", direction: "desc", priority: 1 },
      ];
      const result = FilterService.filterAndSort(mockArtifacts, criteria, sortOptions);

      expect(result.items).toHaveLength(2);
      expect(result.filtered).toBe(2);
      expect(result.total).toBe(3);
      expect(result.items[0].semanticScore).toBeGreaterThan(result.items[1].semanticScore);
    });

    it("should generate applied filters description", () => {
      const criteria: FilterCriteria = {
        decisions: ["PASS"],
        semanticScoreMin: 0.5,
      };
      const result = FilterService.filterAndSort(mockArtifacts, criteria, []);

      expect(result.appliedFilters.length).toBeGreaterThan(0);
      expect(result.appliedFilters.some((f) => f.includes("PASS"))).toBe(true);
    });
  });

  describe("getFilterOptions", () => {
    it("should extract available filter options", () => {
      const options = FilterService.getFilterOptions(mockArtifacts);

      expect(options.decisions).toContain("PASS");
      expect(options.decisions).toContain("BLOCK");
      expect(options.riskLevels).toContain("LOW");
      expect(options.riskLevels).toContain("CRITICAL");
    });

    it("should calculate score ranges", () => {
      const options = FilterService.getFilterOptions(mockArtifacts);

      expect(options.scoreRanges.semantic.min).toBe(0.3);
      expect(options.scoreRanges.semantic.max).toBe(0.9);
      expect(options.scoreRanges.bias.min).toBe(0.2);
      expect(options.scoreRanges.bias.max).toBe(0.9);
    });

    it("should calculate date range", () => {
      const options = FilterService.getFilterOptions(mockArtifacts);

      expect(options.dateRange.min.toDateString()).toBe(new Date("2026-05-01").toDateString());
      expect(options.dateRange.max.toDateString()).toBe(new Date("2026-05-10").toDateString());
    });
  });

  describe("getPresetFilters", () => {
    it("should return preset filter configurations", () => {
      const presets = FilterService.getPresetFilters();

      expect(presets.blocked).toBeDefined();
      expect(presets.blocked.decisions).toContain("BLOCK");
      expect(presets.highRisk).toBeDefined();
      expect(presets.highRisk.riskLevels).toContain("CRITICAL");
    });

    it("should include date-based presets", () => {
      const presets = FilterService.getPresetFilters();

      expect(presets.recentBlocked.dateFrom).toBeDefined();
      expect(presets.monthlyReview.dateFrom).toBeDefined();
    });
  });
});
