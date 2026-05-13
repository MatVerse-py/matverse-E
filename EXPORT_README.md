# Helena-E Export Functionality

## Overview

Helena-E provides comprehensive export capabilities for artifact analysis reports, ledger entries, and platform analytics. All exports support multiple formats (PDF and CSV) with consistent base64 encoding for reliable transmission.

## Supported Export Types

### 1. Artifact Analysis Export

Export detailed analysis of a single artifact including semantic scores, temporal coherence, bias detection, and Ω-Gate decision.

**Formats:**
- **PDF**: Comprehensive HTML-based report with formatted sections for analysis, timeline, and bias metrics
- **CSV**: Tabular format with all artifact metadata and scores

**Usage:**
```typescript
// PDF Export
const result = await trpc.export.exportArtifactPDF.mutate({
  artifactId: "art-123",
  artifactData: {
    content: "Artifact content...",
    omegaGateDecision: "PASS",
    semanticScore: 0.85,
    // ... other metrics
  }
});

// CSV Export
const result = await trpc.export.exportArtifactsCSV.mutate({
  artifacts: [/* array of artifacts */]
});
```

### 2. Ledger Export

Export the immutable append-only ledger of all operations performed on artifacts.

**Format:**
- **CSV**: Includes entry ID, timestamp, operation type, artifact ID, Ω-Gate decision, SHA-256 hash, and status

**Usage:**
```typescript
const result = await trpc.export.exportLedgerCSV.mutate({
  ledgerEntries: [/* array of ledger entries */]
});
```

**Ledger Fields:**
- `Entry ID`: Unique identifier for ledger entry
- `Timestamp`: When operation was recorded
- `Operation Type`: SUBMIT, EVALUATE, APPROVE, BLOCK, etc.
- `Artifact ID`: Associated artifact
- `Ω-Gate Decision`: PASS, HOLD, REVIEW, or BLOCK
- `Hash SHA-256`: Cryptographic hash of operation
- `Status`: Current status of entry
- `Reason`: Additional context or justification

### 3. Analytics Export

Export platform-wide analytics including artifact metrics, trends, top risks, and system health.

**Formats:**
- **PDF**: Formatted report with metrics, trends, and system health visualizations
- **CSV**: Structured data with metrics, trends, risks, and health indicators

**Usage:**
```typescript
// PDF Export
const result = await trpc.export.exportAnalyticsPDF.mutate({
  analyticsData: {
    artifacts: { totalSubmitted: 100, passRate: 0.8 },
    systemHealth: { uptime: 99.5, avgProcessingTime: 150 }
  }
});

// CSV Export
const result = await trpc.export.exportAnalyticsCSV.mutate({
  analyticsData: { /* analytics data */ }
});
```

## Technical Details

### Encoding

All export content is **base64-encoded** for consistent transport over tRPC. This ensures:
- Binary-safe transmission of PDF content
- Consistent handling of special characters in CSV
- Reliable download across all client environments

**Client-side decoding:**
```typescript
// Decode base64 content
const binaryString = atob(result.content);
const bytes = new Uint8Array(binaryString.length);
for (let i = 0; i < binaryString.length; i++) {
  bytes[i] = binaryString.charCodeAt(i);
}

// Create blob and download
const blob = new Blob([bytes], { type: result.contentType });
const url = window.URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = result.filename;
link.click();
```

### Response Format

All export procedures return a consistent response structure:

```typescript
{
  filename: string;        // Suggested filename for download
  contentType: string;     // MIME type (application/pdf or text/csv)
  size: number;            // Content size in bytes
  content: string;         // Base64-encoded content
}
```

### File Naming Convention

Export files follow a consistent naming pattern:

- **Artifact PDF**: `helena-e-artifact-{artifactId}-{date}.pdf`
- **Artifact CSV**: `helena-e-artifact-all-{date}.csv`
- **Ledger CSV**: `helena-e-ledger-{date}.csv`
- **Analytics PDF**: `helena-e-analytics-{date}.pdf`
- **Analytics CSV**: `helena-e-analytics-{date}.csv`

## UI Components

### ExportButton

Standalone button component for exporting a single format.

