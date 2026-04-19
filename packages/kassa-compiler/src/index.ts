import { builtinKassa, createKassaServices } from "@kassa/lang";
import type { CompilerResult, ComponentInstance, ComponentLayout, ConnectionInstance, ConnectionPath, Project, ProjectLayout } from "@kassa/core";
import { ComponentDeclaration, ComponentNameProperty, DrawingHeight, DrawingScale, DrawingTitleBlock, DrawingWidth, isComponentDeclaration, isConnectionStatement, isDrawingStatement, isLayoutElement, isLayoutGroup, isSymbolStatement, isTagDeclaration, isTagDeclarations, isTagSetDeclaration, LayoutElement, Model, OptionsArray, TagArray, TagColorProperty, TagNameProperty, TagSetNameProperty, TagSetTagsProperty, TitleBlockAuthor, TitleBlockDate, TitleBlockTitle, XPos } from "@kassa/lang/ast";
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
export function defineComponentInstance(componentId: ComponentDeclaration): ComponentInstance {
  const nameProperty = componentId.value?.properties.find((p): p is ComponentNameProperty => p.$type === "ComponentNameProperty");
  return {
    id: componentId.name,
    type: componentId.componentType.ref?.name ?? "unknown",
    name: nameProperty?.value ?? componentId.name,
    tags: componentId.value?.properties.filter((p): p is TagArray => p.$type === "TagArray").flatMap(p => p.elements.map(t => t.ref.ref?.name ?? "unknown")) ?? [],
    hardware: componentId.value?.properties.find((p): p is OptionsArray => p.$type === "OptionsArray")?.option.map(o => `${o.source}.${o.key}`) ?? []
  }
}

// Generate connection id.
export function defineConnectionId(sourceName: string, sourceOutlet: string | undefined, targetName: string, targetInlet: string | undefined): string {
  return `connection-${sourceName}.${sourceOutlet ?? "auto"}-to-${targetName}.${targetInlet ?? "auto"}`;
}

