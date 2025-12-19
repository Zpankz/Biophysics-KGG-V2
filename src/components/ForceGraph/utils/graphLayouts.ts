/**
 * Graph Layout Algorithms
 *
 * Provides multiple layout algorithms for different visualization needs:
 * - Dagre: Hierarchical directed graphs
 * - Tree: Tree-like structures
 * - Force: Standard force-directed (default)
 */

import dagre from 'dagre';
import type { GraphData, Node, DagreLayoutOptions, TreeLayoutOptions } from '../types';

/**
 * Apply Dagre hierarchical layout algorithm
 * Perfect for dependency graphs, workflows, and hierarchical structures
 *
 * @param data - Input graph data
 * @param options - Dagre layout options
 * @returns Graph data with computed positions
 */
export function applyDagreLayout(
  data: GraphData,
  options: DagreLayoutOptions = {}
): GraphData {
  const {
    rankdir = 'TB',    // Top-to-bottom
    nodesep = 50,      // Horizontal node separation
    ranksep = 100,     // Vertical rank separation
    marginx = 20,
    marginy = 20,
  } = options;

  // Create Dagre graph
  const g = new dagre.graphlib.Graph();

  // Configure layout
  g.setGraph({
    rankdir,
    nodesep,
    ranksep,
    marginx,
    marginy,
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to Dagre
  data.nodes.forEach(node => {
    const width = (node.size || 10) * 4;  // Convert radius to width
    const height = (node.size || 10) * 4;
    g.setNode(node.id, { width, height });
  });

  // Add edges to Dagre
  data.links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    g.setEdge(sourceId, targetId);
  });

  // Compute layout
  dagre.layout(g);

  // Apply positions and fix them (prevent force simulation from moving them)
  const layoutNodes: Node[] = data.nodes.map(node => {
    const dagreNode = g.node(node.id);

    if (!dagreNode) {
      console.warn(`Node ${node.id} not found in Dagre layout`);
      return node;
    }

    return {
      ...node,
      x: dagreNode.x,
      y: dagreNode.y,
      fx: dagreNode.x,  // Fix x position
      fy: dagreNode.y,  // Fix y position
    };
  });

  return {
    nodes: layoutNodes,
    links: data.links,
  };
}

/**
 * Apply tree layout for hierarchical data
 * Uses D3's tree layout algorithm
 *
 * @param data - Input graph data
 * @param rootNodeId - ID of root node (if not specified, uses node with no incoming links)
 * @param options - Tree layout options
 * @returns Graph data with tree positions
 */
export function applyTreeLayout(
  data: GraphData,
  rootNodeId?: string,
  options: TreeLayoutOptions = {}
): GraphData {
  const {
    orientation = 'vertical',
    levelSeparation = 100,
    siblingSeparation = 50,
  } = options;

  // Build parent-child relationships
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  data.nodes.forEach(node => {
    childrenMap.set(node.id, []);
  });

  data.links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;

    childrenMap.get(sourceId)?.push(targetId);
    parentMap.set(targetId, sourceId);
  });

  // Find root node (no parent) if not specified
  let root = rootNodeId;
  if (!root) {
    root = data.nodes.find(node => !parentMap.has(node.id))?.id;
  }

  if (!root) {
    console.warn('No root node found for tree layout, using first node');
    root = data.nodes[0]?.id;
  }

  // Perform tree layout using BFS
  const positions = new Map<string, { x: number; y: number }>();
  const queue: Array<{ id: string; level: number; index: number }> = [
    { id: root!, level: 0, index: 0 }
  ];
  const levelWidths = new Map<number, number>();

  // First pass: calculate level widths
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    levelWidths.set(current.level, (levelWidths.get(current.level) || 0) + 1);

    const children = childrenMap.get(current.id) || [];
    children.forEach((childId, idx) => {
      queue.push({
        id: childId,
        level: current.level + 1,
        index: idx,
      });
    });
  }

  // Second pass: assign positions
  visited.clear();
  queue.push({ id: root!, level: 0, index: 0 });
  const levelCounters = new Map<number, number>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    const levelCount = levelWidths.get(current.level) || 1;
    const positionInLevel = levelCounters.get(current.level) || 0;
    levelCounters.set(current.level, positionInLevel + 1);

    const x = orientation === 'vertical'
      ? (positionInLevel - (levelCount - 1) / 2) * siblingSeparation
      : current.level * levelSeparation;

    const y = orientation === 'vertical'
      ? current.level * levelSeparation
      : (positionInLevel - (levelCount - 1) / 2) * siblingSeparation;

    positions.set(current.id, { x, y });

    const children = childrenMap.get(current.id) || [];
    children.forEach((childId, idx) => {
      queue.push({
        id: childId,
        level: current.level + 1,
        index: idx,
      });
    });
  }

  // Apply positions
  const layoutNodes: Node[] = data.nodes.map(node => {
    const pos = positions.get(node.id) || { x: 0, y: 0 };

    return {
      ...node,
      x: pos.x,
      y: pos.y,
      fx: pos.x,
      fy: pos.y,
    };
  });

  return {
    nodes: layoutNodes,
    links: data.links,
  };
}