```tsx
<ExportButton
  type="pdf"
  reportType="artifact"
  data={artifactData}
  artifactId="art-123"
  label="Export as PDF"
/>
```

**Props:**
- `type`: "pdf" | "csv"
- `reportType`: "artifact" | "ledger" | "analytics"
- `data`: Export data object
- `artifactId?`: Optional artifact identifier
- `label?`: Custom button label
- `className?`: Additional CSS classes

**Features:**
- Loading state with spinner
- Success confirmation
- Error toast notifications
- Automatic file download

### ExportMenu

Dropdown menu component for exporting multiple formats.

```tsx
<ExportMenu
  reportType="artifact"
  data={artifactData}
  artifactId="art-123"
/>
```

**Props:**
- `reportType`: "artifact" | "ledger" | "analytics"
- `data`: Export data object
- `artifactId?`: Optional artifact identifier

**Features:**
- Shows only supported formats for report type
- Dropdown menu with format options
- Individual loading states per format
- Consistent styling with application theme

## Supported Formats

### PDF (HTML-based)

**Advantages:**
- Professional formatting with styled sections
- Includes all analysis metrics and visualizations
- Suitable for printing and archival
- Readable in any PDF viewer

**Limitations:**
- Currently HTML-based (not binary PDF)
- Requires client-side PDF conversion for true binary format
- File size may be larger than CSV

**Sections included:**
- Header with artifact ID and generation timestamp
- Metadata (decision, scores, risk level)
- Analysis summary (semantic, temporal, bias metrics)
- Detailed findings and recommendations

### CSV

**Advantages:**
- Lightweight and easy to parse
- Compatible with spreadsheet applications
- Suitable for bulk data analysis
- Compact file size

**Limitations:**
- Limited formatting capabilities
- No embedded visualizations
- Requires external tools for complex analysis

**Columns included:**
- Artifact ID
- Created At (timestamp)
- Ω-Gate Decision
- Semantic Score
- Risk Level
- Temporal Coherence
- Bias metrics (political, cultural, ideological)
- Trust Score
- Content preview

## Integration Points

### Dashboard Page

Export analytics and platform metrics:
```tsx
<ExportMenu
  reportType="analytics"
  data={analyticsData}
/>
```

### Ledger Page

Export immutable ledger records:
```tsx
<ExportButton
  type="csv"
  reportType="ledger"
  data={ledgerEntries}
/>
```

### Artifact Details Page

Export individual artifact analysis:
```tsx
<ExportMenu
  reportType="artifact"
  data={artifactData}
  artifactId={artifactId}
/>
```

## Error Handling

Export procedures include comprehensive error handling:

- **Invalid input**: Zod validation errors
- **Processing failures**: Service-level error messages
- **Network issues**: tRPC error propagation
- **Client errors**: Toast notifications with user-friendly messages

**Example error handling:**
```tsx
const exportMutation = trpc.export.exportArtifactPDF.useMutation({
  onError: (error) => {
    toast.error(`Export failed: ${error.message}`);
  },
  onSuccess: (data) => {
    // Download file
    toast.success("Export successful");
  },
});
```

## Performance Considerations

- **Large datasets**: CSV exports are more efficient for large ledger entries
- **Network**: Base64 encoding increases payload size by ~33%
- **Client memory**: Large PDF content may impact browser memory
- **Concurrency**: Multiple simultaneous exports are supported

## Security

- **Authentication**: All export procedures require authenticated user (protectedProcedure)
- **Authorization**: Admin-only exports can be implemented via role checks
- **Data privacy**: Exports contain sensitive analysis data - ensure proper access controls
- **Audit trail**: All export operations are logged in the ledger

## Limitations

### Current

- PDF export is HTML-based, not true binary PDF format
- No server-side PDF generation (requires client-side conversion)
- Single artifact export only (batch exports not yet supported)
- No scheduled/automated exports

### Future Enhancements

- Real PDF generation using wkhtmltopdf or puppeteer
- Batch export functionality
- Scheduled exports with email delivery
- Custom export templates
- Multi-language support
- Advanced filtering and sorting options

## Usage Examples

### Export Artifact Analysis

