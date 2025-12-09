# Dashboard Data Hooks

TanStack Query hooks for fetching and caching dashboard data with React Suspense integration.

## Overview

These hooks provide a declarative, type-safe way to fetch dashboard data using TanStack Query v5 with Suspense mode. They eliminate the need for manual loading states and error handling in components.

## Features

- **Suspense Integration**: Automatic loading state management via React Suspense
- **Error Boundaries**: Errors propagate to nearest Error Boundary
- **Smart Caching**: 5-minute staleTime, 10-minute garbage collection
- **Type Safety**: Full TypeScript support with inferred types
- **Optimistic Updates**: Built-in support for cache invalidation and refetching

## Installation

These hooks require the QueryProvider to be set up at the app root:

```tsx
import { QueryProvider } from '../providers';

function App() {
  return (
    <QueryProvider>
      <YourApp />
    </QueryProvider>
  );
}
```

## Available Hooks

### `useDashboardData(outputsPath: string)`

Main hook that fetches all dashboard reports (quality, coverage, dependencies).

**Returns:** `UseSuspenseQueryResult<DashboardData>`

**Example:**
```tsx
import { useDashboardData } from './hooks';

function Dashboard() {
  const { data } = useDashboardData('/path/to/outputs');

  return (
    <div>
      <h1>Dashboard</h1>
      <QualityMetrics quality={data.quality} />
      <CoverageMetrics coverage={data.coverage} />
      <DependencyGraph dependencies={data.dependencies} />
    </div>
  );
}
```

### `useQualityReport(outputsPath: string)`

Fetches only the code quality analysis report.

**Returns:** `UseSuspenseQueryResult<QualityReport>`

**Example:**
```tsx
import { useQualityReport } from './hooks';

function QualityDashboard() {
  const { data } = useQualityReport('/path/to/outputs');

  return (
    <div>
      <h2>Code Quality</h2>
      <p>Total Issues: {data.summary.total_issues}</p>
      <IssuesList issues={data.issues} />
    </div>
  );
}
```

### `useCoverageReport(outputsPath: string)`

Fetches only the test coverage report.

**Returns:** `UseSuspenseQueryResult<CoverageReport>`

**Example:**
```tsx
import { useCoverageReport } from './hooks';

function CoverageDashboard() {
  const { data } = useCoverageReport('/path/to/outputs');

  return (
    <div>
      <h2>Test Coverage</h2>
      <p>Coverage: {data.summary.coverage_percentage.toFixed(1)}%</p>
      <UntestedFunctions functions={data.untested_functions} />
    </div>
  );
}
```

### `useDependencyReport(outputsPath: string)`

Fetches only the dependency analysis report.

**Returns:** `UseSuspenseQueryResult<DependencyReport>`

**Example:**
```tsx
import { useDependencyReport } from './hooks';

function DependencyDashboard() {
  const { data } = useDependencyReport('/path/to/outputs');

  return (
    <div>
      <h2>Dependencies</h2>
      <CircularDependencies cycles={data.circular_dependencies} />
      <DependencyGraph graph={data.dependency_graph} />
    </div>
  );
}
```

## Usage Patterns

### Basic Usage with Suspense

```tsx
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useDashboardData } from './hooks';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorView />}>
      <Suspense fallback={<LoadingSpinner />}>
        <Dashboard />
      </Suspense>
    </ErrorBoundary>
  );
}

function Dashboard() {
  // No loading state - Suspense handles it
  // No error handling - ErrorBoundary handles it
  const { data } = useDashboardData('/outputs');

  return <DashboardView data={data} />;
}
```

### Manual Cache Invalidation

```tsx
import { useQueryClient } from './hooks';

function RefreshButton() {
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    // Invalidate all dashboard queries
    await queryClient.invalidateQueries({
      queryKey: ['dashboard']
    });

    // Or invalidate specific reports
    await queryClient.invalidateQueries({
      queryKey: ['quality-report']
    });
  };

  return <button onClick={handleRefresh}>Refresh</button>;
}
```

### Refetching Data

```tsx
function DashboardWithRefetch() {
  const { data, refetch, isRefetching } = useDashboardData('/outputs');

  return (
    <div>
      <button onClick={() => refetch()} disabled={isRefetching}>
        {isRefetching ? 'Refreshing...' : 'Refresh'}
      </button>
      <DashboardView data={data} />
    </div>
  );
}
```

### Nested Suspense Boundaries

Each section can have its own loading state:

```tsx
function DashboardWithSections() {
  return (
    <div>
      <h1>Dashboard</h1>

      <Suspense fallback={<SectionSkeleton />}>
        <QualitySection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <CoverageSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <DependencySection />
      </Suspense>
    </div>
  );
}

function QualitySection() {
  const { data } = useQualityReport('/outputs');
  return <QualityView data={data} />;
}
```

### Error Recovery