/**
 * Apply circular layout
 * Arranges nodes in a circle, useful for showing network structure
 *
 * @param data - Input graph data
 * @param radius - Circle radius (default: auto-calculated)
 * @returns Graph data with circular positions
 */
export function applyCircularLayout(
  data: GraphData,
  radius?: number
): GraphData {
  const nodeCount = data.nodes.length;
  const autoRadius = radius || Math.max(200, nodeCount * 10);

  const layoutNodes: Node[] = data.nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / nodeCount;
    const x = autoRadius * Math.cos(angle);
    const y = autoRadius * Math.sin(angle);

    return {
      ...node,
      x,
      y,
      fx: x,
      fy: y,
    };
  });

  return {
    nodes: layoutNodes,
    links: data.links,
  };
}

/**
 * Remove fixed positions to allow force simulation
 * Useful when switching from pre-computed layout back to force-directed
 *
 * @param data - Graph data with potentially fixed positions
 * @returns Graph data with fx/fy/fz set to undefined
 */
export function unlockNodePositions(data: GraphData): GraphData {
  return {
    nodes: data.nodes.map(node => ({
      ...node,
      fx: undefined,
      fy: undefined,
      fz: undefined,
    })),
    links: data.links,
  };
}

/**
 * Apply layout based on graph structure analysis
 * Automatically selects best layout algorithm
 *
 * @param data - Input graph data
 * @returns Graph data with appropriate layout applied
 */
export function applyAutoLayout(data: GraphData): GraphData {
  const { nodes, links } = data;

  // Calculate graph properties
  const avgDegree = (links.length * 2) / nodes.length;
  const hasLoops = links.some(l => {
    const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
    const targetId = typeof l.target === 'string' ? l.target : l.target.id;
    return sourceId === targetId;
  });

  // Build parent-child map to detect tree structure
  const parentCount = new Map<string, number>();
  nodes.forEach(n => parentCount.set(n.id, 0));

  links.forEach(link => {
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    parentCount.set(targetId, (parentCount.get(targetId) || 0) + 1);
  });

  const isTree = Array.from(parentCount.values()).every(count => count <= 1);

  // Select layout algorithm
  if (isTree && !hasLoops) {
    console.log('Auto-selected tree layout');
    return applyTreeLayout(data);
  } else if (avgDegree < 3 && links.length > 10) {
    console.log('Auto-selected Dagre layout');
    return applyDagreLayout(data);
  } else if (nodes.length < 50 && !hasLoops) {
    console.log('Auto-selected circular layout');
    return applyCircularLayout(data);
  } else {
    console.log('Auto-selected force-directed layout (no pre-processing)');
    return data;  // Use default force-directed
  }
}
