import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Node, Link } from '../types';

interface UseGraphSimulationProps {
  nodes: Node[];
  links: Link[];
  width: number;
  height: number;
}

export function useGraphSimulation({ nodes, links, width, height }: UseGraphSimulationProps) {
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);

  useEffect(() => {
    simulationRef.current = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    return () => {
      simulationRef.current?.stop();
    };
  }, [nodes, links, width, height]);

  return simulationRef;
}