/**
 * TypeScript type definitions for UnifiedForceGraph component
 * Supports 2D, 3D, AR, and VR visualization modes
 */

import type { Object3D } from 'three';

/**
 * Visualization mode types
 */
export type VisualizationMode = '2d' | '3d' | 'ar' | 'vr';

/**
 * Layout algorithm types
 */
export type LayoutAlgorithm = 'force' | 'dagre' | 'tree' | 'circular' | 'auto';

/**
 * Node entity types for biophysics domain
 */
export type BiophysicsEntityType =
  | 'protein'
  | 'gene'
  | 'pathway'
  | 'compound'
  | 'cell'
  | 'tissue'
  | 'organ'
  | 'system';

/**
 * Enhanced Node interface with support for all visualization modes
 */
export interface Node {
  // Core properties
  id: string;
  group: number;
  type?: BiophysicsEntityType | string;

  // Visual properties
  size?: number;
  color?: string;
  opacity?: number;

  // Analytics properties
  pageRank?: number;
  centrality?: number;
  context?: string[];

  // Position properties (2D/3D)
  x?: number;
  y?: number;
  z?: number;

  // Fixed position properties (for layout algorithms)
  fx?: number;
  fy?: number;
  fz?: number;

  // Velocity properties (for force simulation)
  vx?: number;
  vy?: number;
  vz?: number;

  // State properties (computed)
  isSelected?: boolean;
  isHighlighted?: boolean;
  isHovered?: boolean;
  isExpanded?: boolean;

  // 3D-specific properties
  geometry?: string;  // Three.js geometry type
  material?: string;  // Material configuration
  __threeObj?: Object3D;  // React-force-graph internal

  // Metadata
  metadata?: Record<string, unknown>;
  neighbors?: string[];  // Pre-computed for performance
}

/**
 * Enhanced Link interface with advanced features
 */
export interface Link {
  // Core properties
  source: string | Node;
  target: string | Node;

  // Relationship properties
  type?: string;
  value: number;
  weight?: number;
  context?: string;

  // Visual properties
  color?: string;
  opacity?: number;
  width?: number;

  // Curvature for parallel/self links
  curvature?: number;

  // Dash pattern for predicted/inferred links
  dash?: [number, number] | null;

  // Directional properties
  directionalArrowLength?: number;
  directionalArrowColor?: string;
  directionalParticles?: number;

  // State properties
  isInferred?: boolean;
  isPredicted?: boolean;
  isHighlighted?: boolean;

  // Metadata
  metadata?: Record<string, unknown>;
  __indexColor?: number;  // React-force-graph internal
}

/**
 * Graph data structure
 */
export interface GraphData {
  nodes: Node[];
  links: Link[];
}

/**
 * Layout configuration options
 */
export interface DagreLayoutOptions {
  rankdir?: 'TB' | 'BT' | 'LR' | 'RL';  // Direction
  nodesep?: number;  // Horizontal separation
  ranksep?: number;  // Vertical separation
  marginx?: number;
  marginy?: number;
}

export interface TreeLayoutOptions {
  orientation?: 'vertical' | 'horizontal' | 'radial';
  levelSeparation?: number;
  siblingSeparation?: number;
}

export interface ForceLayoutOptions {
  linkDistance?: number;
  chargeStrength?: number;
  collisionRadius?: number;
}

/**
 * Unified ForceGraph component props
 */
export interface UnifiedForceGraphProps {
  // Data
  data: GraphData;

  // Visualization mode
  mode: VisualizationMode;

  // Layout options
  layoutAlgorithm?: LayoutAlgorithm;
  dagreOptions?: DagreLayoutOptions;
  treeOptions?: TreeLayoutOptions;
  forceOptions?: ForceLayoutOptions;

  // Feature toggles
  enablePathwayMode?: boolean;
  enableMultiSelection?: boolean;
  enableNodeDrag?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;

  // Event handlers
  onNodeClick?: (node: Node, event?: MouseEvent) => void;
  onNodeHover?: (node: Node | null) => void;
  onNodeDrag?: (node: Node) => void;
  onNodeDragEnd?: (node: Node) => void;
  onLinkClick?: (link: Link, event?: MouseEvent) => void;
  onLinkHover?: (link: Link | null) => void;
  onBackgroundClick?: (event: MouseEvent) => void;

  // Styling overrides
  backgroundColor?: string;
  nodeColor?: string | ((node: Node) => string);
  linkColor?: string | ((link: Link) => string);

  // Performance options
  cooldownTicks?: number;
  cooldownTime?: number;
  warmupTicks?: number;

  // AR-specific props
  arMarkerPreset?: 'hiro' | 'kanji' | string;
  arGlScale?: number;
  arYOffset?: number;

  // 3D/VR-specific props
  showNavInfo?: boolean;
  controlType?: 'trackball' | 'orbit' | 'fly';
  enablePointerInteraction?: boolean;
}

/**
 * Node relationship data
 */
export interface NodeRelationship {
  node: Node;
  relationship: {
    type?: string;
    weight: number;
  };
}

/**
 * Info panel data structure
 */
export interface InfoPanelData {
  node: Node;
  relationships: {
    directRelationships: NodeRelationship[];
    pathwayRelationships?: NodeRelationship[];
  };
  context?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Graph analytics result
 */
export interface GraphAnalytics {
  nodeCount: number;
  linkCount: number;
  communities: number;
  averageDegree: number;
  density: number;
  diameter?: number;
}

/**
 * Selection state
 */
export interface SelectionState {
  selectedNodes: Set<string>;
  hoveredNode: Node | null;
  selectedLinks: Set<string>;
}

/**
 * Highlight state for pathway mode
 */
export interface HighlightState {
  nodes: Set<string>;
  links: Set<string>;
}

/**
 * Camera position for 3D modes
 */
export interface CameraPosition {
  x: number;
  y: number;
  z: number;
}

/**
 * Graph reference methods (exposed via ref)
 */
export interface GraphRef {
  // 2D methods
  centerAt?: (x: number, y: number, duration?: number) => void;
  zoom?: (scale: number, duration?: number) => void;
  zoomToFit?: (duration?: number, padding?: number) => void;

  // 3D methods
  cameraPosition?: (
    position: CameraPosition,
    lookAt?: Node | CameraPosition,
    duration?: number
  ) => void;

  // Animation control
  pauseAnimation?: () => void;
  resumeAnimation?: () => void;

  // Force simulation control
  d3Force?: (forceName: string, force?: any) => any;
  d3ReheatSimulation?: () => void;

  // Data access
  graphData?: () => GraphData;

  // Screenshot/export
  screenshot?: (width?: number, height?: number) => Promise<string>;
}
