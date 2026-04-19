import { builtinKassa, createKassaServices } from "@kassa/lang";
import type { CompilerResult, ComponentInstance, ConnectionInstance, Project } from "@kassa/core";
import { ComponentNameProperty, isConnectionStatement, Model } from "@kassa/lang/ast";
import { EmptyFileSystem, URI, LangiumDocument } from "langium";

export async function compileProjectFromMemory(
  entryId: string,
  readFile: (id: string) => string | undefined
): Promise<CompilerResult> {
  const services = createKassaServices(EmptyFileSystem);

  const factory = services.shared.workspace.LangiumDocumentFactory;
  const langiumDocs = services.shared.workspace.LangiumDocuments;
  const builder = services.shared.workspace.DocumentBuilder;

  const allDocs: LangiumDocument<Model>[] = [];

  const entryUri = URI.parse(entryId);
  // TODO: better error handling
  const entryText = readFile(entryId);
  if (!entryText) {
    return { version: "0.0.1", projects: [], documents: [], diagnostics: [{ severity: "error", message: `Entry file not found: ${entryId}` }] };
  }

  // Create typed document (and run parser)
  const entryDoc: LangiumDocument<Model> = factory.fromString<Model>(entryText, entryUri);
  langiumDocs.addDocument(entryDoc);
  allDocs.push(entryDoc);

  // Don't forget builtin library!
  const builtinUri = URI.parse('builtin:///library.kassa');
  const builtinText = builtinKassa; // however you store this
  const builtinDoc = factory.fromString<Model>(builtinText, builtinUri);
  langiumDocs.addDocument(builtinDoc);
  allDocs.push(builtinDoc);

  // Build lifecycle and run validation (TODO)
  await builder.build(allDocs, { validation: true });

  // "Lower" to IR
  return compileDocuments(allDocs);
}

// Handle new component instances.
// TODO: Actually define this.
export function defineComponentInstance(project: Project, id: string, type: string, name?: string) {
  const component: ComponentInstance = {
    id,
    type,
    name: name ?? id,
    tags: [],
    hardware: []
  }
  project.components.push(component);
}

export function compileDocuments(docs: LangiumDocument<Model>[]): CompilerResult {
  const diagnostics = docs.flatMap(d => d.diagnostics ?? []);
  const models = docs.map(d => d.parseResult.value); // typed Model
  const model = models[0]; // TODO: handle multiple models

  const defaultProject: Project = {
    id: "default-project",
    name: "Default Project",
    componentDefinitions: [],
    components: [],
    connections: [],
    drawings: [],
    groups: [],
    layouts: [],
    schematics: [],
    tags: [],
    tagsets: []
  }

  for (const statement of model.statements) {
    if (isConnectionStatement(statement)) {
      let sourceOutlet: string | undefined;
      let sourceName = "";
      if (statement.start.define) {
        sourceOutlet = statement.start.define.outlet?.portName.ref?.name;
        sourceName = statement.start.define.componentId.name;
        // Add component to project.
        const nameProperty = statement.start.define.componentId.value?.properties.find((p): p is ComponentNameProperty => p.$type === "ComponentNameProperty");
        const sourceComponent: ComponentInstance = {
          id: statement.start.define.componentId.name,
          type: statement.start.define.componentId.componentType.ref?.name ?? "unknown",
          name: nameProperty?.value ?? statement.start.define.componentId.name,
          tags: [],
          hardware: []
        }
        // TODO: don't allow duplicates?
        defaultProject.components.push(sourceComponent);
      }
      if (statement.start.ref) {
        sourceOutlet = statement.start.ref.outlet?.portName.ref?.name;
        // TODO: probably error if unknown.
        sourceName = statement.start.ref.componentIdRef.ref?.name ?? "unknown";
      }
      for (const connection of statement.connections) {
        let isDirectConnection = false;
        let connectionSymbol = "-->";
        let target = connection.standard?.target;
        if (connection.direct) {
          isDirectConnection = true;
          connectionSymbol = "->"
          target = connection.direct.target;
        }
        if (!target) continue;
        let maybeInlet: string | undefined;
        let targetName: string;
        if (target.define) {
          maybeInlet = target.define.inlet?.portName.ref?.name;
          targetName = target.define.componentId.name;
          // Add component to project.
          const nameProperty = target.define.componentId.value?.properties.find((p): p is ComponentNameProperty => p.$type === "ComponentNameProperty");
          const targetComponent: ComponentInstance = {
            id: target.define.componentId.name,
            type: target.define.componentId.componentType.ref?.name ?? "unknown",
            name: nameProperty?.value ?? target.define.componentId.name,
            tags: [],
            hardware: []
          }
          // TODO: don't allow duplicates?
          defaultProject.components.push(targetComponent);
          const connection: ConnectionInstance = {
            id: `connection-${sourceName}-${sourceOutlet ?? "auto"}-to-${targetName}-${maybeInlet ?? "auto"}`,
            name: `${sourceName} ${sourceOutlet ? `[${sourceOutlet}] ` : ""}${connectionSymbol} ${maybeInlet ? `[${maybeInlet}] ` : ""}${targetName}`,
            from: sourceName,
            fromSubId: sourceOutlet ?? "",
            to: targetName,
            toSubId: maybeInlet ?? "",
            isDirectConnection
          }
          // TODO: allow duplicates (or not?)
          defaultProject.connections.push(connection);
          // console.log(`def ${connection.name}`)
          sourceOutlet = target.define.outlet?.portName.ref?.name;
          sourceName = targetName;
        }
        if (target.ref) {
          maybeInlet = target.ref.inlet?.portName.ref?.name;
          // TODO: probably error if unknown.
          targetName = target.ref.componentIdRef.ref?.name ?? "unknown";
          const connection: ConnectionInstance = {
            id: `connection-${sourceName}-${sourceOutlet ?? "auto"}-to-${targetName}-${maybeInlet ?? "auto"}`,
            name: `${sourceName} ${sourceOutlet ? `[${sourceOutlet}] ` : ""}${connectionSymbol} ${maybeInlet ? `[${maybeInlet}] ` : ""}${targetName}`,
            from: sourceName,
            fromSubId: sourceOutlet ?? "",
            to: targetName,
            toSubId: maybeInlet ?? "",
            isDirectConnection
          }
          // TODO: allow duplicates (or not?)
          defaultProject.connections.push(connection);
          console.log(`ref ${sourceName} ${sourceOutlet ? `[${sourceOutlet}] ` : ""}${connectionSymbol} ${maybeInlet ? `[${maybeInlet}] ` : ""}${targetName}`)
          sourceOutlet = target.ref.outlet?.portName.ref?.name;
          // TODO: probably error if unknown.
          sourceName = targetName ?? "unknown";
        }
      }
    }
  }

  // TODO: lower models -> IR
  return {
    version: "0.0.1",
    projects: [defaultProject],
    documents: docs.map(d => ({
      uri: d.uri.toString(),
      text: "<TODO>", // Hiding text for development d.textDocument.getText(),
      imports: [] // TODO
    })),
    diagnostics: []
  };
}
