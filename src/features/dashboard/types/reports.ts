/**
 * Report Generation Types for Phase 3 Visualizations
 *
 * Defines TypeScript interfaces for custom report generation,
 * export formats, templates, and customization options.
 */

import type { AnalysisRun } from './charts';
import type { AIComparisonSummary } from './comparison';
import type {
  PythonQualityReport,
  PythonCoverageReport,
  PythonDependencyReport,
} from '../types';

// ============================================================================
// Report Types & Formats
// ============================================================================

/**
 * Report template type
 */
export type ReportType =
  | 'executive'    // High-level summary for stakeholders
  | 'technical'    // Detailed technical analysis
  | 'compliance'   // Compliance and audit-focused
  | 'custom';      // User-defined custom report

/**
 * Export format
 */
export type ExportFormat =
  | 'pdf'          // Portable Document Format
  | 'html'         // Self-contained HTML
  | 'markdown'     // GitHub-friendly Markdown
  | 'json'         // Machine-readable JSON
  | 'csv';         // Spreadsheet-compatible CSV

/**
 * Report section identifier
 */
export type ReportSection =
  | 'executive-summary'
  | 'quality-trends'
  | 'quality-issues'
  | 'quality-issues-detailed'
  | 'coverage-summary'
  | 'coverage-trends'
  | 'coverage-by-file'
  | 'untested-functions'
  | 'dependency-summary'
  | 'dependency-graph'
  | 'circular-dependencies'
  | 'external-dependencies'
  | 'comparison'
  | 'recommendations'
  | 'appendix';

// ============================================================================
// Report Configuration
// ============================================================================

/**
 * Report section configuration
 */
export interface ReportSectionConfig {
  /** Section identifier */
  id: ReportSection;
  /** Display title */
  title: string;
  /** Whether to include this section */
  enabled: boolean;
  /** Section order */
  order: number;
  /** Section-specific options */
  options?: Record<string, unknown>;
}

/**
 * Executive summary section options
 */
export interface ExecutiveSummaryOptions {
  /** Include high-level metrics */
  includeMetrics?: boolean;
  /** Include key highlights */
  includeHighlights?: boolean;
  /** Include overall assessment */
  includeAssessment?: boolean;
  /** Include trend visualization */
  includeTrendChart?: boolean;
}

/**
 * Quality issues section options
 */
export interface QualityIssuesOptions {
  /** Filter by severity */
  severities?: ('critical' | 'high' | 'medium' | 'low')[];
  /** Maximum issues to show */
  maxIssues?: number;
  /** Group by category */
  groupByCategory?: boolean;
  /** Include code snippets */
  includeCodeSnippets?: boolean;
  /** Include suggestions */
  includeSuggestions?: boolean;
}

/**
 * Coverage section options
 */
export interface CoverageOptions {
  /** Show coverage by file */
  showByFile?: boolean;
  /** Minimum coverage threshold to highlight */
  coverageThreshold?: number;
  /** Maximum files to show */
  maxFiles?: number;
  /** Include untested functions list */
  includeUntestedFunctions?: boolean;
}

/**
 * Dependency section options
 */
export interface DependencyOptions {
  /** Include dependency graph visualization */
  includeGraph?: boolean;
  /** Show external dependencies */
  showExternal?: boolean;
  /** Show circular dependencies */
  showCircular?: boolean;
  /** Maximum dependencies to list */
  maxDependencies?: number;
}

/**
 * Trend section options
 */
export interface TrendOptions {
  /** Time range for trends */
  timeRange?: '7d' | '30d' | '90d' | 'all';
  /** Metrics to include in trends */
  metrics?: string[];
  /** Chart type */
  chartType?: 'line' | 'bar' | 'area';
}

/**
 * Complete report configuration
 */
