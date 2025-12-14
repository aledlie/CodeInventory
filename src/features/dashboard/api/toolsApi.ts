import type { ToolsReport, UtilityModule, ToolCandidate } from '../types/tools';

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
