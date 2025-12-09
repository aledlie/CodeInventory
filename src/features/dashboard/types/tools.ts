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
