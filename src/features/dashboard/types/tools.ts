/**
 * Type definitions for Tools & Utility Modules feature
 */

export type ModularityScore = 'highly_modular' | 'modular' | 'semi_modular' | 'coupled';

export type ExtractionComplexity = 'trivial' | 'moderate' | 'complex' | 'high';

export interface UtilityModule {
  file_path: string;
  function_count: number;
  class_count: number;
  external_dependencies: string[];
  internal_dependencies: string[];
  modularity_score: ModularityScore;
  extraction_potential: number;
}

export interface ToolCandidate {
  name: string;
  type: 'class' | 'function';
  file_path: string;
  line_number: number;
  description: string;
  dependencies: string[];
  modularity_score: ModularityScore;
  extraction_potential: number;
  extraction_complexity: ExtractionComplexity;
  suggested_package_name: string;
  rationale: string;
}

export interface ToolsReport {
  utility_modules: UtilityModule[];
  tool_candidates: ToolCandidate[];
}

export interface ToolsStatistics {
  totalModules: number;
  avgExtractionPotential: number;
  modularityDistribution: Record<ModularityScore, number>;
  highPotentialCount: number;
  highPotentialCandidates: number;
  totalCandidates: number;
}

/**
 * Dependency categorization
 */
export interface DependencyAnalysis {
  external: {
    stdlib: string[];
    thirdParty: string[];
  };
  internal: {
    replaceable: string[];
    needsAbstraction: string[];
  };
  impactLevel: 'low' | 'medium' | 'high';
}

/**
 * Extraction guide step
 */
export interface ExtractionStep {
  step: number;
  title: string;
  description: string;
  code?: string;
  actions: Array<{
    label: string;
    type: 'copy' | 'download' | 'generate';
  }>;
  completed: boolean;
}

/**
 * Package configuration template
 */
export interface PackageConfig {
  name: string;
  version: string;
  license: string;
  pythonVersion: string;
  dependencies: string[];
  entryPoints: Array<{
    name: string;
    description: string;
  }>;
}

/**
 * Impact analysis for extraction
 */
export interface ImpactAnalysis {
  affectedFiles: Array<{
    path: string;
    changeType: 'source' | 'import' | 'test';
    description: string;
  }>;
  estimatedEffort: string;
  riskLevel: 'low' | 'medium' | 'high';
  breakingChanges: boolean;
}

// ============================================================================
// Preprocessing Pipeline Types
// ============================================================================

/**
 * Chart data item from preprocessing
 */
export interface ChartDataItem {
  label: string;
  value: number;
  color: string;
  key: string;
}

/**
 * Pre-computed chart data
 */
export interface PrecomputedChart {
  name: string;
  type: 'pie' | 'bar' | 'donut' | 'line';
  data: ChartDataItem[];
  labels: string[];
  colors: string[];
}

/**
 * Index entry mapping keys to candidate indices
 */
export type IndexEntries = Record<string, number[]>;

/**
 * Search index mapping terms to candidate indices
 */
export type SearchIndex = Record<string, number[]>;

/**
 * Pagination metadata from preprocessing
 */
export interface PaginationMeta {
  total_items: number;
  page_size: number;
  total_pages: number;
  page_ranges: Array<{
    page: number;
    start: number;
    end: number;
  }>;
}

/**
 * Dashboard optimization data from preprocessing pipeline
 */
export interface DashboardData {
  indexes: {
    by_modularity: IndexEntries;
    by_type: IndexEntries;
    by_pattern: IndexEntries;
    by_file: IndexEntries;
    by_abstraction: IndexEntries;
  };
  search_index: SearchIndex;
  charts: {
    modularity_distribution?: PrecomputedChart;
    pattern_distribution?: PrecomputedChart;
    type_distribution?: PrecomputedChart;
    utility_score_distribution?: PrecomputedChart;
    abstraction_level_distribution?: PrecomputedChart;
    dependency_type_distribution?: PrecomputedChart;
  };
  pagination: PaginationMeta;
}

/**
 * Extended tool candidate with preprocessing metadata
 */
export interface PreprocessedToolCandidate extends ToolCandidate {
  _naming_convention?: string;
  _patterns?: Array<{
    pattern: string;
    confidence: number;
  }>;
  _complexity?: {
    modularity_score: number;
    utility_score: number;
    abstraction_level: 'low' | 'medium' | 'high';
    coupling_score: number;
  };
  _dependency_graph?: {
    nodes: string[];
    edges: Array<{ from: string; to: string }>;
    counts: {
      internal: number;
      external: number;
      stdlib: number;
    };
  };
  _dedup_info?: {
    group_id?: string;
    is_representative?: boolean;
    similar_count?: number;
  };
}

/**
 * Full preprocessed tools report with dashboard data
 */
export interface PreprocessedToolsReport {
  summary: {
    root_directory: string;
    files_analyzed: number;
    total_functions: number;
    total_classes: number;
    tool_candidates_count: number;
    modularity_distribution: Record<string, number>;
  };
  utility_modules: UtilityModule[];
  tool_candidates: PreprocessedToolCandidate[];
  _dashboard?: DashboardData;
}
