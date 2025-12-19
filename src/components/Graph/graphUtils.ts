import * as d3 from 'd3';
import type { Node, Link } from './types';

interface InitializeGraphParams {
  svg: SVGSVGElement;
  container: HTMLDivElement;
  data: { nodes: Node[]; links: Link[] };
  colors: {
    background: string;
    text: string;
    nodes: string[];
  };
  isPathwayMode: boolean;
  onNodeHover: (event: MouseEvent, d: Node) => void;
  onNodeLeave: () => void;
  onNodeClick: (event: MouseEvent, d: Node) => void;
}

interface ConnectionCache {
  nodeIds: Set<string>;
  linkIndices: Set<number>;
}

interface PathwayCache {
  pathNodes: Set<string>;
  pathLinks: Set<number>;
}

export function initializeGraph({
  svg,
  container,
  data,
  colors,
  isPathwayMode,
  onNodeHover,
  onNodeLeave,
  onNodeClick
}: InitializeGraphParams) {
  d3.select(svg).selectAll('*').remove();

  const width = container.clientWidth;
  const height = container.clientHeight;

  const connectionCache = new Map<string, ConnectionCache>();
  const pathwayCache = new Map<string, PathwayCache>();

  const svgSelection = d3.select(svg)
    .attr('width', width)
    .attr('height', height)
    .style('background-color', colors.background);

  const g = svgSelection.append('g');

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => g.attr('transform', event.transform));

  svgSelection.call(zoom);

  const simulation = d3.forceSimulation<Node, Link>(data.nodes)
    .force('link', d3.forceLink<Node, Link>(data.links)
      .id((d) => d.id)
      .distance(100))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(50));

  const links = g.append('g')
    .selectAll('line')
    .data(data.links)
    .join('line')
    .attr('class', 'link')
    .attr('stroke', colors.text)
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', (d) => Math.sqrt(d.value));

  const linkLabels = g.append('g')
    .selectAll('text')
    .data(data.links)
    .join('text')
    .attr('class', 'link-label')
    .attr('text-anchor', 'middle')
    .attr('dy', -5)
    .style('font-size', '8px')
    .style('fill', colors.text)
    .text((d) => d.type || '');

  const nodes = g.append('g')
    .selectAll('circle')
    .data(data.nodes)
    .join('circle')
    .attr('class', 'node')
    .attr('r', (d) => d.size || 10)
    .attr('fill', (d) => colors.nodes[d.group % colors.nodes.length])
    .attr('stroke-width', 3)
    .attr('stroke', 'none');

  const labels = g.append('g')
    .selectAll('text')
    .data(data.nodes)
    .join('text')
    .attr('dx', 12)
    .attr('dy', 4)
    .text((d) => d.id)
    .style('font-size', '10px')
    .style('fill', colors.text);

  const getTopConnections = (nodeId: string): ConnectionCache => {
    if (connectionCache.has(nodeId)) {
      return connectionCache.get(nodeId)!;
    }

    const connections = data.links
      .map((link, index) => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        if (sourceId === nodeId || targetId === nodeId) {
          return {
            linkIndex: index,
            nodeId: sourceId === nodeId ? targetId : sourceId,
            weight: link.value
          };
        }
        return null;
      })
      .filter(c => c !== null)
      .sort((a, b) => (b?.weight || 0) - (a?.weight || 0))
      .slice(0, 3);

    const result = {
      nodeIds: new Set(connections.map(c => c?.nodeId)),
      linkIndices: new Set(connections.map(c => c?.linkIndex))
    };

    connectionCache.set(nodeId, result);
    return result;
  };

  const getPathwayNodes = (nodeId: string): PathwayCache => {
    if (pathwayCache.has(nodeId)) {
      return pathwayCache.get(nodeId)!;
    }

    const visited = new Set<string>();
    const pathNodes = new Set<string>();
    const pathLinks = new Set<number>();

    function dfs(currentId: string, depth: number = 0) {
      if (depth > 3 || visited.has(currentId)) return;
      visited.add(currentId);
      pathNodes.add(currentId);

      data.links.forEach((link, index) => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;

        if (sourceId === currentId && !visited.has(targetId)) {
          pathLinks.add(index);
          dfs(targetId, depth + 1);
        } else if (targetId === currentId && !visited.has(sourceId)) {
          pathLinks.add(index);
          dfs(sourceId, depth + 1);
        }
      });
    }

    dfs(nodeId);
    const result = { pathNodes, pathLinks };
    pathwayCache.set(nodeId, result);
    return result;
  };

  nodes
    .on('mouseover', (event, d) => {
      nodes.style('opacity', 0.2);
      links.style('opacity', 0.2);
      linkLabels.style('opacity', 0.2);
      labels.style('opacity', 0.2);

      if (isPathwayMode) {
        const { pathNodes, pathLinks } = getPathwayNodes(d.id);

        nodes
          .style('opacity', n => pathNodes.has(n.id) ? 1 : 0.2)
          .attr('stroke', n => pathNodes.has(n.id) ? '#FFD700' : 'none');

        links
          .style('opacity', (_, i) => pathLinks.has(i) ? 1 : 0.2)
          .attr('stroke', (_, i) => pathLinks.has(i) ? '#FFD700' : colors.text);

        linkLabels
          .style('opacity', (_, i) => pathLinks.has(i) ? 1 : 0.2);

        labels
          .style('opacity', n => pathNodes.has(n.id) ? 1 : 0.2);
      } else {
        const { nodeIds, linkIndices } = getTopConnections(d.id);

        nodes
          .style('opacity', n => n.id === d.id || nodeIds.has(n.id) ? 1 : 0.2)
          .attr('stroke', n => n.id === d.id || nodeIds.has(n.id) ? '#FF00FF' : 'none');

        links
          .style('opacity', (_, i) => linkIndices.has(i) ? 1 : 0.2)
          .attr('stroke', (_, i) => linkIndices.has(i) ? '#FF00FF' : colors.text);

        linkLabels
          .style('opacity', (_, i) => linkIndices.has(i) ? 1 : 0.2);

        labels
          .style('opacity', n => n.id === d.id || nodeIds.has(n.id) ? 1 : 0.2);
      }

      onNodeHover(event as MouseEvent, d);
    })
    .on('mouseout', () => {
      nodes
        .style('opacity', 1)
        .attr('stroke', 'none');

      links
        .style('opacity', 1)
        .attr('stroke', colors.text);

      linkLabels.style('opacity', 1);
      labels.style('opacity', 1);

      onNodeLeave();
    })
    .on('click', (event, d) => onNodeClick(event as MouseEvent, d))
    .call(d3.drag<SVGCircleElement, Node>()
      .on('start', (event) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on('drag', (event) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on('end', (event) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }));

  let animationFrameId: number | null = null;
  let tickScheduled = false;

  const previousPositions = new Map<string, { x: number; y: number }>();
  const POSITION_THRESHOLD = 0.1;

  const updatePositions = () => {
    tickScheduled = false;

    links
      .attr('x1', (d) => {
        const source = typeof d.source === 'object' ? d.source : data.nodes.find(n => n.id === d.source);
        return source?.x || 0;
      })
      .attr('y1', (d) => {
        const source = typeof d.source === 'object' ? d.source : data.nodes.find(n => n.id === d.source);
        return source?.y || 0;
      })
      .attr('x2', (d) => {
        const target = typeof d.target === 'object' ? d.target : data.nodes.find(n => n.id === d.target);
        return target?.x || 0;
      })
      .attr('y2', (d) => {
        const target = typeof d.target === 'object' ? d.target : data.nodes.find(n => n.id === d.target);
        return target?.y || 0;
      });

    linkLabels
      .attr('x', (d) => {
        const source = typeof d.source === 'object' ? d.source : data.nodes.find(n => n.id === d.source);
        const target = typeof d.target === 'object' ? d.target : data.nodes.find(n => n.id === d.target);
        return ((source?.x || 0) + (target?.x || 0)) / 2;
      })
      .attr('y', (d) => {
        const source = typeof d.source === 'object' ? d.source : data.nodes.find(n => n.id === d.source);
        const target = typeof d.target === 'object' ? d.target : data.nodes.find(n => n.id === d.target);
        return ((source?.y || 0) + (target?.y || 0)) / 2;
      });

    nodes
      .attr('cx', (d) => d.x || 0)
      .attr('cy', (d) => d.y || 0);

    labels
      .attr('x', (d) => d.x || 0)
      .attr('y', (d) => d.y || 0);
  };

  simulation.on('tick', () => {
    let hasSignificantChange = false;

    for (const node of data.nodes) {
      const prev = previousPositions.get(node.id);
      const currentX = node.x || 0;
      const currentY = node.y || 0;

      if (!prev ||
          Math.abs(currentX - prev.x) > POSITION_THRESHOLD ||
          Math.abs(currentY - prev.y) > POSITION_THRESHOLD) {
        hasSignificantChange = true;
        previousPositions.set(node.id, { x: currentX, y: currentY });
      }
    }

    if (hasSignificantChange && !tickScheduled) {
      tickScheduled = true;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = requestAnimationFrame(updatePositions);
    }
  });

  return { simulation, zoom };
}