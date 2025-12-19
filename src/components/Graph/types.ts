export interface Node {
  id: string;
  group: number;
  size?: number;
  pageRank?: number;
  context?: string[];
  type?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
  type?: string;
  context?: string;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export interface GraphProps {
  data: GraphData;
}

export interface NodeRelationship {
  node: Node;
  relationship: {
    type?: string;
    weight: number;
  };
}

export interface InfoPanelData {
  node: Node;
  relationships: {
    directRelationships: NodeRelationship[];
  };
  context?: string[];
}