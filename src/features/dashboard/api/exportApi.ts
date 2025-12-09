/**
 * Export API Service Layer
 *
 * Phase 5C: Advanced Features
 * Handles data export to various formats (CSV, PDF, JSON).
 *
 * Features:
 * - CSV export for tabular data
 * - PDF export for reports and dashboards
 * - JSON export for data backup
 * - Configurable export options
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Column definition for CSV export
 */
export interface CsvColumn<T> {
  /** Header text for the column */
  header: string;
  /** Key or accessor function to get the value */
  accessor: keyof T | ((row: T) => string | number | boolean | null | undefined);
  /** Optional formatter function */
  formatter?: (value: unknown) => string;
}

/**
 * CSV Export Options
 */
export interface CsvExportOptions {
  /** Filename without extension */
  filename: string;
  /** Include BOM for Excel compatibility */
  includeBom?: boolean;
  /** Field separator (default: comma) */
  separator?: string;
  /** Quote character (default: double quote) */
  quoteChar?: string;
  /** Whether to include header row */
  includeHeader?: boolean;
}

/**
 * PDF Export Options
 */
export interface PdfExportOptions {
  /** Filename without extension */
  filename: string;
  /** Document title */
  title?: string;
  /** Document subtitle */
  subtitle?: string;
  /** Page orientation */
  orientation?: 'portrait' | 'landscape';
  /** Paper size */
  pageSize?: 'a4' | 'letter' | 'legal';
  /** Include timestamp */
  includeTimestamp?: boolean;
  /** Include page numbers */
  includePageNumbers?: boolean;
  /** Custom header content */
  headerContent?: string;
  /** Custom footer content */
  footerContent?: string;
}

/**
 * JSON Export Options
 */
export interface JsonExportOptions {
  /** Filename without extension */
  filename: string;
  /** Pretty print with indentation */
  prettyPrint?: boolean;
  /** Indentation spaces (if prettyPrint) */
  indent?: number;
}

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  filename: string;
  format: 'csv' | 'pdf' | 'json';
  size: number;
  error?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Escape a value for CSV
 */
function escapeCsvValue(value: unknown, quoteChar: string, separator: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Check if quoting is needed
  const needsQuoting =
    stringValue.includes(separator) ||
    stringValue.includes(quoteChar) ||
    stringValue.includes('\n') ||
    stringValue.includes('\r');

  if (needsQuoting) {
    // Escape quotes by doubling them
    const escaped = stringValue.replace(new RegExp(quoteChar, 'g'), quoteChar + quoteChar);
    return `${quoteChar}${escaped}${quoteChar}`;
  }

  return stringValue;
}

/**
 * Get value from row using accessor
 */
function getValueFromRow<T>(
  row: T,
  accessor: keyof T | ((row: T) => string | number | boolean | null | undefined)
): unknown {
  if (typeof accessor === 'function') {
    return accessor(row);
  }
  return row[accessor];
}

/**
 * Format date for export
 */
