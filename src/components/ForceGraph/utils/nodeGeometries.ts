/**
 * 3D Node Geometry Utilities
 *
 * Creates Three.js geometries and materials for different biophysics entity types
 * Provides custom 3D visualizations for medical/biological knowledge graphs
 */

import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import type { Node } from '../types';

/**
 * Color palette for biophysics entities
 */
const BIOPHYSICS_COLORS = {
  protein: 0x3498db,    // Blue
  gene: 0xe74c3c,       // Red
  pathway: 0x2ecc71,    // Green
  compound: 0xf39c12,   // Orange
  cell: 0x9b59b6,       // Purple
  tissue: 0x1abc9c,     // Turquoise
  organ: 0xe67e22,      // Dark orange
  system: 0x34495e,     // Dark grey
  default: 0x95a5a6,    // Light grey
};

/**
 * Create Three.js geometry based on node type
 *
 * @param node - Node data
 * @returns THREE.BufferGeometry instance
 */
export function createGeometryForNodeType(node: Node): THREE.BufferGeometry {
  const size = node.size || 10;

  switch (node.type) {
    case 'protein':
      // Sphere: Traditional representation for proteins
      return new THREE.SphereGeometry(size, 16, 16);

    case 'gene':
      // Box: Crystalline structure for genetic material
      return new THREE.BoxGeometry(size, size, size);

    case 'pathway':
      // Cone: Directional flow
      return new THREE.ConeGeometry(size * 0.7, size * 1.4, 8);

    case 'compound':
      // TorusKnot: Molecular complexity
      return new THREE.TorusKnotGeometry(size * 0.6, size * 0.2, 64, 8);

    case 'cell':
      // Icosahedron: Organic cell-like structure
      return new THREE.IcosahedronGeometry(size, 1);

    case 'tissue':
      // Cylinder: Layered tissue structure
      return new THREE.CylinderGeometry(size, size, size * 1.5, 8);

    case 'organ':
      // Dodecahedron: Complex organ structure
      return new THREE.DodecahedronGeometry(size, 0);

    case 'system':
      // Octahedron: Interconnected system
      return new THREE.OctahedronGeometry(size, 0);

    default:
      // Default sphere for unknown types
      return new THREE.SphereGeometry(size, 16, 16);
  }
}

/**
 * Create Three.js material with proper lighting and state
 *
 * @param node - Node data
 * @param isSelected - Whether node is selected
 * @param isHighlighted - Whether node is highlighted
 * @returns THREE.Material instance
 */
export function createMaterialForNode(
  node: Node,
  isSelected: boolean = false,
  isHighlighted: boolean = false
): THREE.MeshLambertMaterial {
  // Get color based on node type or custom color
  const baseColor = node.color
    ? new THREE.Color(node.color)
    : new THREE.Color(BIOPHYSICS_COLORS[node.type as keyof typeof BIOPHYSICS_COLORS] || BIOPHYSICS_COLORS.default);

  // Create emissive color for selected/highlighted states
  let emissiveColor = new THREE.Color(0x000000);
  let emissiveIntensity = 0;

  if (isSelected) {
    emissiveColor = new THREE.Color(0xff6b35);  // Orange glow
    emissiveIntensity = 0.5;
  } else if (isHighlighted) {
    emissiveColor = new THREE.Color(0x4ecdc4);  // Teal glow
    emissiveIntensity = 0.3;
  }

  return new THREE.MeshLambertMaterial({
    color: baseColor,
    emissive: emissiveColor,
    emissiveIntensity,
    transparent: true,
    opacity: node.opacity || 0.85,
    flatShading: false,
  });
}

/**
 * Create complete THREE.Mesh object for a node
 *
 * @param node - Node data
 * @param isSelected - Selection state
 * @param isHighlighted - Highlight state
 * @returns THREE.Mesh instance
 */
export function createNodeMesh(
  node: Node,
  isSelected: boolean = false,
  isHighlighted: boolean = false
): THREE.Mesh {
  const geometry = createGeometryForNodeType(node);
  const material = createMaterialForNode(node, isSelected, isHighlighted);

  const mesh = new THREE.Mesh(geometry, material);

  // Add selection ring for visual feedback
  if (isSelected || isHighlighted) {
    const ringGeometry = new THREE.TorusGeometry(
      (node.size || 10) * 1.3,  // Slightly larger than node
      0.5,  // Thin ring
      8,
      32
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: isSelected ? 0xff6b35 : 0xffd700,
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;  // Horizontal ring
    mesh.add(ring);
  }

  return mesh;
}

/**
 * Create 3D text sprite for node labels
 *
 * @param node - Node data
 * @param options - Text sprite options
 * @returns SpriteText instance
 */
export function createTextSprite(
  node: Node,
  options: {
    fontSize?: number;
    color?: string;
    backgroundColor?: string | false;
    yOffset?: number;
  } = {}
): SpriteText {
  const {
    fontSize = 8,
    color = node.color || 'white',
    backgroundColor = false,
    yOffset = -1.2,
  } = options;

  const sprite = new SpriteText(node.id);
  sprite.material.depthWrite = false;  // Transparent background
  sprite.color = color;
  sprite.textHeight = fontSize;
  sprite.center.set(0.5, yOffset);  // Position below node
  sprite.backgroundColor = backgroundColor;

  return sprite;
}

/**
 * Create complete 3D node object with geometry and label
 *
 * @param node - Node data
 * @param isSelected - Selection state
 * @param isHighlighted - Highlight state
 * @param showLabel - Whether to show text label
 * @returns THREE.Object3D with mesh and optional label
 */
export function createNode3DObject(
  node: Node,
  isSelected: boolean = false,
  isHighlighted: boolean = false,
  showLabel: boolean = true
): THREE.Object3D {
  const group = new THREE.Group();

  // Add main mesh
  const mesh = createNodeMesh(node, isSelected, isHighlighted);
  group.add(mesh);

  // Add text label
  if (showLabel) {
    const sprite = createTextSprite(node, {
      color: isSelected ? '#FF6B35' : (isHighlighted ? '#F7DC6F' : 'white'),
    });
    group.add(sprite);
  }

  return group;
}

/**
 * Create custom image-based node for 2D mode
 * Can be used for protein structures, molecular diagrams, etc.
 *
 * @param node - Node data with imageUrl property
 * @param ctx - Canvas 2D context
 */
export function drawImageNode(
  node: Node & { imageUrl?: string },
  ctx: CanvasRenderingContext2D
): void {
  const globalScale = 1; // Use default scale if not provided
  if (!node.imageUrl || !node.x || !node.y) return;

  const size = (node.size || 10) * 2;  // Diameter
  const img = new Image();
  img.src = node.imageUrl;

  // Draw circular clipped image
  ctx.save();
  ctx.beginPath();
  ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(img, node.x - size, node.y - size, size * 2, size * 2);

  ctx.restore();

  // Draw border
  ctx.beginPath();
  ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
  ctx.strokeStyle = node.isSelected ? '#FF6B35' : 'white';
  ctx.lineWidth = 2 / globalScale;
  ctx.stroke();
}
