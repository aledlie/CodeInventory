/**
 * Graph API Service
 *
 * Loads dependency data and transforms it into graph structure
 * for visualization with force-directed layout.
 */

import type {
  DependencyGraph,
  GraphNode,
  GraphEdge,
  NodeType,
  CircularDependencyChain,
  NodeCluster,
} from '../types/graph';
import type { PythonDependencyReport } from '../types';

/**
 * Load dependency report from the data directory
 */
async function loadDependencyReport(basePath: string): Promise<PythonDependencyReport | null> {
  try {
    const response = await fetch(`${basePath}/dependencies/dependency_report.json`);
    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType?.includes('application/json')) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Determine node type based on file path
 */
function getNodeType(filePath: string): NodeType {
  const lowerPath = filePath.toLowerCase();
  if (lowerPath.includes('/test') || lowerPath.includes('_test.') || lowerPath.includes('.test.')) {
    return 'test';
  }
  if (lowerPath.includes('/config') || lowerPath.includes('config.')) {
    return 'config';
  }
  if (lowerPath.includes('/api') || lowerPath.includes('/service')) {
    return 'service';
  }
  if (lowerPath.includes('/util') || lowerPath.includes('/lib') || lowerPath.includes('/helper')) {
    return 'util';
  }
  return 'app';
}

/**
 * Extract short label from file path
 * For common names like __init__ or schema, include parent directory for disambiguation
 */
function getNodeLabel(filePath: string): string {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  const baseName = fileName.replace(/\.(py|ts|tsx|js|jsx)$/, '');

  // For common/ambiguous names, include parent directory
  const ambiguousNames = ['__init__', 'index', 'schema', 'utils', 'config', 'types', 'constants'];
  if (ambiguousNames.includes(baseName) && parts.length >= 2) {
    const parentDir = parts[parts.length - 2];
    return `${parentDir}/${baseName}`;
  }

  return baseName;
}

/**
 * Extract module/directory from file path
 */
function getModule(filePath: string, rootDir: string): string {
  const relativePath = filePath.replace(rootDir, '').replace(/^\//, '');
  const parts = relativePath.split('/');
  return parts.length > 1 ? parts[0] : 'root';
}

/**
 * Transform dependency report into graph structure
 */
function transformToGraph(report: PythonDependencyReport): DependencyGraph {
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  // Extract root directory from summary, stripping trailing /src if present
  const summaryRoot = report.summary?.root_directory || '';
  const rootDir = summaryRoot.endsWith('/src') ? summaryRoot.slice(0, -4) : summaryRoot;

  // First pass: create nodes for all files
  Object.keys(report.dependencies_by_file).forEach((filePath) => {
    if (!nodeMap.has(filePath)) {
      nodeMap.set(filePath, {
        id: filePath,
        label: getNodeLabel(filePath),
        path: filePath,
        type: getNodeType(filePath),
        size: 10,
        metrics: {
          imports: 0,
          importedBy: 0,
        },
        isCircular: false,
        module: getModule(filePath, rootDir),
      });
    }
  });

  // Second pass: create edges and count dependencies
  const internalDeps = new Map<string, Set<string>>();

  Object.entries(report.dependencies_by_file).forEach(([sourceFile, deps]) => {
    const sourceNode = nodeMap.get(sourceFile);
    if (!sourceNode) return;

    deps.forEach((dep) => {
      // Only consider internal dependencies (those that start with 'src.')
      if (dep.package.startsWith('src.')) {
        // Convert package path to file path
        const targetPath = `${rootDir}/${dep.package.replace(/\./g, '/')}.py`;

        // Track unique dependencies
        if (!internalDeps.has(sourceFile)) {
          internalDeps.set(sourceFile, new Set());
        }

        if (!internalDeps.get(sourceFile)!.has(targetPath)) {
          internalDeps.get(sourceFile)!.add(targetPath);
          sourceNode.metrics.imports++;

          // Create target node if it doesn't exist
          if (!nodeMap.has(targetPath)) {
            nodeMap.set(targetPath, {
              id: targetPath,
              label: getNodeLabel(targetPath),
              path: targetPath,
              type: getNodeType(targetPath),
              size: 10,
              metrics: {
                imports: 0,
                importedBy: 0,
              },
              isCircular: false,
              module: getModule(targetPath, rootDir),
            });
          }

          const targetNode = nodeMap.get(targetPath)!;
          targetNode.metrics.importedBy++;

          // Create edge
          edges.push({
            source: sourceFile,
            target: targetPath,
            type: dep.import_type === 'dynamic' ? 'dynamic' : 'static',
            strength: 1,
            isCircular: false,
          });
        }
      }
    });
  });

  // Process circular dependencies
  const circularChains: CircularDependencyChain[] = [];
  if (report.circular_dependencies && report.circular_dependencies.length > 0) {
    report.circular_dependencies.forEach((chain, index) => {
      const chainNodes = chain.map((pkg) => `${rootDir}/${pkg.replace(/\./g, '/')}.py`);
      const chainEdges: Array<{ source: string; target: string }> = [];

      for (let i = 0; i < chainNodes.length; i++) {
        const source = chainNodes[i];
        const target = chainNodes[(i + 1) % chainNodes.length];
        chainEdges.push({ source, target });

        // Mark nodes as circular
        const node = nodeMap.get(source);
        if (node) {
          node.isCircular = true;
          node.circularChainIds = node.circularChainIds || [];
          node.circularChainIds.push(index);
        }

        // Mark edges as circular
        const edge = edges.find((e) => e.source === source && e.target === target);
        if (edge) {
          edge.isCircular = true;
          edge.circularChainId = index;
        }
      }

      circularChains.push({
        id: index,
        nodes: chainNodes,
        edges: chainEdges,
        length: chainNodes.length,
        severity: chainNodes.length <= 2 ? 'low' : chainNodes.length <= 4 ? 'medium' : 'high',
      });
    });
  }

  // Calculate node sizes based on degree
  nodeMap.forEach((node) => {
    const degree = node.metrics.imports + node.metrics.importedBy;
    node.size = Math.max(8, Math.min(30, 8 + degree * 2));
  });

  // Create clusters by module
  const clusterMap = new Map<string, string[]>();
  nodeMap.forEach((node) => {
    const module = node.module || 'root';
    if (!clusterMap.has(module)) {
      clusterMap.set(module, []);
    }
    clusterMap.get(module)!.push(node.id);
  });

  const clusters: NodeCluster[] = Array.from(clusterMap.entries()).map(([name, nodeIds], index) => ({
    id: index,
    name,
    type: 'directory',
    nodeIds,
  }));

  // Assign cluster IDs to nodes
  clusters.forEach((cluster) => {
    cluster.nodeIds.forEach((nodeId) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        node.clusterId = cluster.id;
      }
    });
  });

  const nodes = Array.from(nodeMap.values());
  const totalEdges = edges.length;
  const avgDegree = nodes.length > 0
    ? nodes.reduce((sum, n) => sum + n.metrics.imports + n.metrics.importedBy, 0) / nodes.length
    : 0;
  const density = nodes.length > 1
    ? (2 * totalEdges) / (nodes.length * (nodes.length - 1))
    : 0;

  return {
    nodes,
    edges,
    circularChains,
    clusters,
    metadata: {
      totalNodes: nodes.length,
      totalEdges,
      circularChainCount: circularChains.length,
      avgDegree,
      density,
      maxDepth: 0, // Would require BFS to calculate
    },
  };
}

