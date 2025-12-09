/**
 * Visualization API Service Layer
 *
 * Handles saving, loading, and exporting custom visualizations.
 * Uses localStorage for persistence in this implementation.
 */

import type {
  VisualizationConfig,
  SavedVisualization,
  ExportOptions,
  ChartType,
  VisualizationMetric,
} from '../types/visualizations';

// Storage key for localStorage
const STORAGE_KEY = 'code-inventory-visualizations';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `viz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all saved visualizations from storage
 */
function getStoredVisualizations(): Map<string, VisualizationConfig> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Map();
    const parsed = JSON.parse(stored) as Record<string, VisualizationConfig>;
    return new Map(Object.entries(parsed));
  } catch {
    console.warn('[visualizationApi] Failed to load from localStorage');
    return new Map();
  }
}

/**
 * Save all visualizations to storage
 */
function saveToStorage(visualizations: Map<string, VisualizationConfig>): void {
  try {
    const obj = Object.fromEntries(visualizations);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error('[visualizationApi] Failed to save to localStorage:', error);
  }
}

/**
 * Create a default visualization config
 */
function createDefaultConfig(): VisualizationConfig {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: 'New Visualization',
    chartType: 'line',
    metrics: [
      {
        metric: 'qualityScore',
        label: 'Quality Score',
        color: '#0066cc',
        visible: true,
        yAxis: 'left',
      },
    ],
    timeRange: '30d',
    aggregation: 'daily',
    showLegend: true,
    showGrid: true,
    showDataLabels: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Visualization API service
 */
export const visualizationApi = {
  /**
   * Get all saved visualizations (summary list)
   */
  async getVisualizations(): Promise<SavedVisualization[]> {
    const stored = getStoredVisualizations();
    return Array.from(stored.values()).map((v) => ({
      id: v.id,
      title: v.title,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      isFavorite: false, // Not implemented yet
    }));
  },

  /**
   * Get a single visualization by ID
   */
  async getVisualization(id: string): Promise<VisualizationConfig | null> {
    const stored = getStoredVisualizations();
    return stored.get(id) ?? null;
  },

  /**
   * Create a new visualization with default config
   */
  async createVisualization(): Promise<VisualizationConfig> {
    const config = createDefaultConfig();
    const stored = getStoredVisualizations();
    stored.set(config.id, config);
    saveToStorage(stored);
    return config;
  },

  /**
   * Save a visualization
   */
  async saveVisualization(config: VisualizationConfig): Promise<VisualizationConfig> {
    const stored = getStoredVisualizations();
    const updated = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    stored.set(updated.id, updated);
    saveToStorage(stored);
    return updated;
  },

  /**
   * Delete a visualization
   */
  async deleteVisualization(id: string): Promise<void> {
    const stored = getStoredVisualizations();
    stored.delete(id);
    saveToStorage(stored);
  },

  /**
   * Duplicate a visualization
   */
  async duplicateVisualization(id: string): Promise<VisualizationConfig | null> {
    const original = await this.getVisualization(id);
    if (!original) return null;

    const now = new Date().toISOString();
    const duplicate: VisualizationConfig = {
      ...original,
      id: generateId(),
      title: `${original.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };

    const stored = getStoredVisualizations();
    stored.set(duplicate.id, duplicate);
    saveToStorage(stored);
    return duplicate;
  },

  /**
   * Export a visualization to specified format
   * Note: Actual export would require canvas rendering - this is a placeholder
   */
  async exportVisualization(
    id: string,
    options: ExportOptions
  ): Promise<Blob | null> {
    const config = await this.getVisualization(id);
    if (!config) return null;

    if (options.format === 'json') {
      const json = JSON.stringify(config, null, 2);
      return new Blob([json], { type: 'application/json' });
    }

    // For image/PDF formats, would need to use html2canvas or similar
    // Placeholder implementation
    console.log('[visualizationApi] Export requested:', { id, options });
    return null;
  },

  /**
   * Get available metrics metadata
   */
  getAvailableMetrics(): Array<{
    id: VisualizationMetric;
    label: string;
    color: string;
    category: string;
  }> {
    return [
      { id: 'qualityScore', label: 'Quality Score', color: '#0066cc', category: 'quality' },
      { id: 'coveragePercentage', label: 'Test Coverage', color: '#28a745', category: 'coverage' },
      { id: 'issueCount', label: 'Total Issues', color: '#dc3545', category: 'quality' },
      { id: 'criticalIssues', label: 'Critical Issues', color: '#ff5722', category: 'quality' },
      { id: 'circularDeps', label: 'Circular Dependencies', color: '#ff9800', category: 'dependencies' },
      { id: 'untestedFunctions', label: 'Untested Functions', color: '#9c27b0', category: 'coverage' },
      { id: 'totalFiles', label: 'Total Files', color: '#607d8b', category: 'performance' },
      { id: 'totalDependencies', label: 'Total Dependencies', color: '#795548', category: 'dependencies' },
    ];
  },

  /**
   * Get available chart types
   */
  getAvailableChartTypes(): Array<{
    id: ChartType;
    label: string;
    description: string;
  }> {
    return [
      { id: 'line', label: 'Line Chart', description: 'Best for trends over time' },
      { id: 'bar', label: 'Bar Chart', description: 'Best for comparing values' },
      { id: 'area', label: 'Area Chart', description: 'Best for showing volume' },
      { id: 'pie', label: 'Pie Chart', description: 'Best for proportions' },
      { id: 'scatter', label: 'Scatter Plot', description: 'Best for correlations' },
      { id: 'radar', label: 'Radar Chart', description: 'Best for multi-dimensional comparison' },
    ];
  },
};

export default visualizationApi;
