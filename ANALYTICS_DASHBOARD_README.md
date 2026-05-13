# Helena-E Analytics Dashboard

## Overview

The Analytics Dashboard provides comprehensive visualization of artifact analysis trends, misinformation patterns, and system health metrics. It enables users to identify emerging threats, track decision patterns, and monitor platform performance over configurable time periods.

## Features

### 1. Time-Series Analytics

**Trend Detection:** Automatically identifies upward, downward, and stable trends in key metrics.

**Supported Metrics:**
- Semantic score trends (0-1 scale)
- Bias score trends (0-1 scale)
- Temporal coherence trends (0-1 scale)
- Decision distribution over time

**Time Ranges:**
- Last 7 days
- Last 30 days (default)
- Last 90 days

### 2. Interactive Visualizations

**Chart Types:**

| Chart | Purpose | Data |
|-------|---------|------|
| Stacked Area | Decision trends over time | PASS, HOLD, REVIEW, BLOCK by date |
| Line Chart | Daily submission volume | Total artifacts submitted per day |
| Pie Chart | Decision distribution | Percentage breakdown of Ω-Gate decisions |
| Bar Chart | Risk distribution | Count of LOW, MEDIUM, HIGH, CRITICAL artifacts |

**Interactive Features:**
- Hover tooltips with detailed values
- Legend toggle to show/hide series
- Responsive design for mobile and desktop
- Real-time data updates

### 3. Misinformation Pattern Detection

**Detected Patterns:**

| Pattern | Severity | Trigger |
|---------|----------|---------|
| Critical Semantic Risk | CRITICAL | semanticRiskLevel = "CRITICAL" |
| Blocked Artifacts | CRITICAL | omegaGateDecision = "BLOCK" |
| High Bias Detected | HIGH | biasScore > 0.8 |
| Temporal Inconsistencies | MEDIUM | temporalCoherence < 0.5 |

**Pattern Display:**
- Pattern name and description
- Frequency (count of occurrences)
- Severity level (color-coded)
- Last seen timestamp
- Affected artifact count

### 4. Key Metrics Dashboard

**Metric Cards:**

| Metric | Description | Calculation |
|--------|-------------|-------------|
| Total Artifacts | Count of artifacts in period | Sum of all artifacts |
| Avg Semantic Score | Average semantic coherence | Mean of semanticScore |
| Avg Bias Score | Average bias detection | Mean of biasScore |
| Temporal Coherence | Average timeline consistency | Mean of temporalCoherence |

**Summary Statistics:**
- Pass rate (percentage)
- Hold rate (percentage)
- Review rate (percentage)
- Block rate (percentage)

## Architecture

### Backend: TimeSeriesAnalytics Service

Located in `server/timeseries_analytics.ts`, provides core analytics functions:

```typescript
// Trend calculation
TimeSeriesAnalytics.calculateTrend(dataPoints: number[]): TrendData

// Aggregation by decision
TimeSeriesAnalytics.aggregateByDecision(artifacts, bucketSize): TimeSeriesPoint[]

// Score trends
TimeSeriesAnalytics.calculateSemanticTrend(artifacts)
TimeSeriesAnalytics.calculateBiasTrend(artifacts)

// Pattern detection
TimeSeriesAnalytics.detectMisinformationPatterns(artifacts): MisinformationPattern[]

// Period analysis
TimeSeriesAnalytics.analyzePeriod(artifacts, startDate, endDate): AnalyticsPeriod

// Distribution calculations
TimeSeriesAnalytics.calculateDecisionDistribution(artifacts)
TimeSeriesAnalytics.calculateRiskDistribution(artifacts)

// Comprehensive report
TimeSeriesAnalytics.generateReport(artifacts, days): AnalyticsReport
```

### Frontend: AnalyticsDashboard Component

Located in `client/src/pages/AnalyticsDashboard.tsx`, provides:

1. **Data Fetching:**
   - Queries all artifacts: `trpc.artifacts.getAll.useQuery()`
   - Fetches organism status: `trpc.organism.getStatus.useQuery()`

2. **Data Processing:**
   - Filters artifacts by time range
   - Calculates trends and distributions
   - Detects patterns
   - Memoizes results for performance

3. **Visualization:**
   - Recharts components for interactive charts
   - Tailwind CSS for styling
   - Responsive grid layout

4. **Export Integration:**
   - PDF export via `ExportButton`
   - CSV export via `ExportButton`
   - Consistent file naming and encoding

## Data Flow

```
Artifacts → Filter by Date Range
         ↓
         → Calculate Distributions (PASS/HOLD/REVIEW/BLOCK)
         → Calculate Risk Distribution (LOW/MEDIUM/HIGH/CRITICAL)
         → Calculate Daily Trends
         → Calculate Average Scores
         → Detect Patterns
         ↓
Processed Data → Visualizations (Charts, Cards, Patterns)
              → Export (PDF, CSV)
```

## Usage

### Accessing the Dashboard

Navigate to `/analytics` in the Helena-E application.

### Time Range Selection

Use the dropdown selector to change the analysis period:
- **Last 7 days:** Short-term trend analysis
- **Last 30 days:** Standard monthly analysis
- **Last 90 days:** Quarterly trend analysis

### Interpreting Trends

**Upward Trend (↑):**
- Semantic/Bias scores: Increasing risk
- Submissions: Growing volume
- Action: Monitor closely

**Downward Trend (↓):**
- Semantic/Bias scores: Improving quality
- Submissions: Decreasing volume
- Action: Positive indicator

**Stable Trend (→):**
- Consistent performance
- Predictable patterns
- Action: Maintain current settings

