export type LayoutNode = {
  id: string;
  x: number;
  y: number;
};

export type LayoutEdge = {
  id: string;
  source: string;
  target: string;
};

export type KassaLayout = {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
};
