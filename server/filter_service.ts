/**
 * Advanced Filter Service
 * Provides multi-criteria filtering and sorting for artifacts and ledger entries
 */

export interface FilterCriteria {
  dateFrom?: Date;
  dateTo?: Date;
  decisions?: string[];
  riskLevels?: string[];
  semanticScoreMin?: number;
  semanticScoreMax?: number;
  biasScoreMin?: number;
  biasScoreMax?: number;
  temporalCoherenceMin?: number;
  temporalCoherenceMax?: number;
  trustScoreMin?: number;
  trustScoreMax?: number;
  searchText?: string;
}

export interface SortOption {
  field: string;
  direction: "asc" | "desc";
  priority: number; // 1 = primary, 2 = secondary, 3 = tertiary
}

export interface FilterResult<T> {
  items: T[];
  total: number;
  filtered: number;
  appliedFilters: string[];
}

export class FilterService {
  /**
   * Apply filters to artifacts
   */
  static filterArtifacts(artifacts: any[], criteria: FilterCriteria): any[] {
    return artifacts.filter((artifact) => {
      // Date range filter
      if (criteria.dateFrom || criteria.dateTo) {
        const artifactDate = new Date(artifact.createdAt);
        if (criteria.dateFrom && artifactDate < criteria.dateFrom) return false;
        if (criteria.dateTo && artifactDate > criteria.dateTo) return false;
      }

      // Decision filter
      if (criteria.decisions && criteria.decisions.length > 0) {
        if (!criteria.decisions.includes(artifact.omegaGateDecision)) return false;
      }

      // Risk level filter
      if (criteria.riskLevels && criteria.riskLevels.length > 0) {
        if (!criteria.riskLevels.includes(artifact.semanticRiskLevel)) return false;
      }

      // Semantic score filter
      if (criteria.semanticScoreMin !== undefined && artifact.semanticScore < criteria.semanticScoreMin) return false;
      if (criteria.semanticScoreMax !== undefined && artifact.semanticScore > criteria.semanticScoreMax) return false;

      // Bias score filter
      if (criteria.biasScoreMin !== undefined && artifact.biasScore < criteria.biasScoreMin) return false;
      if (criteria.biasScoreMax !== undefined && artifact.biasScore > criteria.biasScoreMax) return false;

      // Temporal coherence filter
      if (criteria.temporalCoherenceMin !== undefined && artifact.temporalCoherence < criteria.temporalCoherenceMin)
        return false;
      if (criteria.temporalCoherenceMax !== undefined && artifact.temporalCoherence > criteria.temporalCoherenceMax)
        return false;

      // Trust score filter
      if (criteria.trustScoreMin !== undefined && (artifact.trustScore || 0) < criteria.trustScoreMin) return false;
      if (criteria.trustScoreMax !== undefined && (artifact.trustScore || 0) > criteria.trustScoreMax) return false;

      // Text search filter
      if (criteria.searchText) {
        const searchLower = criteria.searchText.toLowerCase();
        const contentMatch = artifact.content?.toLowerCase().includes(searchLower);
        const idMatch = artifact.id?.toLowerCase().includes(searchLower);
        if (!contentMatch && !idMatch) return false;
      }

      return true;
    });
  }

  /**
   * Apply filters to ledger entries
   */
  static filterLedger(entries: any[], criteria: FilterCriteria): any[] {
    return entries.filter((entry) => {
      // Date range filter
      if (criteria.dateFrom || criteria.dateTo) {
        const entryDate = new Date(entry.timestamp);
        if (criteria.dateFrom && entryDate < criteria.dateFrom) return false;
        if (criteria.dateTo && entryDate > criteria.dateTo) return false;
      }

      // Decision filter
      if (criteria.decisions && criteria.decisions.length > 0) {
        if (!criteria.decisions.includes(entry.omegaGateDecision)) return false;
      }

      // Text search filter
      if (criteria.searchText) {
        const searchLower = criteria.searchText.toLowerCase();
        const idMatch = entry.id?.toLowerCase().includes(searchLower);
        const artifactMatch = entry.artifactId?.toLowerCase().includes(searchLower);
        const reasonMatch = entry.reason?.toLowerCase().includes(searchLower);
        if (!idMatch && !artifactMatch && !reasonMatch) return false;
      }

      return true;
    });
  }

  /**
   * Sort items by multiple criteria
   */
  static sortItems<T>(items: T[], sortOptions: SortOption[]): T[] {
    // Sort by priority (highest priority first)
    const sortedOptions = [...sortOptions].sort((a, b) => a.priority - b.priority);

    return [...items].sort((a: any, b: any) => {
      for (const option of sortedOptions) {
        const aValue = FilterService.getNestedValue(a, option.field);
        const bValue = FilterService.getNestedValue(b, option.field);

        if (aValue === bValue) continue;

        const comparison = FilterService.compareValues(aValue, bValue);
        return option.direction === "asc" ? comparison : -comparison;
      }

      return 0;
    });
  }

