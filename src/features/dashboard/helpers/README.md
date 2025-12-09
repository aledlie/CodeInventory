# Dashboard Metrics Calculator

Utility functions for calculating aggregated metrics from analysis reports.

## Overview

The metrics calculator processes raw analysis reports (quality, coverage, dependencies) and produces aggregated metrics suitable for dashboard visualization. It handles missing or corrupted data gracefully with sensible defaults.

## Usage

### Basic Metrics Calculation

```typescript
import {
  calculateDashboardMetrics,
  type QualityReport,
  type CoverageReport,
  type DependencyReport
} from './helpers';

// Load your analysis reports
const qualityReport: QualityReport = await loadQualityReport();
const coverageReport: CoverageReport = await loadCoverageReport();
const dependencyReport: DependencyReport = await loadDependencyReport();

// Calculate aggregated metrics
const metrics = calculateDashboardMetrics(
  qualityReport,
  coverageReport,
  dependencyReport
);

console.log(metrics);
// {
//   totalFiles: 150,
//   qualityScore: 82,
//   coveragePercentage: 75.5,
//   criticalIssues: 2,
//   circularDeps: 1,
//   untestedFunctions: 25
// }
```

### Health Status Determination

```typescript
import { calculateHealthStatus, type DashboardMetrics } from './helpers';

const metrics: DashboardMetrics = {
  totalFiles: 150,
  qualityScore: 82,
  coveragePercentage: 75.5,
  criticalIssues: 0,
  circularDeps: 0,
  untestedFunctions: 25
};

const status = calculateHealthStatus(metrics);
console.log(status); // 'success' | 'warning' | 'error'
```

### Quality Score Calculation

```typescript
import { calculateQualityScore, type QualityReport } from './helpers';

const report: QualityReport = {
  timestamp: '2025-12-09T00:00:00Z',
  total_issues: 10,
  by_severity: {
    critical: 2,  // -10 points each = -20
    high: 3,      // -5 points each = -15
    medium: 3,    // -2 points each = -6
    low: 2        // -1 point each = -2
  },
  issues: []
};

const score = calculateQualityScore(report);
console.log(score); // 57 (100 - 43)
```

### Report Validation

```typescript
import {
  isValidQualityReport,
  isValidCoverageReport,
  isValidDependencyReport
} from './helpers';

// Validate reports before processing
const rawQuality = await loadJson('quality_report.json');
if (isValidQualityReport(rawQuality)) {
  const metrics = calculateDashboardMetrics(rawQuality, null, null);
  // Process metrics
}
```

## API Reference

### Functions

#### `calculateDashboardMetrics(quality, coverage, dependencies)`

Calculates aggregated metrics from all analysis reports.

**Parameters:**
- `quality` (QualityReport | null) - Code quality analysis report
- `coverage` (CoverageReport | null) - Test coverage analysis report
- `dependencies` (DependencyReport | null) - Dependency analysis report

**Returns:** `DashboardMetrics`

**Handles null inputs gracefully:**
- Missing quality report → 0 score, 0 critical issues
- Missing coverage report → 0% coverage, 0 untested functions
- Missing dependency report → 0 files, 0 circular dependencies

---

#### `calculateQualityScore(report)`

Calculates quality score (0-100) from quality report.

**Parameters:**
- `report` (QualityReport | null) - Code quality analysis report

**Returns:** `number` (0-100)

**Scoring formula:**
```
score = 100
  - (critical × 10)
  - (high × 5)
  - (medium × 2)
  - (low × 1)

Clamped to [0, 100]
```

---

#### `calculateHealthStatus(metrics)`

Determines overall health status from metrics.

**Parameters:**
- `metrics` (DashboardMetrics) - Aggregated dashboard metrics

**Returns:** `'error' | 'warning' | 'success'`

**Status rules:**

**Error** (critical condition):
- Critical issues > 0, OR
- Quality score < 50, OR
- Coverage < 30%

**Warning** (needs attention):
- Quality score < 75, OR
- Coverage < 60%, OR
- Circular dependencies > 0

**Success** (healthy):
- All metrics in healthy range

---

#### Validation Functions

```typescript
isValidQualityReport(report: unknown): report is QualityReport
isValidCoverageReport(report: unknown): report is CoverageReport
isValidDependencyReport(report: unknown): report is DependencyReport
```

Type guards for runtime validation of report structures.

## Types

### `DashboardMetrics`

```typescript
interface DashboardMetrics {
  totalFiles: number;           // Total files analyzed
  qualityScore: number;         // Quality score (0-100)
  coveragePercentage: number;   // Test coverage percentage
  criticalIssues: number;       // Count of critical issues
  circularDeps: number;         // Count of circular dependencies
  untestedFunctions: number;    // Count of untested functions
}
```

