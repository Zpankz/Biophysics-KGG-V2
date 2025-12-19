/**
 * useMultiSelection Hook
 *
 * Manages multi-node selection with Ctrl+Click/Shift+Click support
 * Provides selection state and handlers for graph interactions
 */

import { useState, useCallback } from 'react';
import type { Node } from '../types';

export interface MultiSelectionState {
  selectedNodes: Set<string>;
  hoveredNode: Node | null;
  lastSelectedNode: Node | null;
}

export interface MultiSelectionHandlers {
  handleNodeSelect: (node: Node, event: MouseEvent) => void;
  handleNodeHover: (node: Node | null) => void;
  clearSelection: () => void;
  selectNodes: (nodeIds: string[]) => void;
  deselectNodes: (nodeIds: string[]) => void;
  isNodeSelected: (nodeId: string) => boolean;
}

export interface UseMultiSelectionReturn extends MultiSelectionState, MultiSelectionHandlers {}

/**
 * Custom hook for managing multi-node selection
 *
 * @param initialSelection - Optional initial set of selected node IDs
 * @returns Selection state and handler functions
 */
export function useMultiSelection(
  initialSelection?: Set<string>
): UseMultiSelectionReturn {
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(
    initialSelection || new Set<string>()
  );
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [lastSelectedNode, setLastSelectedNode] = useState<Node | null>(null);

  /**
   * Handle node selection with modifier key support
   * - Normal click: Single selection (or deselect if already selected)
   * - Ctrl/Cmd+Click: Toggle selection (multi-select)
   * - Shift+Click: Range selection (future enhancement)
   */
  const handleNodeSelect = useCallback((node: Node, event: MouseEvent) => {
    const isMultiSelectKey = event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;

    if (isMultiSelectKey) {
      // Multi-selection mode: toggle node in/out of selection
      setSelectedNodes(prev => {
        const next = new Set(prev);
        if (next.has(node.id)) {
          next.delete(node.id);
        } else {
          next.add(node.id);
        }
        return next;
      });
    } else {
      // Single selection mode
      const wasOnlySelection =
        selectedNodes.has(node.id) && selectedNodes.size === 1;

      if (wasOnlySelection) {
        // Clicking the only selected node: deselect all
        setSelectedNodes(new Set<string>());
        setLastSelectedNode(null);
      } else {
        // Select only this node
        setSelectedNodes(new Set<string>([node.id]));
        setLastSelectedNode(node);
      }
    }

    setLastSelectedNode(node);
  }, [selectedNodes]);

  /**
   * Handle node hover state
   */
  const handleNodeHover = useCallback((node: Node | null) => {
    setHoveredNode(node);
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedNodes(new Set<string>());
    setLastSelectedNode(null);
  }, []);

  /**
   * Programmatically select nodes by ID
   */
  const selectNodes = useCallback((nodeIds: string[]) => {
    setSelectedNodes(prev => {
      const next = new Set(prev);
      nodeIds.forEach(id => next.add(id));
      return next;
    });
  }, []);

  /**
   * Programmatically deselect nodes by ID
   */
  const deselectNodes = useCallback((nodeIds: string[]) => {
    setSelectedNodes(prev => {
      const next = new Set(prev);
      nodeIds.forEach(id => next.delete(id));
      return next;
    });
  }, []);

  /**
   * Check if a node is selected
   */
  const isNodeSelected = useCallback(
    (nodeId: string) => selectedNodes.has(nodeId),
    [selectedNodes]
  );

  return {
    // State
    selectedNodes,
    hoveredNode,
    lastSelectedNode,

    // Handlers
    handleNodeSelect,
    handleNodeHover,
    clearSelection,
    selectNodes,
    deselectNodes,
    isNodeSelected,
  };
}

/**
 * Hook variant for drag-to-select (box selection)
 * Future enhancement for selecting multiple nodes by dragging a rectangle
 */
export function useBoxSelection() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  // Implementation for future enhancement
  // Would detect mouse drag on background and select all nodes within rectangle

  return {
    isDragging,
    selectionBox,
    // ... handlers
  };
}
