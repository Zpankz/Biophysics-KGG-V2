/**
 * useGraphHighlight Hook
 *
 * Manages highlighting state for pathway mode and hover interactions
 * Pre-calculates highlight sets for performance
 */

import { useMemo, useState, useCallback } from 'react';
import type { GraphData, Node, Link, HighlightState } from '../types';

export interface GraphHighlightHandlers {
  setHighlightedNode: (node: Node | null) => void;
  clearHighlights: () => void;
  isNodeHighlighted: (nodeId: string) => boolean;
  isLinkHighlighted: (link: Link) => boolean;
}

export interface UseGraphHighlightReturn {
  highlightState: HighlightState;
  handlers: GraphHighlightHandlers;
}

/**
 * Custom hook for managing graph element highlighting
 *
 * @param data - Graph data
 * @param neighborMap - Pre-computed neighbor map (from useNeighborMap)
 * @param pathwayMode - Whether pathway mode is enabled
 * @param maxDepth - Maximum depth for pathway traversal (default: 3)
 * @returns Highlight state and handler functions
 */
export function useGraphHighlight(
  data: GraphData,
  neighborMap: Map<string, Set<string>>,
  pathwayMode: boolean = false,
  maxDepth: number = 3
): UseGraphHighlightReturn {
  const [highlightedNode, setHighlightedNodeState] = useState<Node | null>(null);

  /**
   * Calculate which nodes and links should be highlighted
   */
  const highlightState = useMemo<HighlightState>(() => {
    if (!highlightedNode) {
      return {
        nodes: new Set<string>(),
        links: new Set<string>(),
      };
    }

    const highlightedNodes = new Set<string>([highlightedNode.id]);
    const highlightedLinks = new Set<string>();

    if (pathwayMode) {
      // Pathway mode: multi-hop traversal
      const visited = new Set<string>([highlightedNode.id]);
      const queue: Array<{ id: string; depth: number }> = [
        { id: highlightedNode.id, depth: 0 }
      ];

      while (queue.length > 0) {
        const current = queue.shift()!;

        if (current.depth >= maxDepth) continue;

        const neighbors = neighborMap.get(current.id) || new Set<string>();
        neighbors.forEach(neighborId => {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            highlightedNodes.add(neighborId);
            queue.push({ id: neighborId, depth: current.depth + 1 });
          }
        });
      }

      // Find all links within the pathway
      data.links.forEach((link, index) => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;

        if (highlightedNodes.has(sourceId) && highlightedNodes.has(targetId)) {
          highlightedLinks.add(`link-${index}`);
        }
      });
    } else {
      // Standard mode: only direct neighbors
      const neighbors = neighborMap.get(highlightedNode.id) || new Set<string>();
      neighbors.forEach(id => highlightedNodes.add(id));

      // Find direct connection links
      data.links.forEach((link, index) => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;

        if (sourceId === highlightedNode.id || targetId === highlightedNode.id) {
          highlightedLinks.add(`link-${index}`);
        }
      });
    }

    return {
      nodes: highlightedNodes,
      links: highlightedLinks,
    };
  }, [highlightedNode, data, neighborMap, pathwayMode, maxDepth]);

  /**
   * Set the currently highlighted node
   */
  const setHighlightedNode = useCallback((node: Node | null) => {
    setHighlightedNodeState(node);
  }, []);

  /**
   * Clear all highlights
   */
  const clearHighlights = useCallback(() => {
    setHighlightedNodeState(null);
  }, []);

  /**
   * Check if a node is highlighted
   */
  const isNodeHighlighted = useCallback(
    (nodeId: string) => highlightState.nodes.has(nodeId),
    [highlightState]
  );

  /**
   * Check if a link is highlighted
   */
  const isLinkHighlighted = useCallback(
    (link: Link) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;

      // Check if this link connects highlighted nodes
      return (
        highlightState.nodes.has(sourceId) &&
        highlightState.nodes.has(targetId)
      );
    },
    [highlightState]
  );

  return {
    highlightState,
    handlers: {
      setHighlightedNode,
      clearHighlights,
      isNodeHighlighted,
      isLinkHighlighted,
    },
  };
}