/**
 * Generate mock graph data for development
 */
function generateMockGraph(): DependencyGraph {
  const nodes: GraphNode[] = [
    { id: 'App', label: 'App', path: 'src/App.tsx', type: 'app', size: 20, metrics: { imports: 5, importedBy: 0 }, isCircular: false, module: 'src' },
    { id: 'Dashboard', label: 'Dashboard', path: 'src/features/dashboard/Dashboard.tsx', type: 'app', size: 18, metrics: { imports: 4, importedBy: 1 }, isCircular: false, module: 'dashboard' },
    { id: 'Header', label: 'Header', path: 'src/features/dashboard/Header.tsx', type: 'app', size: 12, metrics: { imports: 2, importedBy: 1 }, isCircular: false, module: 'dashboard' },
    { id: 'Sidebar', label: 'Sidebar', path: 'src/features/dashboard/Sidebar.tsx', type: 'app', size: 12, metrics: { imports: 2, importedBy: 1 }, isCircular: false, module: 'dashboard' },
    { id: 'MetricCard', label: 'MetricCard', path: 'src/features/dashboard/MetricCard.tsx', type: 'app', size: 10, metrics: { imports: 1, importedBy: 2 }, isCircular: false, module: 'dashboard' },
    { id: 'useData', label: 'useData', path: 'src/hooks/useData.ts', type: 'util', size: 14, metrics: { imports: 2, importedBy: 3 }, isCircular: false, module: 'hooks' },
    { id: 'api', label: 'api', path: 'src/api/index.ts', type: 'service', size: 16, metrics: { imports: 1, importedBy: 4 }, isCircular: false, module: 'api' },
    { id: 'config', label: 'config', path: 'src/config/index.ts', type: 'config', size: 8, metrics: { imports: 0, importedBy: 2 }, isCircular: false, module: 'config' },
  ];

  const edges: GraphEdge[] = [
    { source: 'App', target: 'Dashboard', type: 'static', strength: 3, isCircular: false },
    { source: 'Dashboard', target: 'Header', type: 'static', strength: 2, isCircular: false },
    { source: 'Dashboard', target: 'Sidebar', type: 'static', strength: 2, isCircular: false },
    { source: 'Dashboard', target: 'MetricCard', type: 'static', strength: 2, isCircular: false },
    { source: 'Dashboard', target: 'useData', type: 'static', strength: 3, isCircular: false },
    { source: 'Header', target: 'config', type: 'static', strength: 1, isCircular: false },
    { source: 'useData', target: 'api', type: 'static', strength: 3, isCircular: false },
    { source: 'api', target: 'config', type: 'static', strength: 2, isCircular: false },
    { source: 'MetricCard', target: 'useData', type: 'static', strength: 2, isCircular: false },
  ];

  return {
    nodes,
    edges,
    circularChains: [],
    clusters: [
      { id: 0, name: 'src', type: 'directory', nodeIds: ['App'] },
      { id: 1, name: 'dashboard', type: 'directory', nodeIds: ['Dashboard', 'Header', 'Sidebar', 'MetricCard'] },
      { id: 2, name: 'hooks', type: 'directory', nodeIds: ['useData'] },
      { id: 3, name: 'api', type: 'directory', nodeIds: ['api'] },
      { id: 4, name: 'config', type: 'directory', nodeIds: ['config'] },
    ],
    metadata: {
      totalNodes: 8,
      totalEdges: 9,
      circularChainCount: 0,
      avgDegree: 2.25,
      density: 0.32,
      maxDepth: 4,
    },
  };
}

/**
 * Graph API service
 */
export const graphApi = {
  /**
   * Load dependency graph
   */
  async loadGraph(basePath: string): Promise<DependencyGraph> {
    const report = await loadDependencyReport(basePath);
    if (report) {
      const graph = transformToGraph(report);
      // If we have very few nodes, return mock data for better demo
      if (graph.nodes.length < 3) {
        return generateMockGraph();
      }
      return graph;
    }
    return generateMockGraph();
  },

  /**
   * Load raw dependency report
   */
  async loadReport(basePath: string): Promise<PythonDependencyReport | null> {
    return loadDependencyReport(basePath);
  },
};
