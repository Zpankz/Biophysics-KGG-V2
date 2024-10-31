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
  onNodeHover: (event: any, d: any) => void;
  onNodeLeave: () => void;
  onNodeClick: (event: any, d: any) => void;
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

  const svgSelection = d3.select(svg)
    .attr('width', width)
    .attr('height', height)
    .style('background-color', colors.background);

  const g = svgSelection.append('g');

  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => g.attr('transform', event.transform));

  svgSelection.call(zoom as any);

  const simulation = d3.forceSimulation(data.nodes as any)
    .force('link', d3.forceLink(data.links)
      .id((d: any) => d.id)
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
    .attr('stroke-width', (d: any) => Math.sqrt(d.value));

  const linkLabels = g.append('g')
    .selectAll('text')
    .data(data.links)
    .join('text')
    .attr('class', 'link-label')
    .attr('text-anchor', 'middle')
    .attr('dy', -5)
    .style('font-size', '8px')
    .style('fill', colors.text)
    .text((d: any) => d.type || '');

  const nodes = g.append('g')
    .selectAll('circle')
    .data(data.nodes)
    .join('circle')
    .attr('class', 'node')
    .attr('r', (d: any) => d.size || 10)
    .attr('fill', (d: any) => colors.nodes[d.group % colors.nodes.length])
    .attr('stroke-width', 3)
    .attr('stroke', 'none');

  const labels = g.append('g')
    .selectAll('text')
    .data(data.nodes)
    .join('text')
    .attr('dx', 12)
    .attr('dy', 4)
    .text((d: any) => d.id)
    .style('font-size', '10px')
    .style('fill', colors.text);

  const getTopConnections = (nodeId: string) => {
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

    return {
      nodeIds: new Set(connections.map(c => c?.nodeId)),
      linkIndices: new Set(connections.map(c => c?.linkIndex))
    };
  };

  const getPathwayNodes = (nodeId: string) => {
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
    return { pathNodes, pathLinks };
  };

  nodes
    .on('mouseover', (event: any, d: any) => {
      // Dim all elements
      nodes.style('opacity', 0.2);
      links.style('opacity', 0.2);
      linkLabels.style('opacity', 0.2);
      labels.style('opacity', 0.2);

      if (isPathwayMode) {
        const { pathNodes, pathLinks } = getPathwayNodes(d.id);
        
        // Highlight pathway nodes and links in gold
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

        // Highlight top 3 connections in hot pink
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

      onNodeHover(event, d);
    })
    .on('mouseout', () => {
      // Reset all styles
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
    .on('click', onNodeClick)
    .call(d3.drag<any, any>()
      .on('start', (event: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on('drag', (event: any) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on('end', (event: any) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }) as any);

  simulation.on('tick', () => {
    links
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);

    linkLabels
      .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
      .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

    nodes
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y);

    labels
      .attr('x', (d: any) => d.x)
      .attr('y', (d: any) => d.y);
  });

  return { simulation, zoom };
}