export interface ReportConfig {
  /** Report type/template */
  type: ReportType;
  /** Report title */
  title: string;
  /** Export format */
  format: ExportFormat;
  /** Sections to include */
  sections: ReportSectionConfig[];
  /** Data sources */
  data: {
    /** Current analysis run */
    currentRun: AnalysisRun;
    /** Baseline run for comparison (optional) */
    baselineRun?: AnalysisRun;
    /** Full quality report */
    qualityReport?: PythonQualityReport;
    /** Full coverage report */
    coverageReport?: PythonCoverageReport;
    /** Full dependency report */
    dependencyReport?: PythonDependencyReport;
    /** AI-generated insights */
    aiSummary?: AIComparisonSummary;
  };
  /** Branding options */
  branding?: {
    /** Company/project logo URL */
    logoUrl?: string;
    /** Company/project name */
    companyName?: string;
    /** Primary brand color */
    primaryColor?: string;
    /** Footer text */
    footerText?: string;
  };
  /** Metadata */
  metadata?: {
    /** Author name */
    author?: string;
    /** Report generated timestamp */
    generatedAt?: string;
    /** Report version/status */
    version?: 'draft' | 'final' | 'review';
    /** Additional tags */
    tags?: string[];
  };
}

// ============================================================================
// Report Templates
// ============================================================================

/**
 * Executive report template configuration
 */
export interface ExecutiveReportTemplate {
  type: 'executive';
  sections: {
    executiveSummary: ExecutiveSummaryOptions;
    qualityOverview: {
      includeChart: boolean;
      showTopIssues: boolean;
      topIssuesCount: number;
    };
    coverageOverview: {
      includeChart: boolean;
      coverageThreshold: number;
    };
    recommendations: {
      includeAI: boolean;
      maxRecommendations: number;
    };
  };
}

/**
 * Technical report template configuration
 */
export interface TechnicalReportTemplate {
  type: 'technical';
  sections: {
    qualityAnalysis: QualityIssuesOptions;
    coverageAnalysis: CoverageOptions;
    dependencyAnalysis: DependencyOptions;
    trends: TrendOptions;
    appendix: {
      includeRawData: boolean;
      includeMethodology: boolean;
    };
  };
}

/**
 * Compliance report template configuration
 */
export interface ComplianceReportTemplate {
  type: 'compliance';
  sections: {
    complianceChecklist: {
      standards: string[]; // e.g., ["OWASP", "CWE"]
      includeEvidence: boolean;
    };
    securityIssues: {
      severities: ('critical' | 'high')[];
      includeRemediation: boolean;
    };
    coverageRequirements: {
      minimumCoverage: number;
      showGaps: boolean;
    };
    auditTrail: {
      includeTimestamps: boolean;
      includeChangelog: boolean;
    };
  };
}

/**
 * Union type for all report templates
 */
export type ReportTemplate =
  | ExecutiveReportTemplate
  | TechnicalReportTemplate
  | ComplianceReportTemplate;

// ============================================================================
// Report Data Models
// ============================================================================

/**
 * Generated report structure
 */
export interface GeneratedReport {
  /** Report configuration used */
  config: ReportConfig;
  /** Generated content by section */
  sections: GeneratedReportSection[];
  /** Report metadata */
  metadata: {
    generatedAt: string;
    generatedBy: string;
    reportId: string;
    version: string;
  };
  /** Summary statistics */
  statistics: {
    totalPages: number;
    totalSections: number;
    totalCharts: number;
    totalTables: number;
  };
}

/**
 * Individual report section content
 */
export interface GeneratedReportSection {
  /** Section identifier */
  id: ReportSection;
  /** Section title */
  title: string;
  /** Section order */
  order: number;
  /** Section content */
  content: ReportSectionContent;
}

/**
 * Report section content types
 */
export type ReportSectionContent =
  | TextContent
  | TableContent
  | ChartContent
  | GraphContent
  | ListContent
  | CompoundContent;

/**
 * Text content
 */
export interface TextContent {
  type: 'text';
  /** Markdown or HTML content */
  content: string;
  /** Text style */
  style?: 'paragraph' | 'heading' | 'subtitle' | 'caption';
}

/**
 * Table content
 */
