import type {
  ToolsReport,
  UtilityModule,
  ToolCandidate,
  PreprocessedToolsReport,
  PreprocessedToolCandidate,
  DashboardData,
  PrecomputedChart,
  ModularityScore,
} from '../types/tools';

// ============================================================================
// Raw JSON Types (from Python generator)
// ============================================================================

interface RawToolsReport {
  summary: {
    total_tools: number;
    by_category: Record<string, number>;
    last_updated: string;
  };
  tools: unknown[];
  utilities: unknown[];
}

interface FullToolsReport {
  utility_modules: UtilityModule[];
  tool_candidates: ToolCandidate[];
}

// ============================================================================
// Validation and Transform Functions
// ============================================================================

function isRawToolsReport(data: unknown): data is RawToolsReport {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const report = data as Record<string, unknown>;
  return (
    typeof report.summary === 'object' &&
    report.summary !== null &&
    'total_tools' in (report.summary as Record<string, unknown>) &&
    Array.isArray(report.tools) &&
    Array.isArray(report.utilities)
  );
}

function isFullToolsReport(data: unknown): data is FullToolsReport {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const report = data as Record<string, unknown>;
  return (
    Array.isArray(report.utility_modules) &&
    Array.isArray(report.tool_candidates)
  );
}

/**
 * Transform raw (simplified) report to expected ToolsReport format
 */
