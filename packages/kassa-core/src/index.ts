export type CompilerResult = {
  version: string
  workspace: Workspace
  diagnostics: CoreDiagnostic[]
}

export type Workspace = {
  id: string
  projects: Project[]
}

export type Project = {
  id: string
  name?: string
  rootUri?: string
  entryDocumentId?: string

  documents: SourceDocument[]

  componentDefinitions: ComponentDefinition[]
  componentInstances: ComponentInstance[]
  connectionInstances: ConnectionInstance[]
  groups: Group[]
  tags: Tag[]
  tagSets: TagSet[]

  drawingTemplates: DrawingTemplate[]
  layouts: Layout[]
  schematics: Schematic[]
}

export type SourceDocument = {
  id: string
  uri: string
  text?: string
  imports: ImportRef[]

  layoutIds: string[]
  schematicIds: string[]
}

export type ImportRef = {
  path: string
  resolvedUri?: string
  projectId?: string
  isExternal?: boolean
}

export type CoreDiagnostic = {
  uriString: string
  range?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
  severity?: 1 | 2 | 3 | 4
  code?: number | string
  message: string
}

// ---------- Definitions ----------

export type ComponentDefinition = {
  id: string
  name?: string
  extendsId?: string
  svg?: string
  label?: string
  ports: Port[]
  sourceDocumentId?: string
}

export type Port = {
  id: string
  name?: string
  x: number
  y: number
  rot: number
}

export type Tag = {
  id: string
  name: string
  color?: string
  sourceDocumentId?: string
}

export type TagSet = {
  id: string
  name: string
  tagIds: string[]
  sourceDocumentId?: string
}

export type Group = {
  id: string
  name: string
  componentIds: string[]
  connectionIds: string[]
  tagIds: string[]
  sourceDocumentId?: string
}

// ---------- Instances ----------

export type ComponentInstance = {
  id: string
  name: string
  definitionId: string
  tagIds: string[]
  hardwareRefs: string[]
  groupIds: string[]
  sourceDocumentId?: string
}

export type ConnectionInstance = {
  id: string
  name: string
  from: ComponentPortRef
  to: ComponentPortRef
  isDirectConnection: boolean
  groupIds: string[]
  tagIds: string[]
  sourceDocumentId?: string
}

export type ComponentPortRef = {
  componentId: string
  portId: string
}

// ---------- Drawing Templates ----------

export type DrawingTemplate = {
  id: string
  name?: string
  width: number
  height: number
  scale: number
  // TODO: support better block definitions
  titleBlock?: {
    title: string
    author: string
    date: string
  }
  sourceDocumentId?: string
}

// ---------- Layouts ----------

export type Layout = {
  id: string
  name: string
  sourceDocumentId?: string
  placements: ComponentPlacement[]
  routes: ConnectionRoute[]
  usedLayouts: UsedLayout[]
}

export type UsedLayout = {
  layoutId: string
  x: number
  y: number
  z?: number
  rot?: number
  mirror?: boolean
}

export type ComponentPlacement = {
  componentId: string
  x: number
  y: number
  z?: number
  rot?: number
  mirror?: boolean
  relativeTo?: string
}

export type ConnectionRoute = {
  connectionId: string
  segments: RouteSegment[]
}

export type RouteSegment = {
  deg?: number
  length?: number
  auto?: boolean
}

// ---------- Schematics ----------

export type Schematic = {
  id: string
  name: string
  sourceDocumentId: string

  // If empty, include everything in scope.
  includeComponentIds?: string[]
  includeGroupIds?: string[]

  usedLayouts: UsedLayout[]
  layout: InlineLayout

  drawing: DrawingUse
}

export type InlineLayout = {
  placements: ComponentPlacement[]
  routes: ConnectionRoute[]
}

export type DrawingUse = {
  templateId: string
  fields?: Record<string, string>
}
