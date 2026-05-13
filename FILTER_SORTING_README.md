# Advanced Filtering & Sorting System

## Overview

The Advanced Filtering & Sorting System provides powerful multi-criteria search and organization capabilities for artifacts and ledger entries. Users can combine multiple filter types and apply sophisticated sorting rules to quickly find relevant analysis results.

## Features

### 1. Multi-Criteria Filtering

**Supported Filter Types:**

| Filter | Type | Range | Description |
|--------|------|-------|-------------|
| Date Range | Date | From/To | Filter by creation or processing date |
| Decision | Enum | PASS/HOLD/REVIEW/BLOCK | Filter by Ω-Gate verdict |
| Risk Level | Enum | LOW/MEDIUM/HIGH/CRITICAL | Filter by semantic risk classification |
| Semantic Score | Range | 0.0 - 1.0 | Filter by semantic coherence |
| Bias Score | Range | 0.0 - 1.0 | Filter by ideological bias detection |
| Temporal Coherence | Range | 0.0 - 1.0 | Filter by timeline consistency |
| Trust Score | Range | 0.0 - 1.0 | Filter by artifact trustworthiness |
| Text Search | String | Any | Search by ID or content |

**Combining Filters:**
- All filters are applied with AND logic (all must match)
- Multiple values within same filter type use OR logic (any can match)
- Example: (Decision = PASS OR HOLD) AND (Risk = LOW OR MEDIUM) AND (Semantic Score >= 0.7)

### 2. Advanced Sorting

**Sort Capabilities:**
- **Primary Sort:** Main sorting criterion
- **Secondary Sort:** Tiebreaker when primary values are equal
- **Tertiary Sort:** Final tiebreaker for complete ordering

**Supported Sort Fields:**
- Date (ascending/descending)
- Semantic Score (low-to-high or high-to-low)
- Bias Score (low-to-high or high-to-low)
- Temporal Coherence (low-to-high or high-to-low)
- Decision (alphabetical)
- Risk Level (by severity)
- ID (alphabetical)
- Trust Score (low-to-high or high-to-low)

**Example Sort Chains:**
1. Primary: Decision (BLOCK first), Secondary: Semantic Score (descending)
2. Primary: Risk Level (CRITICAL first), Secondary: Date (newest first)
3. Primary: Temporal Coherence (ascending), Secondary: Bias Score (descending)

### 3. Preset Filters

Quick-access filter configurations for common use cases:

| Preset | Filters | Use Case |
|--------|---------|----------|
| Blocked | Decision = BLOCK | Review all blocked artifacts |
| High Risk | Risk = CRITICAL or HIGH | Focus on dangerous content |
| Recent Blocked | Decision = BLOCK, Last 7 days | Monitor recent blocks |
| Low Quality | Semantic Score < 0.5 | Identify problematic submissions |
| High Bias | Bias Score > 0.7 | Find ideologically skewed content |
| Recent Submissions | Last 7 days | Monitor new artifacts |
| Monthly Review | Last 30 days | Standard monthly analysis |
| Temporal Issues | Temporal Coherence < 0.5 | Find timeline inconsistencies |

### 4. Filter UI Components

#### FilterPanel Component

**Location:** `client/src/components/FilterPanel.tsx`

**Features:**
- Collapsible filter interface
- Date range picker (from/to)
- Multi-select decision buttons
- Multi-select risk level buttons
- Range sliders for semantic, bias, temporal scores
- Text search input
- Apply/Reset buttons
- Active filter counter badge

**Usage:**
```tsx
import { FilterPanel } from "@/components/FilterPanel";

<FilterPanel
  onFilterChange={(filters) => console.log(filters)}
  availableDecisions={["PASS", "HOLD", "REVIEW", "BLOCK"]}
  availableRiskLevels={["LOW", "MEDIUM", "HIGH", "CRITICAL"]}
/>
```

#### SortControls Component

**Location:** `client/src/components/SortControls.tsx`

**Features:**
- Multi-level sort configuration
- Field selection dropdown
- Direction toggle (ascending/descending)
- Add/remove sort criteria
- Reset to default
- Supports up to 3 sort levels

**Usage:**
```tsx
import { SortControls } from "@/components/SortControls";

<SortControls
  onSortChange={(sorts) => console.log(sorts)}
  availableFields={[
    { label: "Date", value: "createdAt" },
    { label: "Semantic Score", value: "semanticScore" },
  ]}
/>
```

## Architecture

### Backend: FilterService

**Location:** `server/filter_service.ts`

Core filtering and sorting logic with no dependencies on UI or framework.

**Key Methods:**

```typescript
// Filter artifacts by criteria
filterArtifacts(artifacts: any[], criteria: FilterCriteria): any[]

// Filter ledger entries by criteria
filterLedger(entries: any[], criteria: FilterCriteria): any[]

// Sort items by multiple criteria
sortItems<T>(items: T[], sortOptions: SortOption[]): T[]

// Apply filters and sorting together
filterAndSort<T>(items: T[], criteria: FilterCriteria, sortOptions: SortOption[]): FilterResult<T>

// Get available filter options from dataset
getFilterOptions(artifacts: any[]): FilterOptions

// Get preset filter configurations
getPresets(): { [key: string]: FilterCriteria }
```

### Frontend: Filter Router (tRPC)

**Location:** `server/routers/filter_router.ts`

Exposes filtering and sorting through tRPC procedures.

**Available Procedures:**

