/**
 * Example: Loading Dashboard Reports
 *
 * Demonstrates how to use the dashboardApi service to load
 * Python analyzer reports and display them in React components.
 */

import { useState, useEffect } from 'react';
import { dashboardApi } from '../dashboardApi';
import type { PythonAnalyzerData, ReportLoadError } from '../../types';
import { logger } from '../../helpers/logger';

/**
 * Simple loading state component
 */
function LoadingSpinner() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Loading reports...</p>
    </div>
  );
}

/**
 * Error display component
 */
function ErrorDisplay({ errors }: { errors: ReportLoadError[] }) {
  return (
    <div style={{ padding: '1rem', backgroundColor: '#fee', border: '1px solid #c33', borderRadius: '4px' }}>
      <h3>Errors Loading Reports</h3>
      <ul>
        {errors.map((err, idx) => (
          <li key={idx}>
            <strong>{err.reportType}:</strong> {err.error}
            <br />
            <small>Path: {err.path}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Quality report summary component
 */
function QualitySummary({ data }: { data: PythonAnalyzerData }) {
  if (!data.quality) {
    return <div>No quality report available</div>;
  }

  const { total_files_scanned, total_issues, issues_by_severity, issues_by_category } = data.quality;

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '1rem' }}>
      <h3>Code Quality</h3>
      <p>Scanned {total_files_scanned} files</p>
      <p>Found {total_issues} issues</p>

      <h4>By Severity</h4>
      <ul>
        {Object.entries(issues_by_severity).map(([severity, count]) => (
          <li key={severity}>
            {severity}: {count}
          </li>
        ))}
      </ul>

      <h4>By Category</h4>
      <ul>
        {Object.entries(issues_by_category).map(([category, count]) => (
          <li key={category}>
            {category}: {count}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Coverage report summary component
 */
function CoverageSummary({ data }: { data: PythonAnalyzerData }) {
  if (!data.coverage) {
    return <div>No coverage report available</div>;
  }

  const { total_functions, tested_functions, untested_functions, coverage_percentage } = data.coverage;

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '1rem' }}>
      <h3>Test Coverage</h3>
      <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
        {coverage_percentage.toFixed(1)}%
      </p>
      <p>
        {tested_functions} / {total_functions} functions tested
      </p>
      <p style={{ color: '#666' }}>
        {untested_functions} functions without tests
      </p>
    </div>
  );
}

/**
 * Dependency report summary component
 */
function DependencySummary({ data }: { data: PythonAnalyzerData }) {
  if (!data.dependencies) {
    return <div>No dependency report available</div>;
  }

  const { total_dependencies, external_dependencies, internal_dependencies, circular_dependencies } = data.dependencies;

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '1rem' }}>
      <h3>Dependencies</h3>
      <p>Total: {total_dependencies}</p>
      <p>External: {external_dependencies}</p>
      <p>Internal: {internal_dependencies}</p>

      {circular_dependencies.length > 0 && (
        <>
          <h4 style={{ color: '#c33' }}>Circular Dependencies ({circular_dependencies.length})</h4>
          <ul>
            {circular_dependencies.map((cycle, idx) => (
              <li key={idx}>
                <code>{cycle.join(' → ')}</code>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/**
 * Main dashboard component that loads and displays reports
 */
export function LoadReportsExample() {
  const [data, setData] = useState<PythonAnalyzerData | null>(null);
  const [errors, setErrors] = useState<ReportLoadError[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);

        // Load all reports from the outputs directory
        const result = await dashboardApi.loadAllReports('./outputs');

        setData(result.data);
        setErrors(result.errors);
      } catch (error) {
        logger.error('LoadReportsExample', 'Fatal error loading reports', error instanceof Error ? error : undefined);
        // This would be a network error or catastrophic failure
        setErrors([
          {
            reportType: 'quality',
            error: error instanceof Error ? error.message : 'Unknown error',
            path: 'unknown',
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (errors.length > 0) {
    return <ErrorDisplay errors={errors} />;
  }

  if (!data) {
    return <div>No data available</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Code Inventory Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <QualitySummary data={data} />
        <CoverageSummary data={data} />
        <DependencySummary data={data} />
      </div>

      {/* Show individual missing reports */}
      {!data.quality && <p style={{ color: '#666' }}>Quality report not available</p>}
      {!data.coverage && <p style={{ color: '#666' }}>Coverage report not available</p>}
      {!data.dependencies && <p style={{ color: '#666' }}>Dependency report not available</p>}
    </div>
  );
}

/**
 * Example with custom output path
 */
export function LoadReportsWithCustomPath({ outputsPath }: { outputsPath: string }) {
  const [data, setData] = useState<PythonAnalyzerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const result = await dashboardApi.loadAllReports(outputsPath);
        setData(result.data);
      } catch (error) {
        logger.error('LoadReportsWithCustomPath', 'Error loading reports', error instanceof Error ? error : undefined);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [outputsPath]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Reports from: {outputsPath}</h2>
      {data && (
        <>
          <QualitySummary data={data} />
          <CoverageSummary data={data} />
          <DependencySummary data={data} />
        </>
      )}
    </div>
  );
}

/**
 * Example with individual report loading
 */
export function LoadIndividualReportsExample() {
  const [quality, setQuality] = useState<PythonAnalyzerData['quality']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuality() {
      try {
        const report = await dashboardApi.loadQualityReport('./outputs');
        setQuality(report);
      } catch (error) {
        logger.error('LoadIndividualReportsExample', 'Error loading quality report', error instanceof Error ? error : undefined);
      } finally {
        setLoading(false);
      }
    }

    loadQuality();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Quality Report Only</h2>
      <QualitySummary data={{ quality, coverage: null, dependencies: null }} />
    </div>
  );
}
