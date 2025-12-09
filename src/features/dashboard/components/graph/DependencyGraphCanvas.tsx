/**
 * DependencyGraphCanvas Component
 *
 * SVG-based interactive dependency graph visualization.
 * Supports zoom, pan, and node selection.
 */

import { useRef, useState, useCallback } from 'react';
import { Box, Paper, Typography, Chip, useTheme } from '@mui/material';
import type { DependencyGraph, GraphNode, GraphEdge, NodeType } from '../../types/graph';
import { useForceSimulation, type SimulationNode } from '../../hooks/useForceSimulation';

interface DependencyGraphCanvasProps {
  graph: DependencyGraph;
  width?: number;
  height?: number;
  onNodeSelect?: (node: GraphNode | null) => void;
  selectedNodeId?: string | null;
  highlightCircular?: boolean;
}

const NODE_COLORS: Record<NodeType, string> = {
  app: '#2196F3',      // Blue
  util: '#4CAF50',     // Green
  service: '#FF9800',  // Orange
  config: '#9C27B0',   // Purple
  test: '#607D8B',     // Grey
  external: '#F44336', // Red
};

export function DependencyGraphCanvas({
  graph,
  width = 800,
  height = 600,
  onNodeSelect,
  selectedNodeId,
  highlightCircular = true,
}: DependencyGraphCanvasProps) {
  const theme = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { nodes, isSimulating } = useForceSimulation(graph, {
    width,
    height,
    iterations: 150,
  });

  // Create node lookup for edge rendering
  const nodeMap = new Map<string, SimulationNode>();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  // Get edge coordinates
  const getEdgeCoords = (edge: GraphEdge) => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    const source = nodeMap.get(sourceId);
    const target = nodeMap.get(targetId);
    if (!source || !target) return null;
    return { source, target };
  };

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale * scaleChange)),
    }));
  }, []);

  // Handle pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((node: SimulationNode, e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeSelect?.(node);
  }, [onNodeSelect]);

  // Handle background click (deselect)
  const handleBackgroundClick = useCallback(() => {
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  // Reset view
  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  // Check if node is connected to selected node
  const isConnectedToSelected = (nodeId: string): boolean => {
    if (!selectedNodeId) return false;
    return graph.edges.some((edge) => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      return (
        (sourceId === selectedNodeId && targetId === nodeId) ||
        (targetId === selectedNodeId && sourceId === nodeId)
      );
    });
  };

  // Calculate node opacity based on selection
  const getNodeOpacity = (nodeId: string): number => {
    if (!selectedNodeId) return 1;
    if (nodeId === selectedNodeId) return 1;
    if (isConnectedToSelected(nodeId)) return 1;
    return 0.3;
  };

  // Calculate edge opacity based on selection
  const getEdgeOpacity = (edge: GraphEdge): number => {
    if (!selectedNodeId) return 0.6;
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    if (sourceId === selectedNodeId || targetId === selectedNodeId) return 1;
    return 0.1;
  };

  return (
    <Paper
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: theme.palette.mode === 'dark' ? '#1a1a2e' : '#f8f9fa',
      }}
    >
      {/* Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          display: 'flex',
          gap: 1,
        }}
      >
        <Chip
          label={`${nodes.length} nodes`}
          size="small"
          sx={{ bgcolor: 'background.paper' }}
        />
        <Chip
          label={`${graph.edges.length} edges`}
          size="small"
          sx={{ bgcolor: 'background.paper' }}
        />
        {graph.circularChains.length > 0 && (
          <Chip
            label={`${graph.circularChains.length} cycles`}
            size="small"
            color="error"
          />
        )}
      </Box>

      {/* Zoom controls */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        <Chip
          label="+"
          size="small"
          onClick={() => setTransform((p) => ({ ...p, scale: Math.min(3, p.scale * 1.2) }))}
          sx={{ cursor: 'pointer', bgcolor: 'background.paper' }}
        />
        <Chip
          label="-"
          size="small"
          onClick={() => setTransform((p) => ({ ...p, scale: Math.max(0.1, p.scale * 0.8) }))}
          sx={{ cursor: 'pointer', bgcolor: 'background.paper' }}
        />
        <Chip
          label="Reset"
          size="small"
          onClick={resetView}
          sx={{ cursor: 'pointer', bgcolor: 'background.paper' }}
        />
      </Box>

      {/* Legend */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          zIndex: 10,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5,
          maxWidth: 200,
        }}
      >
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <Chip
            key={type}
            label={type}
            size="small"
            sx={{
              bgcolor: color,
              color: '#fff',
              fontSize: '0.65rem',
              height: 20,
            }}
          />
        ))}
      </Box>

      {/* Loading indicator */}
      {isSimulating && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Calculating layout...
          </Typography>
        </Box>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleBackgroundClick}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Edges */}
          <g className="edges">
            {graph.edges.map((edge, i) => {
              const coords = getEdgeCoords(edge);
              if (!coords) return null;
              const { source, target } = coords;
              const isCircular = highlightCircular && edge.isCircular;
              const opacity = getEdgeOpacity(edge);

              return (
                <line
                  key={`edge-${i}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isCircular ? '#F44336' : theme.palette.divider}
                  strokeWidth={isCircular ? 2 : 1}
                  strokeDasharray={edge.type === 'dynamic' ? '4,4' : undefined}
                  opacity={opacity}
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
          </g>

          {/* Arrowhead marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={theme.palette.divider}
              />
            </marker>
          </defs>

          {/* Nodes */}
          <g className="nodes">
            {nodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              const isHovered = node.id === hoveredNode;
              const opacity = getNodeOpacity(node.id);
              const color = NODE_COLORS[node.type];
              const radius = node.size / 2;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={(e) => handleNodeClick(node, e)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                  opacity={opacity}
                >
                  {/* Selection ring */}
                  {isSelected && (
                    <circle
                      r={radius + 4}
                      fill="none"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                    />
                  )}
                  {/* Circular dependency indicator */}
                  {highlightCircular && node.isCircular && (
                    <circle
                      r={radius + 2}
                      fill="none"
                      stroke="#F44336"
                      strokeWidth={2}
                      strokeDasharray="4,2"
                    />
                  )}
                  {/* Node circle */}
                  <circle
                    r={radius}
                    fill={color}
                    stroke={isHovered ? theme.palette.common.white : 'none'}
                    strokeWidth={isHovered ? 2 : 0}
                  />
                  {/* Label */}
                  <text
                    dy={radius + 12}
                    textAnchor="middle"
                    fill={theme.palette.text.primary}
                    fontSize={10}
                    fontFamily={theme.typography.fontFamily}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Tooltip */}
      {hoveredNode && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 10,
            bgcolor: 'background.paper',
            p: 1,
            borderRadius: 1,
            boxShadow: 1,
            maxWidth: 250,
          }}
        >
          {(() => {
            const node = nodes.find((n) => n.id === hoveredNode);
            if (!node) return null;
            return (
              <>
                <Typography variant="subtitle2">{node.label}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {node.path}
                </Typography>
                <Typography variant="caption" display="block">
                  Imports: {node.metrics.imports} | Imported by: {node.metrics.importedBy}
                </Typography>
              </>
            );
          })()}
        </Box>
      )}
    </Paper>
  );
}

export default DependencyGraphCanvas;