export function parseLayoutElement(element: LayoutElement, layoutGroup: ProjectLayout) {
  if (element.$type === "LayoutComponent") {
    const componentLayout: ComponentLayout = {
      componentId: element.componentId.ref?.name ?? "unknown",
      x: Number(element.block?.properties.find((p): p is XPos => p.$type === "XPos")?.value.value ?? 0),
      y: Number(element.block?.properties.find((p): p is XPos => p.$type === "YPos")?.value.value ?? 0),
      rot: Number(element.block?.properties.find((p): p is XPos => p.$type === "Rot")?.value.value ?? 0),
      mirror: element.block?.properties.some(p => p.$type === "Mirror") ?? false
    }
    layoutGroup.componentPositions.push(componentLayout);
  } else {
    let connectionId = "";
    if (element.$type === "RouteNamedConnection") {
      connectionId = element.namedConnection.ref?.name ?? "unknown";
    } else {
      connectionId = defineConnectionId(
        element.fromComponentId.ref?.name ?? "unknown",
        element.outlet?.portName.ref?.name,
        element.toComponentId.ref?.name ?? "unknown",
        element.inlet?.portName.ref?.name
      );
    }
    const connectionPath: ConnectionPath = {
      connectionId: connectionId,
      segments: element.array.elements.map(element => {
        if (element.$type === "Direction") {
          const direction = element.dir; // "out", "left", "right", "bend"
          const amount = Number(element.amount.value);
          if (direction === "bend") {
            return { deg: amount };
          } else if (direction === "left") {
            return { deg: -90, length: amount };
          } else if (direction === "right") {
            return { deg: 90, length: amount };
          } else {
            return { length: amount };
          }
        } else {
          return { auto: true };
        }
      })
    }
    layoutGroup.connectionPaths.push(connectionPath);
  }
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

  const defaultLayoutGroup: ProjectLayout = {
    id: "default-layout-group",
    name: "Default Layout Group",
    componentPositions: [],
    connectionPaths: []
  }

  for (const statement of model.statements) {
    if (isComponentDeclaration(statement)) {
      const component = defineComponentInstance(statement);
      // TODO: don't allow duplicates?
      defaultProject.components.push(component);
    } else if (isConnectionStatement(statement)) {
      let sourceOutlet: string | undefined;
      let sourceName = "";
      if (statement.start.define) {
        sourceOutlet = statement.start.define.outlet?.portName.ref?.name;
        sourceName = statement.start.define.componentId.name;
        // Add component to project.
        const sourceComponent: ComponentInstance = defineComponentInstance(statement.start.define.componentId);
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
        let namedConnection: string | undefined;
        let target = connection.standard?.target;
        if (connection.direct) {
          isDirectConnection = true;
          connectionSymbol = "->"
          target = connection.direct.target;
          if (connection.direct.$type === "DirectConnectionToConnection") {
            namedConnection = connection.direct.namedConnection.ref?.name;
          }
        }
        if (!target) continue;
        let maybeInlet: string | undefined;
        let targetName: string;
        if (target.define) {
          maybeInlet = target.define.inlet?.portName.ref?.name;
          targetName = target.define.componentId.name;
          // Add component to project.
          const targetComponent: ComponentInstance = defineComponentInstance(target.define.componentId);
          // TODO: don't allow duplicates?
          defaultProject.components.push(targetComponent);
          const connection: ConnectionInstance = {
            id: namedConnection ?? defineConnectionId(sourceName, sourceOutlet, targetName, maybeInlet),
            name: namedConnection ?? `${sourceName} ${sourceOutlet ? `[${sourceOutlet}] ` : ""}${connectionSymbol} ${maybeInlet ? `[${maybeInlet}] ` : ""}${targetName}`,
            from: sourceName,
            fromSubId: sourceOutlet ?? "",
            to: targetName,
            toSubId: maybeInlet ?? "",
            isDirectConnection,
            isNamedConnection: !!namedConnection
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
            id: namedConnection ?? defineConnectionId(sourceName, sourceOutlet, targetName, maybeInlet),
            name: namedConnection ?? `${sourceName} ${sourceOutlet ? `[${sourceOutlet}] ` : ""}${connectionSymbol} ${maybeInlet ? `[${maybeInlet}] ` : ""}${targetName}`,
            from: sourceName,
            fromSubId: sourceOutlet ?? "",
            to: targetName,
            toSubId: maybeInlet ?? "",
            isDirectConnection,
            isNamedConnection: !!namedConnection
          }
          // TODO: allow duplicates (or not?)
          defaultProject.connections.push(connection);
          // console.log(`ref ${sourceName} ${sourceOutlet ? `[${sourceOutlet}] ` : ""}${connectionSymbol} ${maybeInlet ? `[${maybeInlet}] ` : ""}${targetName}`)
          sourceOutlet = target.ref.outlet?.portName.ref?.name;
          // TODO: probably error if unknown.
          sourceName = targetName ?? "unknown";
        }
      }
    } else if (isTagDeclaration(statement)) {
      const color = statement.block?.properties.find((p): p is TagColorProperty => p.$type === "TagColorProperty")?.value;
      let colorString = "default";
      if (color) {
        if (color.$type === "BasicColor") {
          colorString = color.name;
        } else if (color.$type === "HexColor") {
          colorString = color.value;
        }
      }
      const tag = {
        id: statement.name,
        name: statement.block?.properties.find((p): p is TagNameProperty => p.$type === "TagNameProperty")?.value ?? statement.name,
        color: colorString
      }
      defaultProject.tags.push(tag);
    } else if (isTagSetDeclaration(statement)) {
      const tagSet = {
        id: statement.name,
        name: statement.block?.properties.find((p): p is TagSetNameProperty => p.$type === "TagSetNameProperty")?.value ?? statement.name,
        tags: statement.block?.properties.filter((p): p is TagArray => p.$type === "TagArray").flatMap(p => p.elements.map(t => t.ref.ref?.name ?? "unknown")) ?? []
      }
      defaultProject.tagsets.push(tagSet);
    } else if (isLayoutElement(statement)) {
      // TODO: Avoid double parsing LayoutElements if also in isLayoutGroup below?
      parseLayoutElement(statement, defaultLayoutGroup);
    } else if (isLayoutGroup(statement)) {
      const layoutGroup: ProjectLayout = {
        id: statement.name ?? "unnamed-layout", // TODO: better id generation, avoid duplicates?
        name: statement.name ?? "Unnamed Layout",
        componentPositions: [],
        connectionPaths: []
      }
      statement.block.layoutElements.forEach(element => {
        parseLayoutElement(element, layoutGroup);
      })
      defaultProject.layouts.push(layoutGroup);
    } else if (isDrawingStatement(statement)) {
      const height = Number(statement.block?.properties.find((p): p is DrawingHeight => p.$type === "DrawingHeight")?.value.value ?? 11);
      const width = Number(statement.block?.properties.find((p): p is DrawingWidth => p.$type === "DrawingWidth")?.value.value ?? 8.5);
      const scale = Number(statement.block?.properties.find((p): p is DrawingScale => p.$type === "DrawingScale")?.value.value ?? 1);
      const titleBlock = statement.block?.properties.find((p): p is DrawingTitleBlock => p.$type === "DrawingTitleBlock")?.value;
      const drawing = {
        id: statement.name ?? "unnamed-drawing", // TODO: better id generation, avoid duplicates?
        height,
        width,
        scale,
        titleBlock: titleBlock ? { 
          title: titleBlock.properties.find((p): p is TitleBlockTitle => p.$type === "TitleBlockTitle")?.value.value ?? "",
          author: titleBlock.properties.find((p): p is TitleBlockAuthor => p.$type === "TitleBlockAuthor")?.value.value ?? "",
          date: titleBlock.properties.find((p): p is TitleBlockDate => p.$type === "TitleBlockDate")?.value.value ?? ""
        } : undefined
      }
      defaultProject.drawings.push(drawing);
    } else if (isSymbolStatement(statement)) {
      // TODO
    }
  }

  defaultProject.layouts.push(defaultLayoutGroup);

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
