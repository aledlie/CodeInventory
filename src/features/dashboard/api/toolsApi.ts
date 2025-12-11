import type { ToolsReport, UtilityModule, ToolCandidate } from '../types/tools';

/**
 * Fetch tools report data from JSON file
 */
export async function fetchToolsReport(): Promise<ToolsReport> {
  const response = await fetch('/data/tools/tools_report.json');
  if (!response.ok) {
    throw new Error('Failed to fetch tools report');
  }
  return response.json();
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