  /**
   * Get nested object value by dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Compare two values
   */
  private static compareValues(a: any, b: any): number {
    if (a === null || a === undefined) return 1;
    if (b === null || b === undefined) return -1;

    if (typeof a === "string" && typeof b === "string") {
      return a.localeCompare(b);
    }

    if (typeof a === "number" && typeof b === "number") {
      return a - b;
    }

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() - b.getTime();
    }

    return String(a).localeCompare(String(b));
  }

  /**
   * Apply filters and sorting together
   */
  static filterAndSort<T>(items: T[], criteria: FilterCriteria, sortOptions: SortOption[]): FilterResult<T> {
    // Apply filters (always apply, even if only some criteria are set)
    const filtered = this.filterArtifacts(items, criteria);

    // Apply sorting
    const sorted = sortOptions.length > 0 ? this.sortItems(filtered, sortOptions) : filtered;

    // Generate applied filters description
    const appliedFilters: string[] = [];
    if (criteria.dateFrom || criteria.dateTo) {
      appliedFilters.push(`Date: ${criteria.dateFrom?.toLocaleDateString()} - ${criteria.dateTo?.toLocaleDateString()}`);
    }
    if (criteria.decisions?.length) {
      appliedFilters.push(`Decisions: ${criteria.decisions.join(", ")}`);
    }
    if (criteria.riskLevels?.length) {
      appliedFilters.push(`Risk: ${criteria.riskLevels.join(", ")}`);
    }
    if (criteria.semanticScoreMin !== undefined || criteria.semanticScoreMax !== undefined) {
      appliedFilters.push(
        `Semantic: ${criteria.semanticScoreMin || 0} - ${criteria.semanticScoreMax || 1}`
      );
    }
    if (criteria.biasScoreMin !== undefined || criteria.biasScoreMax !== undefined) {
      appliedFilters.push(`Bias: ${criteria.biasScoreMin || 0} - ${criteria.biasScoreMax || 1}`);
    }
    if (criteria.searchText) {
      appliedFilters.push(`Search: "${criteria.searchText}"`);
    }

    return {
      items: sorted,
      total: items.length,
      filtered: sorted.length,
      appliedFilters,
    };
  }

  /**
   * Get available filter options from artifacts
   */
  static getFilterOptions(artifacts: any[]): {
    decisions: string[];
    riskLevels: string[];
    dateRange: { min: Date; max: Date };
    scoreRanges: {
      semantic: { min: number; max: number };
      bias: { min: number; max: number };
      temporal: { min: number; max: number };
    };
  } {
    const decisions = new Set<string>();
    const riskLevels = new Set<string>();
    let minDate = new Date();
    let maxDate = new Date(0);
    let minSemantic = 1,
      maxSemantic = 0;
    let minBias = 1,
      maxBias = 0;
    let minTemporal = 1,
      maxTemporal = 0;

    artifacts.forEach((artifact) => {
      if (artifact.omegaGateDecision) decisions.add(artifact.omegaGateDecision);
      if (artifact.semanticRiskLevel) riskLevels.add(artifact.semanticRiskLevel);

      const date = new Date(artifact.createdAt);
      if (date < minDate) minDate = date;
      if (date > maxDate) maxDate = date;

      if (artifact.semanticScore !== undefined) {
        minSemantic = Math.min(minSemantic, artifact.semanticScore);
        maxSemantic = Math.max(maxSemantic, artifact.semanticScore);
      }

      if (artifact.biasScore !== undefined) {
        minBias = Math.min(minBias, artifact.biasScore);
        maxBias = Math.max(maxBias, artifact.biasScore);
      }

      if (artifact.temporalCoherence !== undefined) {
        minTemporal = Math.min(minTemporal, artifact.temporalCoherence);
        maxTemporal = Math.max(maxTemporal, artifact.temporalCoherence);
      }
    });

    return {
      decisions: Array.from(decisions),
      riskLevels: Array.from(riskLevels),
      dateRange: { min: minDate, max: maxDate },
      scoreRanges: {
        semantic: { min: minSemantic, max: maxSemantic },
        bias: { min: minBias, max: maxBias },
        temporal: { min: minTemporal, max: maxTemporal },
      },
    };
  }

  /**
   * Create preset filters
   */
  static getPresetFilters(): { [key: string]: FilterCriteria } {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      blocked: {
        decisions: ["BLOCK"],
      },
      highRisk: {
        riskLevels: ["CRITICAL", "HIGH"],
      },
      recentBlocked: {
        decisions: ["BLOCK"],
        dateFrom: sevenDaysAgo,
        dateTo: now,
      },
      lowQuality: {
        semanticScoreMax: 0.5,
      },
      highBias: {
        biasScoreMin: 0.7,
      },
      recentSubmissions: {
        dateFrom: sevenDaysAgo,
        dateTo: now,
      },
      monthlyReview: {
        dateFrom: thirtyDaysAgo,
        dateTo: now,
      },
      temporalIssues: {
        temporalCoherenceMax: 0.5,
      },
    };
  }
}