### Pattern Analysis

**Critical Patterns:**
- Require immediate attention
- May indicate coordinated misinformation
- Consider blocking or escalation

**High Patterns:**
- Elevated risk level
- Monitor for escalation
- Consider additional review

**Medium Patterns:**
- Standard monitoring
- Track over time
- Escalate if frequency increases

## Performance Considerations

### Data Volume

- **Optimal:** 1,000-10,000 artifacts
- **Good:** 10,000-100,000 artifacts
- **Degraded:** 100,000+ artifacts (may require pagination)

### Computation

- Client-side processing for responsiveness
- Memoization prevents unnecessary recalculations
- Time range filtering reduces dataset size

### Rendering

- Recharts handles large datasets efficiently
- Responsive design adapts to screen size
- Lazy loading for chart components

## Limitations

### Current

- All trend calculations performed client-side
- No server-side caching of analytics
- Single-page analysis (no drill-down)
- Limited to 30-day default window
- No custom date range selection

### Future Enhancements

- Server-side analytics computation
- Pre-calculated trend caching
- Drill-down to individual artifacts
- Custom date range picker
- Scheduled analytics reports
- Anomaly detection alerts
- Comparative analysis (period-over-period)
- Predictive trend forecasting

## API Reference

### TimeSeriesAnalytics Methods

#### calculateTrend(dataPoints: number[]): TrendData

Calculates trend direction and change percentage.

**Returns:**
```typescript
{
  metric: string;
  direction: "up" | "down" | "stable";
  changePercent: number;
  startValue: number;
  endValue: number;
  dataPoints: TimeSeriesPoint[];
}
```

#### aggregateByDecision(artifacts, bucketSize): TimeSeriesPoint[]

Aggregates artifacts by Ω-Gate decision over time buckets.

**Parameters:**
- `artifacts`: Array of artifact objects
- `bucketSize`: Time bucket size in milliseconds (default: 86400000 = 1 day)

**Returns:** Array of time-series points with daily totals

#### detectMisinformationPatterns(artifacts): MisinformationPattern[]

Identifies misinformation patterns in artifact set.

**Returns:**
```typescript
{
  pattern: string;
  frequency: number;
  trend: "increasing" | "decreasing" | "stable";
  severity: "low" | "medium" | "high" | "critical";
  lastSeen: Date;
  affectedArtifacts: number;
}[]
```

#### analyzePeriod(artifacts, startDate, endDate): AnalyticsPeriod

Analyzes artifact statistics for a specific time period.

**Returns:**
```typescript
{
  startDate: Date;
  endDate: Date;
  totalArtifacts: number;
  passCount: number;
  holdCount: number;
  reviewCount: number;
  blockCount: number;
  averageSemanticScore: number;
  averageBiasScore: number;
  averageTemporalCoherence: number;
  misinformationPatterns: MisinformationPattern[];
}
```

#### generateReport(artifacts, days): AnalyticsReport

Generates comprehensive analytics report for specified period.

**Parameters:**
- `artifacts`: Array of artifact objects
- `days`: Number of days to analyze (default: 30)

**Returns:**
```typescript
{
  period: AnalyticsPeriod;
  trends: { semantic: TrendData; bias: TrendData };
  patterns: MisinformationPattern[];
  distribution: { decisions: any[]; risks: any[] };
}
```

## Integration Examples

### Adding to Navigation

```tsx
// In client/src/pages/Home.tsx
<Link href="/analytics">
  <Button>View Analytics Dashboard</Button>
</Link>
```

### Embedding in Dashboard

```tsx
// In client/src/pages/Dashboard.tsx
import AnalyticsDashboard from "./AnalyticsDashboard";

export function DashboardWithAnalytics() {
  return (
    <div>
      <h1>Platform Dashboard</h1>
      <AnalyticsDashboard />
    </div>
  );
}
```

### Custom Time Range

```tsx
// Extend AnalyticsDashboard with custom date picker
const [startDate, setStartDate] = useState<Date>();
const [endDate, setEndDate] = useState<Date>();

const customPeriod = useMemo(() => {
  if (!startDate || !endDate) return null;
  return TimeSeriesAnalytics.analyzePeriod(artifacts, startDate, endDate);
}, [artifacts, startDate, endDate]);
```

## Troubleshooting

### No Data Displayed

- Check if artifacts exist in the system
- Verify time range includes artifact creation dates
- Check browser console for errors
- Ensure user has read access to artifacts

### Charts Not Rendering

- Verify Recharts is installed: `pnpm list recharts`
- Check browser console for rendering errors
- Verify data format matches chart expectations
- Try refreshing the page

### Slow Performance

- Reduce time range to smaller period
- Filter artifacts before analysis
- Check browser memory usage
- Consider server-side analytics for large datasets

### Incorrect Trend Direction

- Verify data points are numeric
- Check for null/undefined values
- Ensure trend threshold (5%) is appropriate
- Review calculation logic in `calculateTrend()`

## Related Documentation

- [Helena-E Platform README](./HELENA_E_README.md)
- [Export Functionality Guide](./EXPORT_README.md)
- [Semantic Analysis Guide](./SEMANTIC_ANALYSIS_README.md)
- [Temporal Analysis Guide](./TEMPORAL_ANALYSIS_README.md)
- [Production Receipt](./PRODUCTION_RECEIPT.md)

## Testing

Run analytics tests:
```bash
pnpm test server/timeseries_analytics.test.ts
```

All 15 tests cover:
- Trend calculation (up/down/stable)
- Data aggregation
- Pattern detection
- Period analysis
- Distribution calculations
- Comprehensive report generation