```tsx
import { ExportButton } from "@/components/ExportButton";

export function ArtifactDetail({ artifact }) {
  return (
    <div>
      <h1>{artifact.id}</h1>
      <ExportButton
        type="pdf"
        reportType="artifact"
        data={artifact}
        artifactId={artifact.id}
        label="Download Report"
      />
    </div>
  );
}
```

### Export Ledger

```tsx
import { ExportMenu } from "@/components/ExportButton";

export function LedgerPage({ entries }) {
  return (
    <div>
      <h1>Immutable Ledger</h1>
      <ExportMenu
        reportType="ledger"
        data={entries}
      />
      {/* Ledger table */}
    </div>
  );
}
```

### Export Analytics

```tsx
import { ExportButton } from "@/components/ExportButton";

export function AnalyticsDashboard({ analytics }) {
  return (
    <div>
      <h1>Platform Analytics</h1>
      <ExportButton
        type="csv"
        reportType="analytics"
        data={analytics}
        label="Export Data"
      />
      {/* Analytics visualizations */}
    </div>
  );
}
```

## Troubleshooting

### Export button not responding

- Check browser console for errors
- Verify user is authenticated
- Ensure data object is properly formatted
- Check network tab for failed requests

### Downloaded file is corrupted

- Verify base64 decoding on client
- Check file MIME type matches content
- Try different browser
- Check available disk space

### PDF looks incorrect

- PDF is HTML-based, not true binary format
- Use browser's print-to-PDF for better formatting
- Consider using external PDF generation service

### CSV has encoding issues

- Ensure UTF-8 encoding in spreadsheet application
- Check for special characters in data
- Try importing with explicit encoding settings

## API Reference

### exportArtifactPDF

Export single artifact analysis to PDF.

```typescript
trpc.export.exportArtifactPDF.mutate({
  artifactId: string;
  artifactData: {
    content?: string;
    omegaGateDecision?: string;
    semanticScore?: number;
    semanticRiskLevel?: string;
    temporalCoherence?: number;
    politicalBias?: number;
    culturalBias?: number;
    ideologicalBias?: number;
    biasScore?: number;
  };
})
```

### exportArtifactsCSV

Export multiple artifacts to CSV.

```typescript
trpc.export.exportArtifactsCSV.mutate({
  artifacts: Array<{
    id?: string;
    createdAt?: Date;
    omegaGateDecision?: string;
    semanticScore?: number;
    semanticRiskLevel?: string;
    content?: string;
  }>;
})
```

### exportLedgerCSV

Export ledger entries to CSV.

```typescript
trpc.export.exportLedgerCSV.mutate({
  ledgerEntries: Array<{
    id?: string;
    timestamp?: Date;
    operationType?: string;
    artifactId?: string;
    omegaGateDecision?: string;
    hashSha256?: string;
    status?: string;
    reason?: string;
  }>;
})
```

### exportAnalyticsCSV

Export analytics to CSV.

```typescript
trpc.export.exportAnalyticsCSV.mutate({
  analyticsData: {
    artifacts?: object;
    trends?: Array<object>;
    topRisks?: Array<object>;
    systemHealth?: object;
  };
})
```

### exportAnalyticsPDF

Export analytics to PDF.

```typescript
trpc.export.exportAnalyticsPDF.mutate({
  analyticsData: {
    artifacts?: object;
    trends?: Array<object>;
    topRisks?: Array<object>;
    systemHealth?: object;
  };
})
```

### getSupportedFormats

Get list of supported export formats and report types.

```typescript
trpc.export.getSupportedFormats.query()
```

Returns:
```typescript
{
  formats: Array<{
    type: "pdf" | "csv";
    description: string;
    mimeType: string;
    extensions: string[];
    encoding: "base64";
  }>;
  reportTypes: Array<{
    type: "artifact" | "ledger" | "analytics";
    description: string;
    supportedFormats: string[];
  }>;
  note: string;
}
```

## Related Documentation

- [Helena-E Platform README](./HELENA_E_README.md)
- [Semantic Analysis Guide](./SEMANTIC_ANALYSIS_README.md)
- [Temporal Analysis Guide](./TEMPORAL_ANALYSIS_README.md)
- [Production Receipt](./PRODUCTION_RECEIPT.md)