```typescript
// Get available filter options
trpc.filter.getFilterOptions.useQuery()

// Get preset filter configurations
trpc.filter.getPresets.useQuery()

// Filter and sort artifacts
trpc.filter.filterArtifacts.useQuery({
  filters: FilterCriteria,
  sorts: SortOption[]
})

// Filter and sort ledger entries
trpc.filter.filterLedger.useQuery({
  filters: FilterCriteria,
  sorts: SortOption[]
})
```

## Data Flow

```
User Input (FilterPanel + SortControls)
         ↓
    FilterCriteria + SortOption[]
         ↓
    tRPC Procedure Call
         ↓
    FilterService.filterAndSort()
         ↓
    Filtered & Sorted Results
         ↓
    Display in UI (Table, List, etc.)
```

## Usage Examples

### Basic Filtering

```tsx
// Filter for blocked artifacts
const filters = {
  decisions: ["BLOCK"],
};

const result = await trpc.filter.filterArtifacts.useQuery({
  filters,
  sorts: [],
});
```

### Date Range Filtering

```tsx
// Get artifacts from last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const filters = {
  dateFrom: thirtyDaysAgo,
  dateTo: new Date(),
};

const result = await trpc.filter.filterArtifacts.useQuery({
  filters,
  sorts: [],
});
```

### Score Range Filtering

```tsx
// Find low-quality artifacts
const filters = {
  semanticScoreMax: 0.5,
  biasScoreMin: 0.7,
};

const result = await trpc.filter.filterArtifacts.useQuery({
  filters,
  sorts: [],
});
```

### Multi-Level Sorting

```tsx
// Sort by risk (critical first), then by semantic score (high first)
const sorts = [
  { field: "semanticRiskLevel", direction: "asc", priority: 1 },
  { field: "semanticScore", direction: "desc", priority: 2 },
];

const result = await trpc.filter.filterArtifacts.useQuery({
  filters: { riskLevels: ["CRITICAL", "HIGH"] },
  sorts,
});
```

### Using Presets

```tsx
// Get preset configurations
const presets = await trpc.filter.getPresets.useQuery();

// Apply "High Risk" preset
const highRiskPreset = presets.find((p) => p.name === "highRisk");

const result = await trpc.filter.filterArtifacts.useQuery({
  filters: highRiskPreset.criteria,
  sorts: [],
});
```

## Performance Considerations

### Filtering Performance

- **Small datasets (< 1,000):** Instant (< 10ms)
- **Medium datasets (1,000 - 10,000):** Fast (10-100ms)
- **Large datasets (10,000+):** Acceptable (100-500ms)

### Optimization Strategies

1. **Reduce dataset size:** Apply date filters first
2. **Use presets:** Faster than custom filter combinations
3. **Limit sort levels:** 1-2 levels is optimal
4. **Combine filters:** More specific filters = faster results

### Client-Side vs Server-Side

**Current Implementation:** Client-side filtering

**Advantages:**
- No network latency
- Instant feedback
- Works offline

**Disadvantages:**
- Limited to loaded data
- Memory usage for large datasets

**Future Optimization:**
- Server-side filtering for large datasets
- Pagination with server-side sorting
- Indexed database queries

## Testing

### Unit Tests

Run filter service tests:
```bash
pnpm test server/filter_service.test.ts
```

**Coverage:**
- Decision filtering (single and multiple)
- Risk level filtering
- Date range filtering
- Score range filtering
- Text search filtering
- Multi-criteria combinations
- Sorting (single and multi-level)
- Filter + sort combinations
- Filter options extraction
- Preset configurations

### Integration Tests

Test filter UI with real data:
```bash
# In development environment
pnpm dev

# Navigate to Analytics Dashboard
# Test FilterPanel with various combinations
# Test SortControls with different fields
```

## Limitations

### Current

- Client-side processing only
- No filter history/saved filters
- No advanced regex search
- No custom filter combinations
- Limited to 3 sort levels

### Future Enhancements

- Server-side filtering for large datasets
- Save/load filter presets
- Advanced regex search
- Custom filter combinations
- Unlimited sort levels
- Filter history and undo/redo
- Collaborative filter sharing
- Filter performance analytics

## Troubleshooting

### Filters Not Applying

1. Check filter criteria are properly formatted
2. Verify data types match expected ranges
3. Ensure date strings are valid ISO format
4. Check browser console for errors

### Sorting Not Working

1. Verify sort field names match available fields
2. Check priority values are sequential (1, 2, 3)
3. Ensure direction is "asc" or "desc"
4. Verify data type is sortable

### Performance Issues

1. Reduce number of artifacts being filtered
2. Use date filters to narrow dataset
3. Reduce number of sort levels
4. Clear browser cache and reload
5. Consider server-side filtering for large datasets

## API Reference

### FilterCriteria Interface

```typescript
interface FilterCriteria {
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
```

### SortOption Interface

```typescript
interface SortOption {
  field: string;
  direction: "asc" | "desc";
  priority: number; // 1 = primary, 2 = secondary, 3 = tertiary
}
```

### FilterResult Interface

```typescript
interface FilterResult<T> {
  items: T[];
  total: number;
  filtered: number;
  appliedFilters: string[];
}
```

## Related Documentation

- [Analytics Dashboard Guide](./ANALYTICS_DASHBOARD_README.md)
- [Export Functionality Guide](./EXPORT_README.md)
- [Helena-E Platform README](./HELENA_E_README.md)

## Support

For issues or feature requests, please refer to the main Helena-E documentation or contact the development team.