function formatExportDate(date: Date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

/**
 * Trigger file download
 */
function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Export data to CSV format
 *
 * @param data - Array of objects to export
 * @param columns - Column definitions
 * @param options - Export options
 *
 * @example
 * ```ts
 * const columns: CsvColumn<Issue>[] = [
 *   { header: 'ID', accessor: 'id' },
 *   { header: 'Severity', accessor: 'severity' },
 *   { header: 'File', accessor: (row) => row.filePath.split('/').pop() },
 * ];
 *
 * exportToCsv(issues, columns, { filename: 'issues' });
 * ```
 */
export function exportToCsv<T>(
  data: T[],
  columns: CsvColumn<T>[],
  options: CsvExportOptions
): ExportResult {
  const {
    filename,
    includeBom = true,
    separator = ',',
    quoteChar = '"',
    includeHeader = true,
  } = options;

  try {
    const rows: string[] = [];

    // Header row
    if (includeHeader) {
      const headerRow = columns
        .map((col) => escapeCsvValue(col.header, quoteChar, separator))
        .join(separator);
      rows.push(headerRow);
    }

    // Data rows
    for (const row of data) {
      const values = columns.map((col) => {
        const rawValue = getValueFromRow(row, col.accessor);
        const formattedValue = col.formatter ? col.formatter(rawValue) : rawValue;
        return escapeCsvValue(formattedValue, quoteChar, separator);
      });
      rows.push(values.join(separator));
    }

    // Build content
    let content = rows.join('\n');

    // Add BOM for Excel compatibility
    if (includeBom) {
      content = '\ufeff' + content;
    }

    // Generate filename with date
    const fullFilename = `${filename}_${formatExportDate()}.csv`;

    // Trigger download
    downloadFile(content, fullFilename, 'text/csv;charset=utf-8');

    return {
      success: true,
      filename: fullFilename,
      format: 'csv',
      size: new Blob([content]).size,
    };
  } catch (error) {
    return {
      success: false,
      filename: '',
      format: 'csv',
      size: 0,
      error: error instanceof Error ? error.message : 'Unknown error during CSV export',
    };
  }
}

// ============================================================================
// JSON Export
// ============================================================================

/**
 * Export data to JSON format
 *
 * @param data - Data to export
 * @param options - Export options
 *
 * @example
 * ```ts
 * exportToJson(dashboardData, { filename: 'dashboard-backup', prettyPrint: true });
 * ```
 */
export function exportToJson<T>(data: T, options: JsonExportOptions): ExportResult {
  const { filename, prettyPrint = true, indent = 2 } = options;

  try {
    const content = prettyPrint
      ? JSON.stringify(data, null, indent)
      : JSON.stringify(data);

    const fullFilename = `${filename}_${formatExportDate()}.json`;

    downloadFile(content, fullFilename, 'application/json;charset=utf-8');

    return {
      success: true,
      filename: fullFilename,
      format: 'json',
      size: new Blob([content]).size,
    };
  } catch (error) {
    return {
      success: false,
      filename: '',
      format: 'json',
      size: 0,
      error: error instanceof Error ? error.message : 'Unknown error during JSON export',
    };
  }
}

// ============================================================================
// PDF Export (using browser print)
// ============================================================================

/**
 * Generate printable HTML content for PDF export
 *
 * This creates a new window with formatted content that can be printed to PDF.
 * For more advanced PDF generation, consider using a library like jsPDF.
 *
 * @param content - HTML content to print
 * @param options - Export options
 *
 * @example
 * ```ts
 * const htmlContent = `
 *   <h1>Quality Report</h1>
 *   <table>...</table>
 * `;
 * exportToPdf(htmlContent, { filename: 'quality-report', title: 'Quality Report' });
 * ```
 */
export function exportToPdf(
  content: string,
  options: PdfExportOptions
): ExportResult {
  const {
    filename,
    title = 'Export',
    subtitle,
    orientation = 'portrait',
    pageSize = 'a4',
    includeTimestamp = true,
    includePageNumbers = true,
    headerContent,
    footerContent,
  } = options;

  try {
    // Page size dimensions for CSS
    const pageSizes = {
      a4: { width: '210mm', height: '297mm' },
      letter: { width: '8.5in', height: '11in' },
      legal: { width: '8.5in', height: '14in' },
    };

    // Note: pageSizes available for custom CSS injection if needed in future
    void pageSizes[pageSize];

    // Generate timestamp
    const timestamp = includeTimestamp
      ? new Date().toLocaleString()
      : '';

    // Build HTML document
    const htmlDocument = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page {
      size: ${pageSize} ${orientation};
      margin: 20mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
    }

    .header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #0066cc;
    }

    .header h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 700;
      color: #0066cc;
    }

    .header .subtitle {
      margin: 0;
      font-size: 14px;
      color: #666666;
    }

    .header .timestamp {
      margin-top: 8px;
      font-size: 11px;
      color: #999999;
    }

    .custom-header {
      margin-bottom: 16px;
    }

    .content {
      min-height: calc(100vh - 200px);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 11px;
    }

    th, td {
      padding: 8px 12px;
      text-align: left;
      border: 1px solid #e0e0e0;
    }

    th {
      background-color: #f5f5f5;
      font-weight: 600;
      color: #1a1a1a;
    }

    tr:nth-child(even) {
      background-color: #fafafa;
    }

    .metric-card {
      display: inline-block;
      padding: 16px;
      margin: 8px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      min-width: 150px;
    }

    .metric-card .value {
      font-size: 24px;
      font-weight: 700;
      color: #0066cc;
    }

    .metric-card .label {
      font-size: 12px;
      color: #666666;
    }

    .severity-critical { color: #dc3545; }
    .severity-high { color: #e53935; }
    .severity-medium { color: #ff9800; }
    .severity-low { color: #ffc107; }
    .severity-info { color: #17a2b8; }

    .footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
      font-size: 10px;
      color: #999999;
      text-align: center;
    }

    ${includePageNumbers ? `
    @media print {
      .page-number:after {
        content: counter(page);
      }
    }
    ` : ''}

    @media print {
      body {
        padding: 0;
      }

      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
    ${timestamp ? `<p class="timestamp">Generated: ${timestamp}</p>` : ''}
  </div>

  ${headerContent ? `<div class="custom-header">${headerContent}</div>` : ''}

  <div class="content">
    ${content}
  </div>

  ${footerContent ? `<div class="footer">${footerContent}</div>` : ''}

  <div class="no-print" style="margin-top: 20px; text-align: center;">
    <p>Press Ctrl+P (or Cmd+P on Mac) to print or save as PDF</p>
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
      Print / Save as PDF
    </button>
    <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; margin-left: 10px;">
      Close
    </button>
  </div>
</body>
</html>
    `.trim();

    // Open print window
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      throw new Error('Failed to open print window. Please allow popups for this site.');
    }

    printWindow.document.write(htmlDocument);
    printWindow.document.close();

    // Focus the window for printing
    printWindow.focus();

    return {
      success: true,
      filename: `${filename}.pdf`,
      format: 'pdf',
      size: new Blob([htmlDocument]).size,
    };
  } catch (error) {
    return {
      success: false,
      filename: '',
      format: 'pdf',
      size: 0,
      error: error instanceof Error ? error.message : 'Unknown error during PDF export',
    };
  }
}

// ============================================================================
// Export API Object
// ============================================================================

export const exportApi = {
  toCsv: exportToCsv,
  toJson: exportToJson,
  toPdf: exportToPdf,
};

export default exportApi;