function transformRawToolsReport(_raw: RawToolsReport): ToolsReport {
  // The raw format has empty arrays, return empty report
  return {
    utility_modules: [],
    tool_candidates: [],
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch tools report data from JSON file
 */
export async function fetchToolsReport(): Promise<ToolsReport> {
  const response = await fetch('/data/tools/tools_report.json');
  if (!response.ok) {
    if (response.status === 404) {
      // Return empty report if file doesn't exist
      return { utility_modules: [], tool_candidates: [] };
    }
    throw new Error('Failed to fetch tools report');
  }

  const data = await response.json();

  // Check for full format first
  if (isFullToolsReport(data)) {
    return data;
  }

  // Check for simplified/raw format
  if (isRawToolsReport(data)) {
    return transformRawToolsReport(data);
  }

  // Unknown format, return empty report
  console.warn('Unknown tools report format, returning empty report');
  return { utility_modules: [], tool_candidates: [] };
}

/**
 * Get a specific utility module by file path
 */
export async function fetchUtilityModule(filePath: string): Promise<UtilityModule | null> {
  const report = await fetchToolsReport();
  return report.utility_modules.find(m => m.file_path === filePath) || null;
}

/**
 * Get a specific tool candidate by name
 */
export async function fetchToolCandidate(name: string): Promise<ToolCandidate | null> {
  const report = await fetchToolsReport();
  return report.tool_candidates.find(c => c.name === name) || null;
}

/**
 * Get tool candidates for a specific module
 */
export async function fetchModuleToolCandidates(modulePath: string): Promise<ToolCandidate[]> {
  const report = await fetchToolsReport();
  return report.tool_candidates.filter(c => c.file_path === modulePath);
}

/**
 * Calculate aggregate statistics for the overview page
 */
export async function fetchToolsStatistics(): Promise<{
  totalModules: number;
  avgExtractionPotential: number;
  modularityDistribution: Record<string, number>;
  highPotentialCount: number;
  highPotentialCandidates: number;
  totalCandidates: number;
}> {
  const report = await fetchToolsReport();

  const totalModules = report.utility_modules.length;

  // Handle empty modules case
  if (totalModules === 0) {
    return {
      totalModules: 0,
      avgExtractionPotential: 0,
      modularityDistribution: {},
      highPotentialCount: 0,
      highPotentialCandidates: 0,
      totalCandidates: 0,
    };
  }

  const avgExtractionPotential = report.utility_modules.reduce((sum, m) =>
    sum + m.extraction_potential, 0
  ) / totalModules;

  const modularityDistribution = report.utility_modules.reduce((acc, m) => {
    acc[m.modularity_score] = (acc[m.modularity_score] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const highPotentialCount = report.utility_modules.filter(m =>
    m.extraction_potential >= 0.8
  ).length;

  const highPotentialCandidates = report.tool_candidates.filter(c =>
    c.extraction_potential >= 0.8
  ).length;

  return {
    totalModules,
    avgExtractionPotential,
    modularityDistribution,
    highPotentialCount,
    highPotentialCandidates,
    totalCandidates: report.tool_candidates.length
  };
}

// ============================================================================
// Preprocessed Data API Functions
// ============================================================================

// Cache for preprocessed report to avoid re-fetching
let cachedPreprocessedReport: PreprocessedToolsReport | null = null;

/**
 * Fetch the full preprocessed tools report (with _dashboard data)
 */
export async function fetchPreprocessedToolsReport(): Promise<PreprocessedToolsReport> {
  if (cachedPreprocessedReport) {
    return cachedPreprocessedReport;
  }

  const response = await fetch('/data/tools/tools_report.json');
  if (!response.ok) {
    if (response.status === 404) {
      return {
        summary: {
          root_directory: '',
          files_analyzed: 0,
          total_functions: 0,
          total_classes: 0,
          tool_candidates_count: 0,
          modularity_distribution: {},
        },
        utility_modules: [],
        tool_candidates: [],
      };
    }
    throw new Error('Failed to fetch preprocessed tools report');
  }

  const data = await response.json();
  cachedPreprocessedReport = data as PreprocessedToolsReport;
  return cachedPreprocessedReport;
}

/**
 * Clear the cached report (useful for refresh)
 */
export function clearToolsReportCache(): void {
  cachedPreprocessedReport = null;
}

/**
 * Get dashboard data (indexes, charts, pagination) from preprocessed report
 */
export async function fetchDashboardData(): Promise<DashboardData | null> {
  const report = await fetchPreprocessedToolsReport();
  return report._dashboard ?? null;
}

/**
 * Get pre-computed chart data by chart name
 */
export async function fetchChartData(
  chartName: keyof DashboardData['charts']
): Promise<PrecomputedChart | null> {
  const dashboard = await fetchDashboardData();
  if (!dashboard?.charts) return null;
  return dashboard.charts[chartName] ?? null;
}

/**
 * Search tool candidates using the pre-built search index
 */
export async function searchToolCandidates(
  query: string
): Promise<PreprocessedToolCandidate[]> {
  const report = await fetchPreprocessedToolsReport();
  const dashboard = report._dashboard;

  if (!dashboard?.search_index || !query.trim()) {
    return report.tool_candidates;
  }

  const searchTerms = query.toLowerCase().split(/\s+/);
  const matchingIndices = new Set<number>();

  // Find candidates matching any search term
  for (const term of searchTerms) {
    // Check for exact term match
    if (dashboard.search_index[term]) {
      dashboard.search_index[term].forEach(idx => matchingIndices.add(idx));
    }

    // Check for prefix matches
    for (const [indexTerm, indices] of Object.entries(dashboard.search_index)) {
      if (indexTerm.startsWith(term) || indexTerm.includes(term)) {
        indices.forEach(idx => matchingIndices.add(idx));
      }
    }
  }

  // Return matching candidates
  return Array.from(matchingIndices)
    .sort((a, b) => a - b)
    .map(idx => report.tool_candidates[idx])
    .filter(Boolean);
}

/**
 * Filter tool candidates by modularity score using pre-built index
 */
export async function filterByModularity(
  modularity: ModularityScore | ModularityScore[]
): Promise<PreprocessedToolCandidate[]> {
  const report = await fetchPreprocessedToolsReport();
  const dashboard = report._dashboard;

  if (!dashboard?.indexes?.by_modularity) {
    // Fallback to manual filtering
    const scores = Array.isArray(modularity) ? modularity : [modularity];
    return report.tool_candidates.filter(c =>
      scores.includes(c.modularity_score)
    );
  }

  const scores = Array.isArray(modularity) ? modularity : [modularity];
  const matchingIndices = new Set<number>();

  for (const score of scores) {
    const indices = dashboard.indexes.by_modularity[score] ?? [];
    indices.forEach(idx => matchingIndices.add(idx));
  }

  return Array.from(matchingIndices)
    .sort((a, b) => a - b)
    .map(idx => report.tool_candidates[idx])
    .filter(Boolean);
}

/**
 * Filter tool candidates by type using pre-built index
 */
export async function filterByType(
  type: 'function' | 'class' | 'module'
): Promise<PreprocessedToolCandidate[]> {
  const report = await fetchPreprocessedToolsReport();
  const dashboard = report._dashboard;

  if (!dashboard?.indexes?.by_type) {
    return report.tool_candidates.filter(c => c.type === type);
  }

  const indices = dashboard.indexes.by_type[type] ?? [];
  return indices.map(idx => report.tool_candidates[idx]).filter(Boolean);
}

/**
 * Filter tool candidates by detected pattern using pre-built index
 */
export async function filterByPattern(
  pattern: string
): Promise<PreprocessedToolCandidate[]> {
  const report = await fetchPreprocessedToolsReport();
  const dashboard = report._dashboard;

  if (!dashboard?.indexes?.by_pattern) {
    // Fallback - check _patterns array
    return report.tool_candidates.filter(c =>
      c._patterns?.some(p => p.pattern === pattern)
    );
  }

  const indices = dashboard.indexes.by_pattern[pattern] ?? [];
  return indices.map(idx => report.tool_candidates[idx]).filter(Boolean);
}

/**
 * Get paginated tool candidates using pre-computed pagination
 */
export async function fetchPaginatedCandidates(
  page: number,
  pageSize?: number
): Promise<{
  candidates: PreprocessedToolCandidate[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}> {
  const report = await fetchPreprocessedToolsReport();
  const dashboard = report._dashboard;

  const effectivePageSize = pageSize ?? dashboard?.pagination?.page_size ?? 20;
  const totalItems = report.tool_candidates.length;
  const totalPages = Math.ceil(totalItems / effectivePageSize);
  const currentPage = Math.max(0, Math.min(page, totalPages - 1));

  const startIdx = currentPage * effectivePageSize;
  const endIdx = Math.min(startIdx + effectivePageSize, totalItems);

  return {
    candidates: report.tool_candidates.slice(startIdx, endIdx),
    totalItems,
    totalPages,
    currentPage,
  };
}

/**
 * Get all available patterns from the pattern index
 */
export async function fetchAvailablePatterns(): Promise<string[]> {
  const dashboard = await fetchDashboardData();
  if (!dashboard?.indexes?.by_pattern) return [];
  return Object.keys(dashboard.indexes.by_pattern);
}

/**
 * Get statistics using pre-computed chart data when available
 */
export async function fetchPreprocessedStatistics(): Promise<{
  totalModules: number;
  totalCandidates: number;
  modularityDistribution: Record<string, number>;
  patternDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
}> {
  const report = await fetchPreprocessedToolsReport();
  const dashboard = report._dashboard;

  // Use pre-computed chart data for distributions
  const modularityDistribution: Record<string, number> = {};
  const patternDistribution: Record<string, number> = {};
  const typeDistribution: Record<string, number> = {};

  if (dashboard?.charts?.modularity_distribution) {
    for (const item of dashboard.charts.modularity_distribution.data) {
      modularityDistribution[item.key] = item.value;
    }
  } else {
    // Fallback to manual calculation
    for (const c of report.tool_candidates) {
      const score = c.modularity_score;
      modularityDistribution[score] = (modularityDistribution[score] ?? 0) + 1;
    }
  }

  if (dashboard?.charts?.pattern_distribution) {
    for (const item of dashboard.charts.pattern_distribution.data) {
      patternDistribution[item.key] = item.value;
    }
  }

  if (dashboard?.charts?.type_distribution) {
    for (const item of dashboard.charts.type_distribution.data) {
      typeDistribution[item.key] = item.value;
    }
  } else {
    for (const c of report.tool_candidates) {
      typeDistribution[c.type] = (typeDistribution[c.type] ?? 0) + 1;
    }
  }

  return {
    totalModules: report.utility_modules.length,
    totalCandidates: report.tool_candidates.length,
    modularityDistribution,
    patternDistribution,
    typeDistribution,
  };
}
