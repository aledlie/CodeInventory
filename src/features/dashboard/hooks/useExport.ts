/**
 * Export Hooks
 *
 * Phase 5C: Advanced Features
 * React hooks for exporting dashboard data to various formats.
 *
 * Features:
 * - CSV export for tables
 * - PDF export for reports
 * - JSON export for data backup
 * - Pre-configured exports for common use cases
 */

import { useCallback, useState } from 'react';
import {
  exportToCsv,
  exportToJson,
  exportToPdf,
  type CsvColumn,
  type CsvExportOptions,
  type JsonExportOptions,
  type PdfExportOptions,
  type ExportResult,
} from '../api/exportApi';

// ============================================================================
// Types
// ============================================================================

export interface UseExportState {
  isExporting: boolean;
  lastExport: ExportResult | null;
  error: string | null;
}

export interface UseExportReturn extends UseExportState {
  exportCsv: <T>(
    data: T[],
    columns: CsvColumn<T>[],
    options: CsvExportOptions
  ) => Promise<ExportResult>;
  exportJson: <T>(data: T, options: JsonExportOptions) => Promise<ExportResult>;
  exportPdf: (content: string, options: PdfExportOptions) => Promise<ExportResult>;
  clearError: () => void;
  clearLastExport: () => void;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Use Export Hook
 *
 * Provides export functionality with loading states and error handling.
 *
 * @example
 * ```tsx
 * function ExportButton() {
 *   const { exportCsv, isExporting, error } = useExport();
 *
 *   const handleExport = async () => {
 *     const result = await exportCsv(data, columns, { filename: 'report' });
 *     if (result.success) {
 *       console.log('Exported:', result.filename);
 *     }
 *   };
 *
 *   return (
 *     <Button onClick={handleExport} disabled={isExporting}>
 *       {isExporting ? 'Exporting...' : 'Export CSV'}
 *     </Button>
 *   );
 * }
 * ```
 */
export function useExport(): UseExportReturn {
  const [state, setState] = useState<UseExportState>({
    isExporting: false,
    lastExport: null,
    error: null,
  });

  const exportCsv = useCallback(
    async <T>(
      data: T[],
      columns: CsvColumn<T>[],
      options: CsvExportOptions
    ): Promise<ExportResult> => {
      setState((prev) => ({ ...prev, isExporting: true, error: null }));

      try {
        // Small delay to show loading state
        await new Promise((resolve) => setTimeout(resolve, 100));

        const result = exportToCsv(data, columns, options);

        setState((prev) => ({
          ...prev,
          isExporting: false,
          lastExport: result,
          error: result.success ? null : result.error ?? 'Export failed',
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Export failed';
        const result: ExportResult = {
          success: false,
          filename: '',
          format: 'csv',
          size: 0,
          error: errorMessage,
        };

        setState((prev) => ({
          ...prev,
          isExporting: false,
          lastExport: result,
          error: errorMessage,
        }));

        return result;
      }
    },
    []
  );

  const exportJson = useCallback(
    async <T>(data: T, options: JsonExportOptions): Promise<ExportResult> => {
      setState((prev) => ({ ...prev, isExporting: true, error: null }));

      try {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const result = exportToJson(data, options);

        setState((prev) => ({
          ...prev,
          isExporting: false,
          lastExport: result,
          error: result.success ? null : result.error ?? 'Export failed',
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Export failed';
        const result: ExportResult = {
          success: false,
          filename: '',
          format: 'json',
          size: 0,
          error: errorMessage,
        };

        setState((prev) => ({
          ...prev,
          isExporting: false,
          lastExport: result,
          error: errorMessage,
        }));

        return result;
      }
    },
    []
  );

  const exportPdf = useCallback(
    async (content: string, options: PdfExportOptions): Promise<ExportResult> => {
      setState((prev) => ({ ...prev, isExporting: true, error: null }));

      try {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const result = exportToPdf(content, options);

        setState((prev) => ({
          ...prev,
          isExporting: false,
          lastExport: result,
          error: result.success ? null : result.error ?? 'Export failed',
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Export failed';
        const result: ExportResult = {
          success: false,
          filename: '',
          format: 'pdf',
          size: 0,
          error: errorMessage,
        };

        setState((prev) => ({
          ...prev,
          isExporting: false,
          lastExport: result,
          error: errorMessage,
        }));

        return result;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearLastExport = useCallback(() => {
    setState((prev) => ({ ...prev, lastExport: null }));
  }, []);

  return {
    ...state,
    exportCsv,
    exportJson,
    exportPdf,
    clearError,
    clearLastExport,
  };
}

// ============================================================================
// Pre-configured Export Hooks
// ============================================================================

/**
 * Pre-configured columns for quality issues export
 */
export const QUALITY_ISSUES_COLUMNS: CsvColumn<{
  id: string;
  path: string;
  severity: string;
  category: string;
  message: string;
  line?: number;
  column?: number;
}>[] = [
  { header: 'ID', accessor: 'id' },
  { header: 'File Path', accessor: 'path' },
  { header: 'Severity', accessor: 'severity' },
  { header: 'Category', accessor: 'category' },
  { header: 'Message', accessor: 'message' },
  { header: 'Line', accessor: 'line', formatter: (v) => (v as number)?.toString() ?? '' },
  { header: 'Column', accessor: 'column', formatter: (v) => (v as number)?.toString() ?? '' },
];

/**
 * Pre-configured columns for coverage data export
 */
export const COVERAGE_DATA_COLUMNS: CsvColumn<{
  path: string;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  uncoveredLines?: number[];
}>[] = [
  { header: 'File Path', accessor: 'path' },
  {
    header: 'Statements (%)',
    accessor: 'statements',
    formatter: (v) => `${(v as number).toFixed(1)}%`,
  },
  {
    header: 'Branches (%)',
    accessor: 'branches',
    formatter: (v) => `${(v as number).toFixed(1)}%`,
  },
  {
    header: 'Functions (%)',
    accessor: 'functions',
    formatter: (v) => `${(v as number).toFixed(1)}%`,
  },
  {
    header: 'Lines (%)',
    accessor: 'lines',
    formatter: (v) => `${(v as number).toFixed(1)}%`,
  },
  {
    header: 'Uncovered Lines',
    accessor: (row) => row.uncoveredLines?.join(', ') ?? '',
  },
];

/**
 * Pre-configured columns for dependency data export
 */
export const DEPENDENCY_DATA_COLUMNS: CsvColumn<{
  name: string;
  version: string;
  type: string;
  license?: string;
  outdated?: boolean;
  latestVersion?: string;
}>[] = [
  { header: 'Package Name', accessor: 'name' },
  { header: 'Current Version', accessor: 'version' },
  { header: 'Type', accessor: 'type' },
  { header: 'License', accessor: 'license', formatter: (v) => (v as string) ?? 'Unknown' },
  {
    header: 'Outdated',
    accessor: 'outdated',
    formatter: (v) => (v as boolean) ? 'Yes' : 'No',
  },
  { header: 'Latest Version', accessor: 'latestVersion', formatter: (v) => (v as string) ?? '' },
];

/**
 * Pre-configured columns for analytics insights export
 */
export const INSIGHTS_DATA_COLUMNS: CsvColumn<{
  id: string;
  title: string;
  priority: string;
  category: string;
  description: string;
  affectedFiles: string[];
  estimatedHours: number;
}>[] = [
  { header: 'ID', accessor: 'id' },
  { header: 'Title', accessor: 'title' },
  { header: 'Priority', accessor: 'priority' },
  { header: 'Category', accessor: 'category' },
  { header: 'Description', accessor: 'description' },
  {
    header: 'Affected Files',
    accessor: (row) => row.affectedFiles.join('; '),
  },
  {
    header: 'Estimated Hours',
    accessor: 'estimatedHours',
    formatter: (v) => `${v}h`,
  },
];

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Generate HTML table from data
 */
export function generateHtmlTable<T extends Record<string, unknown>>(
  data: T[],
  columns: { header: string; accessor: keyof T | ((row: T) => unknown) }[]
): string {
  const thead = columns.map((col) => `<th>${col.header}</th>`).join('');

  const tbody = data
    .map((row) => {
      const cells = columns
        .map((col) => {
          const value =
            typeof col.accessor === 'function'
              ? col.accessor(row)
              : row[col.accessor];
          return `<td>${value ?? ''}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `
    <table>
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody}</tbody>
    </table>
  `;
}

export default useExport;
