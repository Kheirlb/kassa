// A node with a position and size
// TODO: Use kassa-layout / simplify types.

export type LayoutNode = {
  id: string
  schematicSymbolId?: string // the schematic symbol id for the component
  name?: string // optional name for display
  x: number
  y: number
  width?: number // if not provided, assumed default size (120)
  height?: number // if not provided, assumed default size (120)
  z?: number
  deg?: number // rotation in 2d,
  color?: string // optional color for display
}

// A connection between two nodes (for edge routing)
export type LayoutEdge = {
  id?: string
  fromNodeId?: string
  fromNodeSubId?: string
  toNodeId?: string
  toNodeSubId?: string
  direction?: "horizontal" | "vertical"
  waypoints?: Array<{ x: number; y: number }>
  fromPosition?: { x: number; y: number }
  toPosition?: { x: number; y: number }
}

// Overall layout result
export type NodeEdgeLayout = {
  nodes: LayoutNode[]
  edges: LayoutEdge[]
}
