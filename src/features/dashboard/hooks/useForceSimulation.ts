/**
 * Force Simulation Hook
 *
 * Simple force-directed graph layout simulation without D3 dependency.
 * Uses basic physics: repulsion between nodes, attraction along edges.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DependencyGraph, GraphNode, GraphEdge } from '../types/graph';

interface SimulationNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface SimulationConfig {
  width: number;
  height: number;
  repulsion: number;
  attraction: number;
  damping: number;
  centerStrength: number;
  iterations: number;
}

const DEFAULT_CONFIG: SimulationConfig = {
  width: 800,
  height: 600,
  repulsion: 5000,
  attraction: 0.01,
  damping: 0.9,
  centerStrength: 0.01,
  iterations: 100,
};

/**
 * Calculate distance between two nodes
 */
function distance(a: SimulationNode, b: SimulationNode): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Initialize node positions in a circle
 */
function initializePositions(
  nodes: GraphNode[],
  width: number,
  height: number
): SimulationNode[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;

  return nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    return {
      ...node,
      x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 50,
      y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 50,
      vx: 0,
      vy: 0,
    };
  });
}

/**
 * Run one iteration of the force simulation
 */
function simulationStep(
  nodes: SimulationNode[],
  edges: GraphEdge[],
  config: SimulationConfig
): SimulationNode[] {
  const { width, height, repulsion, attraction, damping, centerStrength } = config;
  const centerX = width / 2;
  const centerY = height / 2;

  // Create node lookup for edge processing
  const nodeMap = new Map<string, SimulationNode>();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  // Reset forces
  nodes.forEach((node) => {
    node.vx = 0;
    node.vy = 0;
  });

  // Repulsion between all node pairs
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dist = Math.max(distance(a, b), 1);
      const force = repulsion / (dist * dist);

      const dx = (b.x - a.x) / dist;
      const dy = (b.y - a.y) / dist;

      a.vx -= dx * force;
      a.vy -= dy * force;
      b.vx += dx * force;
      b.vy += dy * force;
    }
  }

  // Attraction along edges
  edges.forEach((edge) => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    const source = nodeMap.get(sourceId);
    const target = nodeMap.get(targetId);

    if (source && target) {
      const dist = Math.max(distance(source, target), 1);
      const force = attraction * dist;

      const dx = (target.x - source.x) / dist;
      const dy = (target.y - source.y) / dist;

      source.vx += dx * force;
      source.vy += dy * force;
      target.vx -= dx * force;
      target.vy -= dy * force;
    }
  });

  // Center gravity
  nodes.forEach((node) => {
    node.vx += (centerX - node.x) * centerStrength;
    node.vy += (centerY - node.y) * centerStrength;
  });

  // Apply velocities with damping and boundary constraints
  const padding = 50;
  return nodes.map((node) => ({
    ...node,
    x: Math.max(padding, Math.min(width - padding, node.x + node.vx * damping)),
    y: Math.max(padding, Math.min(height - padding, node.y + node.vy * damping)),
    vx: node.vx * damping,
    vy: node.vy * damping,
  }));
}

/**
 * Run the full simulation
 */
function runSimulation(
  graph: DependencyGraph,
  config: SimulationConfig
): SimulationNode[] {
  let nodes = initializePositions(graph.nodes, config.width, config.height);

  for (let i = 0; i < config.iterations; i++) {
    nodes = simulationStep(nodes, graph.edges, config);
  }

  return nodes;
}

/**
 * Hook for force-directed graph layout
 */
export function useForceSimulation(
  graph: DependencyGraph | null,
  config: Partial<SimulationConfig> = {}
) {
  const [nodes, setNodes] = useState<SimulationNode[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });

  // Update config when it changes
  useEffect(() => {
    configRef.current = { ...DEFAULT_CONFIG, ...config };
  }, [config]);

  // Run simulation when graph changes
  useEffect(() => {
    if (!graph || graph.nodes.length === 0) {
      setNodes([]);
      return;
    }

    setIsSimulating(true);

    // Use requestIdleCallback or setTimeout to not block the main thread
    const timeoutId = setTimeout(() => {
      const simulatedNodes = runSimulation(graph, configRef.current);
      setNodes(simulatedNodes);
      setIsSimulating(false);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [graph]);

  // Interactive drag update
  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? { ...node, x, y, vx: 0, vy: 0 }
          : node
      )
    );
  }, []);

  // Re-run simulation
  const rerun = useCallback(() => {
    if (!graph) return;
    setIsSimulating(true);
    setTimeout(() => {
      const simulatedNodes = runSimulation(graph, configRef.current);
      setNodes(simulatedNodes);
      setIsSimulating(false);
    }, 0);
  }, [graph]);

  return {
    nodes,
    isSimulating,
    updateNodePosition,
    rerun,
  };
}

export type { SimulationNode, SimulationConfig };
