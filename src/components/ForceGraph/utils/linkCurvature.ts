/**
 * Link Curvature Utilities
 *
 * Handles automatic curvature calculation for:
 * - Parallel links between same nodes
 * - Self-links (loops)
 * - Bidirectional links
 */

import type { Link, Node } from '../types';

/**
 * Calculate appropriate curvature for a link to avoid overlaps
 *
 * @param link - The link to calculate curvature for
 * @param allLinks - All links in the graph
 * @returns Curvature value (0 = straight, >0 = curved)
 */
export function calculateLinkCurvature(link: Link, allLinks: Link[]): number {
  const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
  const targetId = typeof link.target === 'string' ? link.target : link.target.id;

  // Self-link: always curve
  if (sourceId === targetId) {
    return 0.5;
  }

  // Find all parallel links (same source-target pair or reversed)
  const parallelLinks = allLinks.filter(l => {
    const lSourceId = typeof l.source === 'string' ? l.source : l.source.id;
    const lTargetId = typeof l.target === 'string' ? l.target : l.target.id;

    return (
      (lSourceId === sourceId && lTargetId === targetId) ||
      (lSourceId === targetId && lTargetId === sourceId)
    );
  });

  // Single link between nodes: straight line
  if (parallelLinks.length === 1) {
    return 0;
  }

  // Multiple parallel links: distribute curvatures symmetrically
  const index = parallelLinks.indexOf(link);

  // Spread curvatures: -0.5, 0, 0.5 for 3 links, etc.
  const curvatureSpacing = 0.5;
  return curvatureSpacing * (index - (parallelLinks.length - 1) / 2);
}

/**
 * Calculate curvature with collision avoidance
 * More sophisticated version that considers node positions
 *
 * @param link - The link to calculate curvature for
 * @param allLinks - All links in the graph
 * @param allNodes - All nodes in the graph
 * @returns Curvature value optimized to avoid overlaps
 */
export function calculateAdaptiveCurvature(
  link: Link,
  allLinks: Link[],
  allNodes: Node[]
): number {
  const sourceNode = typeof link.source === 'string'
    ? allNodes.find(n => n.id === link.source)
    : link.source;
  const targetNode = typeof link.target === 'string'
    ? allNodes.find(n => n.id === link.target)
    : link.target;

  if (!sourceNode || !targetNode) {
    return calculateLinkCurvature(link, allLinks);
  }

  const sourceId = sourceNode.id;
  const targetId = targetNode.id;

  // Self-link
  if (sourceId === targetId) {
    return 0.5;
  }

  // Calculate base curvature
  const baseCurvature = calculateLinkCurvature(link, allLinks);

  // If nodes have positions, adapt curvature based on spatial arrangement
  if (sourceNode.x !== undefined && targetNode.x !== undefined &&
      sourceNode.y !== undefined && targetNode.y !== undefined) {

    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;

    // For nearly horizontal or vertical links, increase curvature slightly
    // to make them more visible
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = Math.abs((angleRad * 180) / Math.PI);

    const isNearCardinal =
      Math.abs(angleDeg % 90) < 5 ||  // Near 0°, 90°, 180°, 270°
      Math.abs(angleDeg % 90) > 85;

    if (isNearCardinal && baseCurvature === 0) {
      // Add slight curvature to cardinal links for visibility
      return 0.1;
    }
  }

  return baseCurvature;
}

/**
 * Enrich all links in graph data with calculated curvatures
 *
 * @param links - Array of links
 * @param nodes - Optional array of nodes (for adaptive curvature)
 * @returns Links with curvature property set
 */
export function enrichLinksWithCurvature(
  links: Link[],
  nodes?: Node[]
): Link[] {
  return links.map(link => ({
    ...link,
    curvature: nodes
      ? calculateAdaptiveCurvature(link, links, nodes)
      : calculateLinkCurvature(link, links),
  }));
}

/**
 * Calculate self-link curvature based on node size
 * Larger nodes get larger loop radius
 *
 * @param node - Node with self-link
 * @returns Appropriate curvature for node size
 */
export function calculateSelfLinkCurvature(node: Node): number {
  const baseSize = node.size || 10;
  // Larger nodes need more pronounced curves
  return 0.3 + (baseSize / 50);
}