### `QualityReport`

```typescript
interface QualityReport {
  timestamp: string;
  total_issues: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  issues: Array<{
    file: string;
    line: number;
    severity: string;
    message: string;
  }>;
}
```

### `CoverageReport`

```typescript
interface CoverageReport {
  timestamp: string;
  coverage_percentage: number;
  total_functions: number;
  tested_functions: number;
  untested_functions: number;
}
```

### `DependencyReport`

```typescript
interface DependencyReport {
  timestamp: string;
  total_files: number;
  circular_dependencies: string[][];
}
```

### `HealthStatus`

```typescript
type HealthStatus = 'error' | 'warning' | 'success';
```

## Examples

### Complete Dashboard Integration

```typescript
import {
  calculateDashboardMetrics,
  calculateHealthStatus,
  type DashboardMetrics,
  type HealthStatus
} from './helpers';

async function loadDashboardData() {
  // Load reports from file system or API
  const quality = await loadJson('outputs/quality/quality_report.json');
  const coverage = await loadJson('outputs/coverage/coverage_report.json');
  const dependencies = await loadJson('outputs/dependencies/dependency_report.json');

  // Calculate metrics
  const metrics = calculateDashboardMetrics(quality, coverage, dependencies);

  // Determine health status
  const status = calculateHealthStatus(metrics);

  return { metrics, status };
}

// Usage in React component
function Dashboard() {
  const { metrics, status } = useDashboardData();

  return (
    <div>
      <MetricCard
        title="Total Files"
        value={metrics.totalFiles}
        status={status}
      />
      <MetricCard
        title="Quality Score"
        value={`${metrics.qualityScore}/100`}
        status={status}
      />
      <MetricCard
        title="Test Coverage"
        value={`${metrics.coveragePercentage.toFixed(1)}%`}
        status={status}
      />
    </div>
  );
}
```

### Handling Missing Reports

```typescript
import { calculateDashboardMetrics } from './helpers';

// Gracefully handle missing or failed report loading
async function loadDashboardMetrics() {
  let quality = null;
  let coverage = null;
  let dependencies = null;

  try {
    quality = await loadJson('quality_report.json');
  } catch (e) {
    console.warn('Quality report not available');
  }

  try {
    coverage = await loadJson('coverage_report.json');
  } catch (e) {
    console.warn('Coverage report not available');
  }

  try {
    dependencies = await loadJson('dependency_report.json');
  } catch (e) {
    console.warn('Dependency report not available');
  }

  // Still works with partial data
  return calculateDashboardMetrics(quality, coverage, dependencies);
}
```

### Custom Metric Thresholds

```typescript
import type { DashboardMetrics, HealthStatus } from './helpers';

function customHealthStatus(metrics: DashboardMetrics): HealthStatus {
  // Custom thresholds for your project
  const CRITICAL_QUALITY_THRESHOLD = 60;
  const CRITICAL_COVERAGE_THRESHOLD = 40;
  const WARNING_QUALITY_THRESHOLD = 80;
  const WARNING_COVERAGE_THRESHOLD = 70;

  if (
    metrics.criticalIssues > 0 ||
    metrics.qualityScore < CRITICAL_QUALITY_THRESHOLD ||
    metrics.coveragePercentage < CRITICAL_COVERAGE_THRESHOLD
  ) {
    return 'error';
  }

  if (
    metrics.qualityScore < WARNING_QUALITY_THRESHOLD ||
    metrics.coveragePercentage < WARNING_COVERAGE_THRESHOLD ||
    metrics.circularDeps > 5 // Custom threshold
  ) {
    return 'warning';
  }

  return 'success';
}
```

## Testing

Run tests with:

```bash
npm test -- calculateMetrics.test.ts
```

The test suite covers:
- Quality score calculation with various severities
- Health status determination for all conditions
- Dashboard metrics aggregation
- Null/undefined handling
- Report validation
- Edge cases (zero scores, very high issue counts)

## Performance

All calculations are O(1) time complexity as they work with pre-aggregated report data. No file I/O or expensive computations are performed.

Expected performance:
- `calculateDashboardMetrics`: < 1ms
- `calculateQualityScore`: < 1ms
- `calculateHealthStatus`: < 1ms

## Error Handling

The calculator is designed to be resilient:

- **Null reports**: Returns zero values for missing data
- **Missing fields**: Uses default values via optional chaining
- **Invalid data types**: Type guards provide runtime validation
- **Corrupted data**: Clamps values to valid ranges (e.g., quality score 0-100)

No exceptions are thrown; all functions return valid values even with corrupted input.
