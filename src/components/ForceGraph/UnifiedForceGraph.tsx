/**
 * UnifiedForceGraph Component
 *
 * Unified React component supporting 2D, 3D, AR, and VR force-directed graph visualization
 * Replaces custom D3.js implementation with react-force-graph library
 *
 * Features:
 * - Mode switching (2D/3D/AR/VR)
 * - Directional arrows and curved links
 * - Multi-node selection
 * - Pathway mode highlighting
 * - Click to focus
 * - Dagre layout support
 * - Custom 3D geometries
 * - Performance optimized with memoization
 */

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import ForceGraphAR from 'react-force-graph-ar';
import ForceGraphVR from 'react-force-graph-vr';

// Custom hooks
import { useNeighborMap } from './hooks/useNeighborMap';
import { useMultiSelection } from './hooks/useMultiSelection';
import { useGraphHighlight } from './hooks/useGraphHighlight';

// Utilities
import {
  enrichLinksWithCurvature,
  applyDagreLayout,
  applyAutoLayout,
  createNode3DObject,
} from './utils';

// Types
import type {
  UnifiedForceGraphProps,
  GraphData,
  Node,
  Link,
  GraphRef,
} from './types';

export const UnifiedForceGraph = React.forwardRef<GraphRef, UnifiedForceGraphProps>(
  (
    {
      data,
      mode = '2d',
      layoutAlgorithm = 'force',
      dagreOptions,
      enablePathwayMode = false,
      enableMultiSelection = true,
      enableNodeDrag = true,
      enableZoom = true,
      enablePan = true,
      onNodeClick,
      onNodeHover,
      onNodeDrag,
      onNodeDragEnd,
      onLinkClick,
      onLinkHover,
      onBackgroundClick,
      backgroundColor,
      nodeColor,
      linkColor,
      cooldownTicks,
      arMarkerPreset = 'hiro',
      arGlScale = 160,
      arYOffset = 1.5,
      showNavInfo = true,
      controlType = 'orbit',
    },
    ref
  ) => {
    const graphRef = useRef<any>();

    // Expose methods via ref
    useEffect(() => {
      if (ref && typeof ref === 'object') {
        (ref as React.MutableRefObject<GraphRef>).current = {
          centerAt: (x, y, duration) => graphRef.current?.centerAt(x, y, duration),
          zoom: (scale, duration) => graphRef.current?.zoom(scale, duration),
          zoomToFit: (duration, padding) => graphRef.current?.zoomToFit(duration, padding),
          cameraPosition: (pos, lookAt, duration) =>
            graphRef.current?.cameraPosition?.(pos, lookAt, duration),
          pauseAnimation: () => graphRef.current?.pauseAnimation?.(),
          resumeAnimation: () => graphRef.current?.resumeAnimation?.(),
          d3Force: (name, force) => graphRef.current?.d3Force?.(name, force),
          graphData: () => graphRef.current?.graphData?.(),
        };
      }
    }, [ref]);

    // Custom hooks
    const neighborMap = useNeighborMap(data);
    const {
      selectedNodes,
      hoveredNode,
      handleNodeSelect,
      handleNodeHover: setHoveredNode,
      clearSelection,
    } = useMultiSelection();

    const { highlightState, handlers: highlightHandlers } = useGraphHighlight(
      data,
      neighborMap,
      enablePathwayMode
    );

    // Apply layout algorithm
    const layoutData = useMemo(() => {
      if (layoutAlgorithm === 'dagre') {
        return applyDagreLayout(data, dagreOptions);
      } else if (layoutAlgorithm === 'auto') {
        return applyAutoLayout(data);
      }
      return data;
    }, [data, layoutAlgorithm, dagreOptions]);

    // Enrich links with curvature
    const enrichedData = useMemo<GraphData>(() => {
      const links = enrichLinksWithCurvature(layoutData.links, layoutData.nodes);

      const nodes = layoutData.nodes.map(node => ({
        ...node,
        isSelected: selectedNodes.has(node.id),
        isHovered: hoveredNode?.id === node.id,
        isHighlighted: highlightState.nodes.has(node.id),
      }));

      return { nodes, links };
    }, [layoutData, selectedNodes, hoveredNode, highlightState]);

    // Event handlers
    const handleNodeClickInternal = useCallback(
      (node: Node, event: any) => {
        if (enableMultiSelection) {
          handleNodeSelect(node, event as MouseEvent);
        }

        // Focus camera on clicked node
        if (mode === '3d' && graphRef.current) {
          const distance = 200;
          const x = node.x || 0;
          const y = node.y || 0;
          const z = node.z || 0;

          graphRef.current.cameraPosition(
            {
              x: x * 1.5,
              y: y * 1.5,
              z: z + distance,
            },
            node,
            1000
          );
        } else if (mode === '2d' && graphRef.current) {
          graphRef.current.centerAt(node.x, node.y, 1000);
          graphRef.current.zoom(2, 1000);
        }

        onNodeClick?.(node, event);
      },
      [mode, enableMultiSelection, handleNodeSelect, onNodeClick]
    );

    const handleNodeHoverInternal = useCallback(
      (node: Node | null) => {
        setHoveredNode(node);
        highlightHandlers.setHighlightedNode(node);
        onNodeHover?.(node);
      },
      [setHoveredNode, highlightHandlers, onNodeHover]
    );

    const handleNodeDragEndInternal = useCallback(
      (node: Node) => {
        // Fix node position after drag
        node.fx = node.x;
        node.fy = node.y;
        if (mode === '3d') {
          node.fz = node.z;
        }
        onNodeDragEnd?.(node);
      },
      [mode, onNodeDragEnd]
    );

    // Common props for all visualization modes
    const commonProps = {
      ref: graphRef,
      graphData: enrichedData,

      // Node configuration
      nodeId: 'id',
      nodeLabel: (node: Node) => `${node.id}\n${node.type || ''}`,
      nodeAutoColorBy: 'group',
      nodeRelSize: 4,
      nodeVal: (node: Node) => (node.pageRank ? node.pageRank * 50 : node.size || 10),
      nodeColor: (node: Node) => {
        if (typeof nodeColor === 'function') return nodeColor(node);
        if (typeof nodeColor === 'string') return nodeColor;
        if (node.isSelected) return '#FF6B35';
        if (node.isHovered) return '#F7DC6F';
        if (node.isHighlighted) return '#4ECDC4';
        return node.color;
      },

      // Link configuration
      linkSource: 'source',
      linkTarget: 'target',
      linkDirectionalArrowLength: 6,
      linkDirectionalArrowRelPos: 1,
      linkCurvature: 'curvature',
      linkLineDash: (link: Link) => link.dash || null,
      linkLabel: (link: Link) => link.type || '',
      linkColor: (link: Link) => {
        if (typeof linkColor === 'function') return linkColor(link);
        if (typeof linkColor === 'string') return linkColor;

        const isHighlighted = highlightHandlers.isLinkHighlighted(link);
        if (isHighlighted) return '#F7DC6F';

        return link.color || 'rgba(150,150,150,0.6)';
      },
      linkWidth: (link: Link) => {
        const isHighlighted = highlightHandlers.isLinkHighlighted(link);
        return isHighlighted ? 3 : link.width || 1;
      },

      // Event handlers
      onNodeClick: handleNodeClickInternal,
      onNodeHover: handleNodeHoverInternal,
      onNodeDrag,
      onNodeDragEnd: handleNodeDragEndInternal,
      onLinkClick,
      onLinkHover,
      onBackgroundClick,

      // Interaction configuration
      enableNodeDrag,
      enableZoom,
      enablePan,

      // Performance configuration
      cooldownTicks: cooldownTicks ?? (layoutAlgorithm === 'dagre' ? 0 : 100),

      // Visual configuration
      backgroundColor: backgroundColor || (mode === '3d' || mode === 'ar' || mode === 'vr' ? '#000011' : '#ffffff'),
    };

    // Render 2D mode
    if (mode === '2d') {
      return (
        <ForceGraph2D
          {...commonProps}

          // 2D-specific: Custom canvas rendering
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.id;
            const fontSize = 12 / globalScale;
            const radius = node.size || 5;

            // Draw selection/highlight ring
            if (node.isSelected || node.isHighlighted) {
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, radius * 1.6, 0, 2 * Math.PI);
              ctx.strokeStyle = node.isSelected ? '#FF6B35' : '#FFD700';
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
            }

            // Main node circle
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);
            ctx.fillStyle = node.color || 'rgba(31, 120, 180, 0.92)';
            ctx.fill();

            // Border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 0.5 / globalScale;
            ctx.stroke();

            // Label
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0,0,0,0.9)';
            ctx.fillText(label, node.x!, node.y!);
          }}

          // Link labels
          linkCanvasObjectMode={() => 'after'}
          linkCanvasObject={(link, ctx, globalScale) => {
            if (!link.type) return;

            const start = link.source as Node;
            const end = link.target as Node;
            if (!start.x || !end.x || !start.y || !end.y) return;

            const fontSize = 8 / globalScale;
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            // Background
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(link.type).width;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(
              midX - textWidth / 2 - 2,
              midY - fontSize / 2 - 1,
              textWidth + 4,
              fontSize + 2
            );

            // Text
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(link.type, midX, midY);
          }}
        />
      );
    }

    // Render 3D mode
    if (mode === '3d') {
      return (
        <ForceGraph3D
          {...commonProps}

          // 3D-specific: Custom Three.js objects
          nodeThreeObject={(node: Node) =>
            createNode3DObject(node, node.isSelected, node.isHighlighted, true)
          }
          nodeThreeObjectExtend={false}

          // 3D controls
          showNavInfo={showNavInfo}
          controlType={controlType}
          enablePointerInteraction={true}
        />
      );
    }

    // Render AR mode
    if (mode === 'ar') {
      return (
        <ForceGraphAR
          {...commonProps as any}
        />
      );
    }

    // Render VR mode
    if (mode === 'vr') {
      return (
        <ForceGraphVR
          {...commonProps as any}
        />
      );
    }

    // Fallback (should never reach here)
    console.warn(`Unknown visualization mode: ${mode}`);
    return null;
  }
);

UnifiedForceGraph.displayName = 'UnifiedForceGraph';