export interface TableContent {
  type: 'table';
  /** Table headers */
  headers: string[];
  /** Table rows */
  rows: (string | number | null)[][];
  /** Column alignments */
  alignments?: ('left' | 'center' | 'right')[];
  /** Sortable columns */
  sortable?: boolean;
  /** Filterable */
  filterable?: boolean;
}

/**
 * Chart content
 */
export interface ChartContent {
  type: 'chart';
  /** Chart type */
  chartType: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'area';
  /** Chart data (Chart.js format) */
  data: unknown;
  /** Chart options */
  options?: unknown;
  /** Chart description (accessibility) */
  description: string;
}

/**
 * Graph content (dependency graph)
 */
export interface GraphContent {
  type: 'graph';
  /** Graph data */
  graph: {
    nodes: Array<{ id: string; label: string }>;
    edges: Array<{ source: string; target: string }>;
  };
  /** Layout type */
  layout: 'force' | 'hierarchical' | 'circular';
  /** Graph description (accessibility) */
  description: string;
}

/**
 * List content
 */
export interface ListContent {
  type: 'list';
  /** List items */
  items: string[];
  /** List style */
  listStyle: 'bullet' | 'numbered' | 'checklist';
  /** Nested */
  nested?: boolean;
}

/**
 * Compound content (multiple content types)
 */
export interface CompoundContent {
  type: 'compound';
  /** Child content elements */
  children: ReportSectionContent[];
}

// ============================================================================
// Export Options
// ============================================================================

/**
 * PDF export options
 */
export interface PDFExportOptions {
  /** Page size */
  pageSize: 'A4' | 'Letter' | 'Legal';
  /** Page orientation */
  orientation: 'portrait' | 'landscape';
  /** Margins (in points) */
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Include page numbers */
  pageNumbers: boolean;
  /** Include header */
  header?: {
    text: string;
    align: 'left' | 'center' | 'right';
  };
  /** Include footer */
  footer?: {
    text: string;
    align: 'left' | 'center' | 'right';
  };
  /** Font family */
  fontFamily?: string;
  /** Base font size */
  fontSize?: number;
}

/**
 * HTML export options
 */
export interface HTMLExportOptions {
  /** Include CSS inline */
  inlineCSS: boolean;
  /** Include JavaScript inline */
  inlineJS: boolean;
  /** Self-contained (embed all assets) */
  selfContained: boolean;
  /** Enable dark mode */
  darkMode?: boolean;
  /** Include print stylesheet */
  printStylesheet: boolean;
  /** Mobile responsive */
  responsive: boolean;
}

/**
 * Markdown export options
 */
export interface MarkdownExportOptions {
  /** Markdown flavor */
  flavor: 'github' | 'commonmark' | 'gfm';
  /** Include table of contents */
  toc: boolean;
  /** Include frontmatter (YAML) */
  frontmatter: boolean;
  /** Chart rendering */
  chartFormat: 'mermaid' | 'image' | 'link';
  /** Line width for wrapping */
  lineWidth?: number;
}

/**
 * JSON export options
 */
export interface JSONExportOptions {
  /** Pretty print */
  pretty: boolean;
  /** Indentation spaces */
  indent: number;
  /** Include Schema.org metadata */
  includeSchema: boolean;
  /** Compression */
  compressed?: boolean;
}

/**
 * CSV export options
 */
export interface CSVExportOptions {
  /** Delimiter */
  delimiter: ',' | ';' | '\t';
  /** Include headers */
  headers: boolean;
  /** Quote character */
  quote: '"' | "'";
  /** Escape character */
  escape: '\\';
  /** Line ending */
  lineEnding: '\n' | '\r\n';
  /** Encoding */
  encoding: 'utf-8' | 'utf-16' | 'ascii';
}

/**
 * Union type for all export options
 */
export type ExportOptions =
  | PDFExportOptions
  | HTMLExportOptions
  | MarkdownExportOptions
  | JSONExportOptions
  | CSVExportOptions;

// ============================================================================
// Component Props
// ============================================================================

/**
 * Report builder component props
 */
