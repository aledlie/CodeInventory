/**
 * Dependency Graph Types for Phase 3 Visualizations
 *
 * Defines TypeScript interfaces for the interactive dependency graph,
 * including nodes, edges, layouts, and interaction patterns.
 */

import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';

// ============================================================================
// Graph Data Structures
// ============================================================================

/**
 * Node type classification
 */
export type NodeType =
  | 'app'        // Application code (src/components, src/features)
  | 'util'       // Utilities and helpers (src/utils, src/lib)
  | 'service'    // Services and APIs (src/api, src/services)
  | 'config'     // Configuration files
  | 'test'       // Test files
  | 'external';  // External dependencies

/**
 * Import type classification
 */
export type ImportType =
  | 'static'      // import X from 'Y'
  | 'dynamic'     // import('Y')
  | 'require'     // require('Y')
  | 'type-only';  // import type { X } from 'Y'

/**
 * Graph node representing a module/file
 */
export interface GraphNode extends SimulationNodeDatum {
  /** Unique identifier (file path) */
  id: string;
  /** Display label (shortened file name) */
  label: string;
  /** Full file path */
  path: string;
  /** Node type classification */
  type: NodeType;
  /** Node size (based on degree centrality) */
  size: number;
  /** Metrics associated with this file */
  metrics: {
    /** Number of imports from other files */
    imports: number;
    /** Number of files that import this file */
    importedBy: number;
    /** Lines of code */
    loc?: number;
    /** Test coverage percentage */
    coverage?: number;
    /** Number of quality issues */
    issues?: number;
    /** Cyclomatic complexity */
    complexity?: number;
  };
  /** Whether this node is part of a circular dependency */
  isCircular: boolean;
  /** Circular dependency chain IDs this node belongs to */
  circularChainIds?: number[];
  /** Directory/module this node belongs to */
  module?: string;
  /** Cluster ID (for grouping) */
  clusterId?: number;
  /** Visual properties */
  visual?: {
    color?: string;
    borderColor?: string;
    borderWidth?: number;
    opacity?: number;
  };
  /** D3 force simulation properties (inherited) */
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

/**
 * Graph edge representing a dependency
 */
export interface GraphEdge extends SimulationLinkDatum<GraphNode> {
  /** Source node ID */
  source: string | GraphNode;
  /** Target node ID */
  target: string | GraphNode;
  /** Import type */
  type: ImportType;
  /** Coupling strength (1-10, based on import frequency/usage) */
  strength: number;
  /** Whether this edge is part of a circular dependency */
  isCircular: boolean;
  /** Circular dependency chain ID this edge belongs to */
  circularChainId?: number;
  /** Number of imports along this edge */
  importCount?: number;
  /** Visual properties */
  visual?: {
    color?: string;
    width?: number;
    dashArray?: string;
    opacity?: number;
    curved?: boolean;
  };
}

/**
 * Circular dependency chain
 */
export interface CircularDependencyChain {
  /** Unique chain ID */
  id: number;
  /** Array of node IDs in cycle order */
  nodes: string[];
  /** Array of edge pairs (source→target) */
  edges: Array<{ source: string; target: string }>;
  /** Chain length (number of nodes) */
  length: number;
  /** Severity (based on length and coupling) */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Suggested resolution strategy */
  suggestion?: string;
}

/**
 * Node cluster for visual grouping
 */
export interface NodeCluster {
  /** Unique cluster ID */
  id: number;
  /** Cluster name/label */
  name: string;
  /** Cluster type (based on grouping strategy) */
  type: 'directory' | 'module' | 'functional' | 'ownership';
  /** Nodes in this cluster */
  nodeIds: string[];
  /** Cluster position (calculated) */
  centroid?: { x: number; y: number };
  /** Cluster radius */
  radius?: number;
  /** Cluster color */
  color?: string;
}

/**
 * Complete dependency graph structure
 */
export interface DependencyGraph {
  /** Graph nodes */
  nodes: GraphNode[];
  /** Graph edges */
  edges: GraphEdge[];
  /** Circular dependency chains */
  circularChains: CircularDependencyChain[];
  /** Node clusters */
  clusters: NodeCluster[];
  /** Graph metadata */
  metadata: {
    /** Total number of nodes */
    totalNodes: number;
    /** Total number of edges */
    totalEdges: number;
    /** Number of circular chains */
    circularChainCount: number;
    /** Average degree (connections per node) */
    avgDegree: number;
    /** Graph density (0-1) */
    density: number;
    /** Maximum depth (longest dependency chain) */
    maxDepth: number;
  };
}

// ============================================================================
// Graph Layout Configuration
// ============================================================================

/**
 * Graph layout algorithm
 */
export type LayoutAlgorithm =
  | 'force-directed'  // Physics-based force simulation
  | 'hierarchical'    // Tree-like top-down layout
  | 'circular'        // Nodes arranged in circle
  | 'grid'            // Regular grid layout
  | 'radial';         // Radial tree layout

/**
 * Force-directed layout configuration
 */
export interface ForceDirectedConfig {
  /** Algorithm type */
  type: 'force-directed';
  /** Center force strength */
  centerStrength: number;
  /** Charge (repulsion) strength */
  chargeStrength: number;
  /** Link distance */
  linkDistance: number;
  /** Link strength */
  linkStrength: number;
  /** Collision radius */
  collisionRadius: number;
  /** Simulation alpha (temperature) */
  alpha: number;
  /** Alpha decay rate */
  alphaDecay: number;
  /** Velocity decay (friction) */
  velocityDecay: number;
}

/**
 * Hierarchical layout configuration
 */
export interface HierarchicalConfig {
  /** Algorithm type */
  type: 'hierarchical';
  /** Layout direction */
  direction: 'top-down' | 'bottom-up' | 'left-right' | 'right-left';
  /** Level separation */
  levelSeparation: number;
  /** Node separation */
  nodeSeparation: number;
  /** Tree separation */
  treeSeparation: number;
}

/**
 * Circular layout configuration
 */
export interface CircularConfig {
  /** Algorithm type */
  type: 'circular';
  /** Radius of circle */
  radius: number;
  /** Start angle (degrees) */
  startAngle: number;
  /** Sort nodes (by degree, alpha, custom) */
  sortBy: 'degree' | 'alpha' | 'none';
}

/**
 * Union type for all layout configurations
 */
export type LayoutConfig =
  | ForceDirectedConfig
  | HierarchicalConfig
  | CircularConfig;

// ============================================================================
// Graph Interaction State
// ============================================================================

/**
 * Graph view state (zoom, pan, selection)
 */
export interface GraphViewState {
  /** Current zoom level (0.1 - 5.0) */
  zoom: number;
  /** Pan offset */
  pan: { x: number; y: number };
  /** Viewport dimensions */
  viewport: { width: number; height: number };
  /** Selected node IDs */
  selectedNodes: string[];
  /** Hovered node ID */
  hoveredNode: string | null;
  /** Selected edge (source-target pair) */
  selectedEdge: { source: string; target: string } | null;
  /** Hovered edge (source-target pair) */
  hoveredEdge: { source: string; target: string } | null;
  /** Highlighted node IDs (for path finding, etc.) */
  highlightedNodes: string[];
  /** Highlighted edges */
  highlightedEdges: Array<{ source: string; target: string }>;
}

/**
 * Graph filter state
 */
export interface GraphFilterState {
  /** Show external dependencies */
  showExternal: boolean;
  /** Show type-only imports */
  showTypeOnly: boolean;
  /** Show only circular dependencies */
  showCircularOnly: boolean;
  /** Show only untested files */
  showUntestedOnly: boolean;
  /** Filter by node type */
  nodeTypes: NodeType[];
  /** Search query (filter by name) */
  searchQuery: string;
  /** Minimum degree threshold (hide low-degree nodes) */
  minDegree?: number;
  /** Show only specific clusters */
  visibleClusters?: number[];
}

/**
 * Graph clustering configuration
 */
export type ClusteringStrategy =
  | 'none'          // No clustering
  | 'directory'     // Group by directory structure
  | 'module'        // Group by module (based on imports)
  | 'functional'    // Group by functional domain
  | 'depth'         // Group by dependency depth
  | 'ownership';    // Group by team/owner

// ============================================================================
// Graph Metrics & Analysis
// ============================================================================

/**
 * Node centrality metrics
 */
export interface NodeCentrality {
  /** Node ID */
  nodeId: string;
  /** Degree centrality (number of connections) */
  degree: number;
  /** Betweenness centrality (bridge nodes) */
  betweenness: number;
  /** Closeness centrality (proximity to all nodes) */
  closeness: number;
  /** PageRank score */
  pageRank: number;
  /** Hub score (outgoing links) */
  hubScore: number;
  /** Authority score (incoming links) */
  authorityScore: number;
}

/**
 * Path between two nodes
 */
export interface NodePath {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Path length (number of hops) */
  length: number;
  /** Node IDs along path */
  nodes: string[];
  /** Edges along path */
  edges: Array<{ source: string; target: string }>;
  /** Total coupling strength along path */
  couplingStrength: number;
  /** Whether path contains circular dependencies */
  hasCircularDeps: boolean;
}

/**
 * Coupling metrics between modules
 */
export interface CouplingMetrics {
  /** Afferent coupling (incoming dependencies) */
  afferent: number;
  /** Efferent coupling (outgoing dependencies) */
  efferent: number;
  /** Instability (efferent / (afferent + efferent)) */
  instability: number;
  /** Abstractness (abstract classes / total classes) */
  abstractness?: number;
  /** Distance from main sequence */
  distanceFromMainSequence?: number;
}

// ============================================================================
// Graph Component Props
// ============================================================================

/**
 * Main dependency graph component props
 */
export interface DependencyGraphProps {
  /** Graph data */
  graph: DependencyGraph;
  /** Layout algorithm */
  layout?: LayoutAlgorithm;
  /** Layout configuration */
  layoutConfig?: Partial<LayoutConfig>;
  /** Initial view state */
  initialViewState?: Partial<GraphViewState>;
  /** Initial filter state */
  initialFilterState?: Partial<GraphFilterState>;
  /** Enable interactions */
  interactive?: boolean;
  /** Show controls (zoom, pan, filter) */
  showControls?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** Show minimap */
  showMinimap?: boolean;
  /** Container height */
  height?: number;
  /** Container width */
  width?: number;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | null;
  /** Callbacks */
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  onSelectionChange?: (selectedNodes: string[]) => void;
  /** Accessibility label */
  ariaLabel?: string;
}

/**
 * Graph controls component props
 */
export interface GraphControlsProps {
  /** Current view state */
  viewState: GraphViewState;
  /** Current filter state */
  filterState: GraphFilterState;
  /** Clustering strategy */
  clusteringStrategy: ClusteringStrategy;
  /** Layout algorithm */
  layout: LayoutAlgorithm;
  /** Callbacks */
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFilterChange: (filters: Partial<GraphFilterState>) => void;
  onClusteringChange: (strategy: ClusteringStrategy) => void;
  onLayoutChange: (layout: LayoutAlgorithm) => void;
}

/**
 * Node detail panel component props
 */
export interface NodeDetailPanelProps {
  /** Selected node */
  node: GraphNode | null;
  /** Full graph (for context) */
  graph: DependencyGraph;
  /** Whether panel is open */
  open: boolean;
  /** Close callback */
  onClose: () => void;
  /** Navigate to source file callback */
  onViewSource?: (filePath: string) => void;
  /** Show dependencies callback */
  onViewDependencies?: (nodeId: string) => void;
  /** Show dependents callback */
  onViewDependents?: (nodeId: string) => void;
}

/**
 * Circular dependency highlight component props
 */
export interface CircularDepHighlightProps {
  /** Circular dependency chains */
  chains: CircularDependencyChain[];
  /** Current graph */
  graph: DependencyGraph;
  /** Selected chain ID */
  selectedChainId?: number;
  /** Callbacks */
  onChainSelect?: (chainId: number) => void;
  onChainHover?: (chainId: number | null) => void;
}

/**
 * Graph search component props
 */
export interface GraphSearchProps {
  /** All nodes (for searching) */
  nodes: GraphNode[];
  /** Search query */
  query: string;
  /** Search callback */
  onSearch: (query: string) => void;
  /** Select result callback */
  onSelectResult: (nodeId: string) => void;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Graph minimap component props
 */
export interface GraphMinimapProps {
  /** Full graph */
  graph: DependencyGraph;
  /** Current viewport */
  viewport: { x: number; y: number; width: number; height: number; zoom: number };
  /** Viewport change callback */
  onViewportChange: (viewport: { x: number; y: number }) => void;
  /** Minimap size */
  size?: { width: number; height: number };
}

// ============================================================================
// Graph Rendering Options
// ============================================================================

/**
 * Graph rendering mode
 */
export type RenderMode =
  | 'canvas'   // Canvas 2D (fast, 100-1000 nodes)
  | 'svg'      // SVG (slower but higher quality, <500 nodes)
  | 'webgl';   // WebGL (fastest, 1000+ nodes)

/**
 * Level of Detail (LOD) configuration
 */
export interface LODConfig {
  /** Enable LOD */
  enabled: boolean;
  /** LOD levels based on zoom */
  levels: {
    /** Zoom threshold */
    zoomThreshold: number;
    /** Show node labels */
    showLabels: boolean;
    /** Show edge labels */
    showEdgeLabels: boolean;
    /** Node detail level */
    nodeDetail: 'full' | 'simplified' | 'dot';
    /** Edge detail level */
    edgeDetail: 'full' | 'simplified' | 'hidden';
  }[];
}

/**
 * Graph rendering performance options
 */
export interface GraphPerformanceOptions {
  /** Rendering mode */
  renderMode: RenderMode;
  /** Enable viewport culling (only render visible) */
  viewportCulling: boolean;
  /** Culling padding (px beyond viewport) */
  cullPadding: number;
  /** Enable level of detail */
  lod: LODConfig;
  /** Debounce force simulation updates (ms) */
  simulationThrottle: number;
  /** Lazy load external dependencies */
  lazyLoadExternal: boolean;
  /** Max nodes before simplification */
  maxNodesBeforeSimplify: number;
}

// ============================================================================
// Graph Data Transformation
// ============================================================================

/**
 * Transform dependency report to graph structure
 */
export type GraphTransformer = (
  report: {
    dependency_graph: Record<string, string[]>;
    circular_dependencies: string[][];
    dependencies_by_file: Record<string, unknown[]>;
  }
) => DependencyGraph;

/**
 * Calculate node positions based on layout algorithm
 */
export type LayoutCalculator = (
  graph: DependencyGraph,
  config: LayoutConfig
) => DependencyGraph;

/**
 * Detect circular dependencies using Tarjan's algorithm
 */
export type CircularDependencyDetector = (
  adjacencyList: Record<string, string[]>
) => CircularDependencyChain[];

/**
 * Find shortest path between nodes using Dijkstra
 */
export type PathFinder = (
  graph: DependencyGraph,
  sourceId: string,
  targetId: string
) => NodePath | null;

/**
 * Calculate centrality metrics for all nodes
 */
export type CentralityCalculator = (
  graph: DependencyGraph
) => Map<string, NodeCentrality>;

// ============================================================================
// Graph Theme Configuration
// ============================================================================

/**
 * Graph visual theme
 */
export interface GraphTheme {
  /** Node colors by type */
  nodeColors: Record<NodeType, string>;
  /** Edge colors by type */
  edgeColors: Record<ImportType, string>;
  /** Circular dependency color */
  circularColor: string;
  /** Selection color */
  selectionColor: string;
  /** Hover color */
  hoverColor: string;
  /** Background color */
  backgroundColor: string;
  /** Grid color */
  gridColor?: string;
  /** Text color */
  textColor: string;
  /** Font family */
  fontFamily: string;
}
