import * as d3 from 'd3';

interface Node {
  id: string;
  group: number;
  pageRank?: number;
  size?: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
  type?: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export function analyzeGraph(data: GraphData): GraphData {
  // Calculate node centrality and size
  const nodes = calculateCentrality(data.nodes, data.links);
  
  // Calculate edge weights
  const links = calculateLinkWeights(data.links);
  
  // Detect communities
  const communities = detectCommunities(nodes, links);

  return {
    nodes: nodes.map(node => ({
      ...node,
      group: communities[node.id] || node.group
    })),
    links
  };
}

function calculateCentrality(nodes: Node[], links: Link[]): Node[] {
  const nodeMap = new Map<string, { in: number; out: number }>();
  
  // Initialize node degrees
  nodes.forEach(node => {
    nodeMap.set(node.id, { in: 0, out: 0 });
  });

  // Calculate degrees
  links.forEach(link => {
    const source = typeof link.source === 'string' ? link.source : link.source.id;
    const target = typeof link.target === 'string' ? link.target : link.target.id;
    
    const sourceNode = nodeMap.get(source);
    const targetNode = nodeMap.get(target);
    
    if (sourceNode) sourceNode.out += link.value;
    if (targetNode) targetNode.in += link.value;
  });

  // Calculate PageRank
  const dampingFactor = 0.85;
  const iterations = 100;
  let pageRanks = new Map<string, number>();
  
  // Initialize PageRank
  nodes.forEach(node => {
    pageRanks.set(node.id, 1 / nodes.length);
  });

  // Iterate to converge
  for (let i = 0; i < iterations; i++) {
    const newRanks = new Map<string, number>();
    
    nodes.forEach(node => {
      const incomingLinks = links.filter(l => 
        (typeof l.target === 'string' ? l.target : l.target.id) === node.id
      );
      
      let rankSum = 0;
      incomingLinks.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const sourceRank = pageRanks.get(sourceId) || 0;
        const sourceDegree = nodeMap.get(sourceId)?.out || 1;
        rankSum += (sourceRank * link.value) / sourceDegree;
      });

      const newRank = (1 - dampingFactor) / nodes.length + dampingFactor * rankSum;
      newRanks.set(node.id, newRank);
    });

    pageRanks = newRanks;
  }

  // Normalize PageRank values and set node sizes
  const maxRank = Math.max(...Array.from(pageRanks.values()));
  
  return nodes.map(node => ({
    ...node,
    pageRank: (pageRanks.get(node.id) || 0) / maxRank,
    size: 5 + ((pageRanks.get(node.id) || 0) / maxRank) * 25
  }));
}

function calculateLinkWeights(links: Link[]): Link[] {
  const maxWeight = Math.max(...links.map(l => l.value));
  const minWeight = Math.min(...links.map(l => l.value));
  const weightRange = maxWeight - minWeight;

  return links.map(link => ({
    ...link,
    value: weightRange > 0 ? 
      1 + ((link.value - minWeight) / weightRange) * 4 : 
      1
  }));
}

function detectCommunities(nodes: Node[], links: Link[]): Record<string, number> {
  const adjacencyList = new Map<string, Set<string>>();
  
  // Build adjacency list
  nodes.forEach(node => {
    adjacencyList.set(node.id, new Set());
  });

  links.forEach(link => {
    const source = typeof link.source === 'string' ? link.source : link.source.id;
    const target = typeof link.target === 'string' ? link.target : link.target.id;
    
    adjacencyList.get(source)?.add(target);
    adjacencyList.get(target)?.add(source);
  });

  // Community detection using Louvain-like approach
  const communities: Record<string, number> = {};
  let communityId = 0;
  const visited = new Set<string>();

  function assignCommunity(nodeId: string, communityId: number) {
    if (visited.has(nodeId)) return;
    
    visited.add(nodeId);
    communities[nodeId] = communityId;
    
    adjacencyList.get(nodeId)?.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        assignCommunity(neighbor, communityId);
      }
    });
  }

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      assignCommunity(node.id, communityId++);
    }
  });

  return communities;
}

export function getMultiHopRelationships(nodeId: string, targetNodeId: string | null, data: GraphData) {
  // Get direct relationships
  const directRelationships = data.links
    .filter(link => {
      const source = typeof link.source === 'string' ? link.source : link.source.id;
      const target = typeof link.target === 'string' ? link.target : link.target.id;
      return source === nodeId || target === nodeId;
    })
    .map(link => {
      const source = typeof link.source === 'string' ? link.source : link.source.id;
      const target = typeof link.target === 'string' ? link.target : link.target.id;
      const otherId = source === nodeId ? target : source;
      
      return {
        node: data.nodes.find(n => n.id === otherId)!,
        relationship: {
          type: link.type,
          weight: link.value
        }
      };
    })
    .sort((a, b) => b.relationship.weight - a.relationship.weight)
    .slice(0, 3);

  return {
    directRelationships,
    targetNodeId
  };
}