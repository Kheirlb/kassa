export type CompilerResult = {
  version: string
  projects: Project[]
  documents: SourceDocument[]
  diagnostics: CoreDiagnostic[]
}

export type CoreDiagnostic = {
  uriString: string
  range?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
  severity?: 1 | 2 | 3 | 4;
  code?: number | string;
  message: string
  // TODO: more langium-like diagnostics? 
  // TODO: target?
}

export type Bundle = {
  result: CompilerResult
  // exports: ExportArtifact[] // svg, json, etc.
}

export type Project = {
  id: string
  name?: string
  componentDefinitions: ComponentDefinition[]
  components: ComponentInstance[]
  connections: ConnectionInstance[]
  drawings: Drawing[]
  groups: Group[]
  // hardwareLibraries: HardwareLibrary[]
  layouts: ProjectLayout[]
  // runtimeBindings: RuntimeBinding[]
  schematics: Schematic[]
  tags: Tag[]
  tagsets: TagSet[]
}
// custom content (like symbols and drawings) not include in a component are ignored

export type SourceDocument = {
  uri: string
  text: string
  imports: string[]
}

// --- Begin Project Types ---

export type ComponentDefinition = {
  id: string
  ref?: string
  svg?: string
  label?: string
  ports: Port[]
  // isBuiltin?: boolean // include builtin status/version?
}

export type ComponentInstance = {
  id: string
  type: string
  name: string
  tags: string[]
  hardware: string[]
}

export type ConnectionInstance = {
  id: string
  name: string
  from: string
  fromSubId: string
  to: string
  toSubId: string
  isDirectConnection: boolean // no wire or tubing
  isNamedConnection: boolean // has a name
}

export type Group = {
  id: string
  name?: string
  connectionIds: string[]
}

export type Port = {
  id: string
  x: number
  y: number
  rot: number
}

export type ProjectLayout = {
  id: string
  name: string
  componentPositions: ComponentLayout[]
  connectionPaths: ConnectionPath[]
}

export type ComponentLayout = {
  componentId: string
  x: number // x position in "units"
  y: number // y position in "units"
  z?: number // use for layering for now
  positionRelativeToId?: string // part or none
  rot: number // along z in degrees
  mirror?: boolean // mirror along y-axis
}

export type Segment = {
  deg?: number // rotation in degrees
  length?: number // in "units"
  auto?: boolean // auto route this segment
}

export type ConnectionPath = {
	connectionId: string
	segments: Segment[]
}

export type Schematic = {
  id: string
  components: string[]
  groups: string[]
  useLayouts: string[]
  // layoutOverrides: SchematicLayout[]
  drawing: string
}

export type Drawing = {
  id: string
  width: number
  height: number
  scale: number
  titleBlock?: {
    title: string
    author: string
    date: string
    // revision: string
    // organization: string
  }
}

export type Tag = {
  id: string
  name: string
  color: string
}

export type TagSet = {
  id: string
  name: string
  tags: string[]
}