```tsx
function DashboardWithRecovery() {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div>
          <h2>Error: {error.message}</h2>
          <button onClick={resetErrorBoundary}>
            Try Again
          </button>
        </div>
      )}
      onReset={() => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }}
    >
      <Suspense fallback={<LoadingSpinner />}>
        <Dashboard />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Configuration

### Cache Configuration

Default cache settings (configured in `QueryProvider`):

- **staleTime**: 5 minutes - How long data is considered fresh
- **gcTime**: 10 minutes - How long unused data stays in cache
- **retry**: 1 - Number of retry attempts on failure
- **refetchOnWindowFocus**: false - Don't refetch on window focus
- **refetchOnReconnect**: true - Refetch when network reconnects

### Custom Configuration

Override defaults for specific hooks:

```tsx
export const useDashboardData = (outputsPath: string) => {
  return useSuspenseQuery({
    queryKey: ['dashboard', outputsPath],
    queryFn: () => dashboardApi.loadAllReports(outputsPath),
    staleTime: 10 * 60 * 1000, // 10 minutes instead of 5
    gcTime: 30 * 60 * 1000, // 30 minutes instead of 10
    retry: 3, // 3 retries instead of 1
  });
};
```

## Type Safety

All hooks return fully typed data:

```typescript
// Type is automatically inferred
const { data } = useDashboardData('/outputs');
// data is of type DashboardData

const { data: quality } = useQualityReport('/outputs');
// quality is of type QualityReport

const { data: coverage } = useCoverageReport('/outputs');
// coverage is of type CoverageReport

const { data: dependencies } = useDependencyReport('/outputs');
// dependencies is of type DependencyReport
```

## React Query DevTools

DevTools are automatically enabled in development mode. Access them via the floating icon in the bottom-right corner of the screen.

Features:
- View query cache state
- Monitor query status (loading, success, error)
- Manually trigger refetches
- Clear cache

Disable DevTools:

```tsx
<QueryProvider showDevTools={false}>
  <App />
</QueryProvider>
```

## Best Practices

### 1. Always Use Suspense and Error Boundaries

```tsx
// Good
<ErrorBoundary fallback={<Error />}>
  <Suspense fallback={<Loading />}>
    <Dashboard />
  </Suspense>
</ErrorBoundary>

// Bad - will cause runtime errors
<Dashboard /> // No Suspense or ErrorBoundary
```

### 2. Use Specific Hooks When Possible

```tsx
// Good - only fetches what's needed
function QualityView() {
  const { data } = useQualityReport('/outputs');
  return <QualityMetrics data={data} />;
}

// Less optimal - fetches all reports when only quality is needed
function QualityView() {
  const { data } = useDashboardData('/outputs');
  return <QualityMetrics data={data.quality} />;
}
```

### 3. Invalidate Queries After Mutations

```tsx
async function runAnalysis() {
  await analysisApi.run();

  // Invalidate cache to fetch fresh data
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}
```

### 4. Use Query Keys Consistently

```tsx
// Query keys should be predictable and consistent
['dashboard', outputsPath] // Main dashboard data
['quality-report', outputsPath] // Quality report
['coverage-report', outputsPath] // Coverage report
['dependency-report', outputsPath] // Dependency report
```

## Troubleshooting

### "useSuspenseQuery must be used within Suspense"

**Problem:** Component using the hook is not wrapped in Suspense boundary.

**Solution:**
```tsx
<Suspense fallback={<Loading />}>
  <YourComponent />
</Suspense>
```

### "No QueryClient set"

**Problem:** QueryProvider not set up at app root.

**Solution:**
```tsx
import { QueryProvider } from './providers';

ReactDOM.createRoot(root).render(
  <QueryProvider>
    <App />
  </QueryProvider>
);
```

### Stale Data

**Problem:** Dashboard shows old data after analysis runs.

**Solution:** Invalidate queries after analysis completes:
```tsx
await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
```

### Type Errors

**Problem:** TypeScript errors about data types.

**Solution:** Ensure types are imported from the correct location:
```tsx
import type { DashboardData } from '../types/dashboard';
```

## Performance Considerations

### Cache Hit Ratio

Monitor cache effectiveness via React Query DevTools. A high cache hit ratio means data is being served from cache rather than refetched.

### Network Waterfalls

Avoid sequential fetches by using the main `useDashboardData` hook which fetches all reports in parallel:

```tsx
// Good - parallel fetch
const { data } = useDashboardData('/outputs');

// Bad - sequential fetches (waterfall)
const { data: quality } = useQualityReport('/outputs');
const { data: coverage } = useCoverageReport('/outputs');
const { data: dependencies } = useDependencyReport('/outputs');
```

### Memory Usage

Query cache is garbage collected after `gcTime` (10 minutes by default). Adjust if needed:

```tsx
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000, // 5 minutes for lower memory usage
    },
  },
});
```

## Related Documentation

- [TanStack Query v5 Documentation](https://tanstack.com/query/latest)
- [React Suspense Guide](https://react.dev/reference/react/Suspense)
- [Error Boundary Documentation](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Dashboard API Documentation](../api/README.md)
- [Dashboard Types](../types/README.md)

## Examples

See comprehensive examples in:
- `examples/HooksUsage.example.tsx` - Complete usage patterns
- `components/INTEGRATION_GUIDE.md` - Component integration guide
