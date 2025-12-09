/**
 * DependencyGraphPage Component
 *
 * Interactive visualization of project dependencies.
 * Phase 3 feature: Force-directed graph with zoom, pan, and filtering.
 */

import { useState, Suspense, useRef, useEffect } from 'react';
import { Box, Typography, Paper, Skeleton } from '@mui/material';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DashboardLayout } from './DashboardLayout';
import { DependencyGraphCanvas, NodeDetailPanel } from './graph';
import { graphApi } from '../api/graphApi';
import type { GraphNode, DependencyGraph } from '../types/graph';

const DATA_PATH = '/data';

interface GraphContentProps {
  onGraphLoad?: (graph: DependencyGraph) => void;
}

/**
 * Graph content with data fetching
 */
function GraphContent({ onGraphLoad }: GraphContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const { data: graph } = useSuspenseQuery({
    queryKey: ['dependencyGraph'],
    queryFn: () => graphApi.loadGraph(DATA_PATH),
  });

  // Notify parent of graph load
  useEffect(() => {
    if (graph) {
      onGraphLoad?.(graph);
    }
  }, [graph, onGraphLoad]);

  // Measure container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(600, rect.width),
          height: Math.max(400, window.innerHeight - 300),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleNodeSelect = (node: GraphNode | null) => {
    setSelectedNode(node);
  };

  return (
    <Box ref={containerRef} sx={{ width: '100%' }}>
      <DependencyGraphCanvas
        graph={graph}
        width={dimensions.width}
        height={dimensions.height}
        onNodeSelect={handleNodeSelect}
        selectedNodeId={selectedNode?.id}
        highlightCircular
      />
      <NodeDetailPanel
        node={selectedNode}
        graph={graph}
        open={!!selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </Box>
  );
}

/**
 * Loading skeleton for graph
 */
function GraphLoadingSkeleton() {
  return (
    <Paper sx={{ p: 3 }}>
      <Skeleton variant="text" width="40%" height={32} />
      <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={500} />
    </Paper>
  );
}

/**
 * Main DependencyGraphPage component
 */
export function DependencyGraphPage() {
  const [graphStats, setGraphStats] = useState<{
    nodes: number;
    edges: number;
    cycles: number;
  } | null>(null);

  const handleGraphLoad = (graph: DependencyGraph) => {
    setGraphStats({
      nodes: graph.metadata.totalNodes,
      edges: graph.metadata.totalEdges,
      cycles: graph.circularChains.length,
    });
  };

  return (
    <DashboardLayout lastGenerated={new Date()} currentPath="/dashboard/graph">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Page Header */}
        <Box>
          <Typography variant="h1" gutterBottom>
            Dependency Graph
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Interactive visualization of project dependencies.
            {graphStats && (
              <> Showing {graphStats.nodes} modules with {graphStats.edges} dependencies
                {graphStats.cycles > 0 && (
                  <Typography component="span" color="error.main">
                    {' '}({graphStats.cycles} circular dependencies detected)
                  </Typography>
                )}
              </>
            )}
          </Typography>
        </Box>

        {/* Graph Visualization */}
        <Suspense fallback={<GraphLoadingSkeleton />}>
          <GraphContent onGraphLoad={handleGraphLoad} />
        </Suspense>

        {/* Instructions */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Controls
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Zoom:</strong> Scroll wheel or +/- buttons
            • <strong>Pan:</strong> Click and drag background
            • <strong>Select:</strong> Click on a node to see details
            • <strong>Reset:</strong> Click Reset button to restore default view
          </Typography>
        </Paper>
      </Box>
    </DashboardLayout>
  );
}

export default DependencyGraphPage;