export interface ReportBuilderProps {
  /** Available analysis runs */
  runs: AnalysisRun[];
  /** Current report configuration */
  config: ReportConfig;
  /** Configuration change callback */
  onConfigChange: (config: ReportConfig) => void;
  /** Generate report callback */
  onGenerate: (config: ReportConfig) => Promise<void>;
  /** Available templates */
  templates?: ReportTemplate[];
  /** Loading state */
  loading?: boolean;
}

/**
 * Report preview component props
 */
export interface ReportPreviewProps {
  /** Report configuration */
  config: ReportConfig;
  /** Preview mode */
  mode: 'desktop' | 'mobile' | 'print';
  /** Refresh preview callback */
  onRefresh?: () => void;
}

/**
 * Export button component props
 */
export interface ExportButtonProps {
  /** Report configuration */
  config: ReportConfig;
  /** Available formats */
  formats: ExportFormat[];
  /** Default format */
  defaultFormat?: ExportFormat;
  /** Export options by format */
  exportOptions?: Partial<Record<ExportFormat, ExportOptions>>;
  /** Export callback */
  onExport: (format: ExportFormat, options?: ExportOptions) => Promise<Blob>;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Report templates component props
 */
export interface ReportTemplatesProps {
  /** Available templates */
  templates: ReportTemplate[];
  /** Selected template */
  selectedTemplate?: ReportType;
  /** Template selection callback */
  onSelectTemplate: (template: ReportTemplate) => void;
  /** Custom template creation callback */
  onCreateCustom?: () => void;
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Generate PDF from report configuration
 */
export type PDFGenerator = (
  config: ReportConfig,
  options?: PDFExportOptions
) => Promise<Blob>;

/**
 * Generate HTML from report configuration
 */
export type HTMLGenerator = (
  config: ReportConfig,
  options?: HTMLExportOptions
) => Promise<string>;

/**
 * Generate Markdown from report configuration
 */
export type MarkdownGenerator = (
  config: ReportConfig,
  options?: MarkdownExportOptions
) => Promise<string>;

/**
 * Generate JSON from report configuration
 */
export type JSONGenerator = (
  config: ReportConfig,
  options?: JSONExportOptions
) => Promise<string>;

/**
 * Generate CSV files from report data
 */
export type CSVGenerator = (
  config: ReportConfig,
  options?: CSVExportOptions
) => Promise<Map<string, string>>; // filename -> CSV content

// ============================================================================
// Report Validation
// ============================================================================

/**
 * Report validation error
 */
export interface ReportValidationError {
  /** Error type */
  type: 'missing-data' | 'invalid-config' | 'unsupported-feature';
  /** Section ID where error occurred */
  sectionId?: ReportSection;
  /** Error message */
  message: string;
  /** Severity */
  severity: 'error' | 'warning';
}

/**
 * Report validation result
 */
export interface ReportValidationResult {
  /** Is valid */
  valid: boolean;
  /** Validation errors */
  errors: ReportValidationError[];
  /** Validation warnings */
  warnings: ReportValidationError[];
}

/**
 * Validate report configuration
 */
export type ReportValidator = (
  config: ReportConfig
) => ReportValidationResult;

// ============================================================================
// Template Management
// ============================================================================

/**
 * Saved report template
 */
export interface SavedReportTemplate {
  /** Template ID */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description?: string;
  /** Template type */
  type: ReportType;
  /** Template configuration */
  config: Omit<ReportConfig, 'data'>;
  /** Created timestamp */
  createdAt: string;
  /** Modified timestamp */
  modifiedAt: string;
  /** Author */
  author?: string;
  /** Tags */
  tags?: string[];
}

/**
 * Template library
 */
export interface TemplateLibrary {
  /** Saved templates */
  templates: SavedReportTemplate[];
  /** Load template by ID */
  loadTemplate: (id: string) => Promise<SavedReportTemplate>;
  /** Save template */
  saveTemplate: (template: SavedReportTemplate) => Promise<void>;
  /** Delete template */
  deleteTemplate: (id: string) => Promise<void>;
  /** Search templates */
  searchTemplates: (query: string) => SavedReportTemplate[];
}
