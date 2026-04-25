import { builtinKassa, createKassaServices } from "@kassa/lang";
import type {
  CompilerResult,
  ComponentDefinition,
  ComponentInstance,
  ComponentPlacement,
  ConnectionInstance,
  ConnectionRoute,
  CoreDiagnostic,
  DrawingTemplate,
  Layout,
  Port,
  Project,
  Schematic,
  UsedLayout,
} from "@kassa/core";
import {
  ComponentDeclaration,
  ComponentNameProperty,
  ConnectionStatement,
  DrawingHeight,
  DrawingScale,
  DrawingTitleBlock,
  DrawingWidth,
  isComponentDeclaration,
  isGroup,
  isConnectionStatement,
  isDrawingTemplate,
  isLayoutElement,
  isLayout,
  isSymbolStatement,
  isTagDeclaration,
  isTagDeclarations,
  isTagSetDeclaration,
  LayoutElement,
  Model,
  HardwareOptionsArray,
  TagArray,
  TagColorProperty,
  TagNameProperty,
  TagSetNameProperty,
  TagSetTagsProperty,
  TitleBlockAuthor,
  TitleBlockDate,
  TitleBlockTitle,
  XPos,
  isSchematicStatement,
} from "@kassa/lang/ast";
import { EmptyFileSystem, URI, LangiumDocument } from "langium";

// TODO: make compiler version package aware?
const COMPILER_VERSION = "0.0.1";

type FileSystemHost = {
  readFile: (id: string) => string | undefined;
  resolveImport: (from: string, importPath: string) => string;
};

type CompilerContext = {
  components: ComponentInstance[];
  connections: ConnectionInstance[];

  componentById: Map<string, ComponentInstance>;
  connectionById: Map<string, ConnectionInstance>;
};

function addComponent(ctx: CompilerContext, component: ComponentInstance) {
  if (ctx.componentById.has(component.id)) {
    return false;
  }

  ctx.components.push(component);
  ctx.componentById.set(component.id, component);
  return true
}

function addConnection(ctx: CompilerContext, connection: ConnectionInstance) {
  if (ctx.connectionById.has(connection.id)) {
    return false;
  }

  ctx.connections.push(connection);
  ctx.connectionById.set(connection.id, connection);
  return true
}

export async function compileProjectFromMemory(
  entryId: string,
  host: FileSystemHost,
): Promise<CompilerResult> {
  const services = createKassaServices(EmptyFileSystem);

  const factory = services.shared.workspace.LangiumDocumentFactory;
  const langiumDocs = services.shared.workspace.LangiumDocuments;
  const builder = services.shared.workspace.DocumentBuilder;

  const allDocs: LangiumDocument<Model>[] = [];

  const filepath = host.resolveImport(entryId, entryId);
  const entryUri = URI.parse(filepath);
  // TODO: better error handling
  const entryText = host.readFile(filepath);
  if (!entryText) {
    return {
      version: COMPILER_VERSION,
      workspace: {
        id: "",
        projects: [],
      },
      diagnostics: [
        {
          severity: 1,
          message: `Entry file not found: ${entryId}`,
          uriString: filepath,
        },
      ],
    };
  }

  // Create typed document (and run parser)
  const entryDoc: LangiumDocument<Model> = factory.fromString<Model>(
    entryText,
    entryUri,
  );
  langiumDocs.addDocument(entryDoc);
  allDocs.push(entryDoc);

  // Track URIs we have added so we don't add duplicates when handling imports.
  const addedUris = new Set<string>();
  addedUris.add(entryUri.toString());

  // Get all imports and create documents for them as well.
  // TODO: handle recursion, circular imports, missing files, etc.
  const model = entryDoc.parseResult.value;
  for (const importedFile of model.imports) {
    const filepath = host.resolveImport(entryId, importedFile.path);
    const importedUri = URI.parse(filepath);
    const importedText = host.readFile(filepath);
    if (importedText && !addedUris.has(importedUri.toString())) {
      const importedDoc = factory.fromString<Model>(importedText, importedUri);
      langiumDocs.addDocument(importedDoc);
      allDocs.push(importedDoc);
      addedUris.add(importedUri.toString());
    }
  }

  // Don't forget builtin library!
  const builtinUri = URI.parse("builtin:///library.kassa");
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
export function defineComponentInstance(
  componentId: ComponentDeclaration,
): ComponentInstance {
  const nameProperty = componentId.value?.properties.find(
    (p): p is ComponentNameProperty => p.$type === "ComponentNameProperty",
  );
  return {
    id: componentId.name,
    definitionId: componentId.componentType.ref?.name ?? "unknown",
    name: nameProperty?.value ?? componentId.name,
    tagIds:
      componentId.value?.properties
        .filter((p): p is TagArray => p.$type === "TagArray")
        .flatMap((p) => p.elements.map((t) => t.ref.ref?.name ?? "unknown")) ??
      [],
    hardwareRefs:
      componentId.value?.properties
        .find(
          (p): p is HardwareOptionsArray => p.$type === "HardwareOptionsArray",
        )
        ?.option.map((o) => `${o.source}.${o.key}`) ?? [],
    groupIds: []
  };
}

// Generate connection id.
// TODO: Use the one in lang? Or move to core?
export function defineConnectionId(
  sourceName: string,
  sourceOutlet: string | undefined,
  targetName: string,
  targetInlet: string | undefined,
): string {
  return `connection-${sourceName}.${sourceOutlet ?? "auto"}-to-${targetName}.${targetInlet ?? "auto"}`;
}

export function parseLayoutElement(
  element: LayoutElement,
  layout: Layout,
) {
  if (element.$type === "LayoutComponent") {
    const componentLayout: ComponentPlacement = {
      componentId: element.componentId.ref?.name ?? "unknown",
      x: Number(
        element.block?.properties.find((p): p is XPos => p.$type === "XPos")
          ?.value.value ?? 0,
      ),
      y: Number(
        element.block?.properties.find((p): p is XPos => p.$type === "YPos")
          ?.value.value ?? 0,
      ),
      rot: Number(
        element.block?.properties.find((p): p is XPos => p.$type === "Rot")
          ?.value.value ?? 0,
      ),
      mirror:
        element.block?.properties.some((p) => p.$type === "Mirror") ?? false,
    };
    layout.placements.push(componentLayout);
  } else {
    let connectionId = "";
    if (element.$type === "RouteNamedConnection") {
      connectionId = element.namedConnection.ref?.name ?? "unknown";
    } else {
      connectionId = defineConnectionId(
        element.fromComponentId.ref?.name ?? "unknown",
        element.outlet?.portName.ref?.name,
        element.toComponentId.ref?.name ?? "unknown",
        element.inlet?.portName.ref?.name,
      );
    }
    const connectionPath: ConnectionRoute = {
      connectionId: connectionId,
      segments: element.array.elements.map((element) => {
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
      }),
    };
    layout.routes.push(connectionPath);
  }
}

// function componentInstancesToId(components: ComponentInstance[]) {
//   return components.map(comp => comp.id)
// } 

// function connectionInstancesToId(connections: ConnectionInstance[]) {
//   return connections.map(conn => conn.id)
// }

type ConnectionStatementResult = {
  componentIds: Set<string>,
  connectionIds: Set<string>
}

export function parseConnectionStatement(
  statement: ConnectionStatement,
  context: CompilerContext
): ConnectionStatementResult {
  const result: ConnectionStatementResult = {
    componentIds: new Set(),
    connectionIds: new Set()
  }
  let sourceOutlet: string | undefined;
  let sourceName = "";
  if (statement.start.define) {
    sourceOutlet = statement.start.define.outlet?.portName.ref?.name;
    sourceName = statement.start.define.componentId.name;
    // Add component to project.
    const sourceComponent: ComponentInstance = defineComponentInstance(
      statement.start.define.componentId,
    );
    // TODO: error/warn on duplicates
    addComponent(context, sourceComponent)
    result.componentIds.add(sourceComponent.id)
  }
  if (statement.start.ref) {
    sourceOutlet = statement.start.ref.outlet?.portName.ref?.name;
    // TODO: probably error if unknown.
    sourceName = statement.start.ref.componentIdRef.ref?.name ?? "unknown";
    result.componentIds.add(sourceName)
  }
  for (const connection of statement.connections) {
    let isDirectConnection = false;
    let connectionSymbol = "-->";
    let namedConnection: string | undefined;
    let target = connection.standard?.target;
    if (connection.direct) {
      isDirectConnection = true;
      connectionSymbol = "->";
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
      const targetComponent: ComponentInstance = defineComponentInstance(
        target.define.componentId,
      );
      // TODO: error/warn on duplicates
      addComponent(context, targetComponent)
      result.componentIds.add(targetComponent.id)
      const connection: ConnectionInstance = {
        id:
          namedConnection ??
          defineConnectionId(sourceName, sourceOutlet, targetName, maybeInlet),
        name:
          namedConnection ??
          `${sourceName} ${sourceOutlet ? `[${sourceOutlet}] ` : ""}${connectionSymbol} ${maybeInlet ? `[${maybeInlet}] ` : ""}${targetName}`,
        from: {
          componentId: sourceName,
          portId: sourceOutlet ?? ""
        },
        to: {
          componentId: targetName,
          portId: maybeInlet ?? ""
        },
        isDirectConnection,
        groupIds: [],
        tagIds: []
        // isNamedConnection: !!namedConnection,
      };
      // TODO: error/warn on duplicates (or not?)
      addConnection(context, connection)
      result.connectionIds.add(connection.id)
      // console.log(`def ${connection.name}`)
      sourceOutlet = target.define.outlet?.portName.ref?.name;
      sourceName = targetName;
    }
    if (target.ref) {
      maybeInlet = target.ref.inlet?.portName.ref?.name;
      // TODO: probably error if unknown.
      targetName = target.ref.componentIdRef.ref?.name ?? "unknown";
      result.componentIds.add(targetName)
      const connection: ConnectionInstance = {
        id:
          namedConnection ??
          defineConnectionId(sourceName, sourceOutlet, targetName, maybeInlet),
        name:
          namedConnection ??
          `${sourceName} ${sourceOutlet ? `[${sourceOutlet}] ` : ""}${connectionSymbol} ${maybeInlet ? `[${maybeInlet}] ` : ""}${targetName}`,
        from: {
          componentId: sourceName,
          portId: sourceOutlet ?? "",
        },
        to: {
          componentId: targetName,
          portId: maybeInlet ?? "",
        },
        isDirectConnection,
        groupIds: [],
        tagIds: []
        // isNamedConnection: !!namedConnection,
      };
      // TODO: error/warn on duplicates (or not?)
      addConnection(context, connection)
      result.connectionIds.add(connection.id)
      // console.log(`ref ${sourceName} ${sourceOutlet ? `[${sourceOutlet}] ` : ""}${connectionSymbol} ${maybeInlet ? `[${maybeInlet}] ` : ""}${targetName}`)

      // Prepare for NEXT connection ("from")
      sourceOutlet = target.ref.outlet?.portName.ref?.name;
      // TODO: probably error if unknown.
      sourceName = targetName ?? "unknown";
    }
  }
  return result
}

export function compileDocuments(
  docs: LangiumDocument<Model>[],
): CompilerResult {
  // const models = docs.map(d => d.parseResult.value); // typed Model
  // console.log(`Compiling ${models.length} models: ${models.map(m => m.$document?.uri).join(", ")}`);

  const context: CompilerContext = {
    components: [],
    connections: [],
    componentById: new Map(),
    connectionById: new Map()
  }

  const defaultProject: Project = {
    id: "default-project",
    name: "Default Project",
    documents: [],
    componentDefinitions: [],
    componentInstances: [],
    connectionInstances: [],
    drawingTemplates: [],
    groups: [],
    layouts: [],
    schematics: [],
    tags: [],
    tagSets: [],
  };

  const defaultLayoutGroup: Layout = {
    id: "default-layout-group",
    name: "Default Layout Group",
    placements: [],
    routes: [],
    usedLayouts: []
  };

  const builtinUri = URI.parse("builtin:///library.kassa");
  const coreDiagnostics: CoreDiagnostic[] = [];
  for (const doc of docs) {
    const model = doc.parseResult.value;
    for (const diag of doc.diagnostics ?? []) {
      coreDiagnostics.push({
        uriString: doc.uri.toString(),
        severity: diag.severity,
        code: diag.code,
        message: diag.message,
        range: diag.range
          ? {
              // Langium's range is 0-based, but most editors expect 1-based, so we add 1 here for better editor integration.
              start: {
                line: diag.range.start.line + 1,
                column: diag.range.start.character,
              },
              end: {
                line: diag.range.end.line + 1,
                column: diag.range.end.character,
              },
            }
          : undefined,
      });
    }

    // console.log(`Compiling model with ${model.statements.length} statements and ${model.imports.length} imports.`);
    let isBuiltin = false;
    if (model.$document?.uri.toString() === builtinUri.toString()) {
      isBuiltin = true;
      // console.log(`Model is builtin library.`);
    }

    for (const statement of model.statements) {
      if (isComponentDeclaration(statement)) {
        const component = defineComponentInstance(statement);
        // TODO: error/warn on duplicates
        addComponent(context, component)
      } else if (isConnectionStatement(statement)) {
        parseConnectionStatement(statement, context);
      } else if (isTagDeclaration(statement)) {
        const color = statement.block?.properties.find(
          (p): p is TagColorProperty => p.$type === "TagColorProperty",
        )?.value;
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
          name:
            statement.block?.properties.find(
              (p): p is TagNameProperty => p.$type === "TagNameProperty",
            )?.value ?? statement.name,
          color: colorString,
        };
        // TODO: handle duplicates
        defaultProject.tags.push(tag);
      } else if (isTagSetDeclaration(statement)) {
        const tagSet = {
          id: statement.name,
          name:
            statement.block?.properties.find(
              (p): p is TagSetNameProperty => p.$type === "TagSetNameProperty",
            )?.value ?? statement.name,
          tagIds:
            statement.block?.properties
              .filter((p): p is TagArray => p.$type === "TagArray")
              .flatMap((p) =>
                p.elements.map((t) => t.ref.ref?.name ?? "unknown"),
              ) ?? [],
        };
        // TODO: handle duplicates
        defaultProject.tagSets.push(tagSet);
      } else if (isLayoutElement(statement)) {
        // TODO: Avoid double parsing LayoutElements if also in isLayout below?
        // parseLayoutElement(statement, defaultLayoutGroup);
      } else if (isLayout(statement)) {
        const layoutGroup: Layout = {
          id: statement.name ?? "unnamed-layout", // TODO: better id generation, avoid duplicates?
          name: statement.name ?? "Unnamed Layout",
          placements: [],
          routes: [],
          usedLayouts: [],
        };
        statement.block.layoutElements.forEach((element) => {
          parseLayoutElement(element, layoutGroup);
        });
        defaultProject.layouts.push(layoutGroup);
      } else if (isDrawingTemplate(statement)) {
        const drawing: DrawingTemplate = {
          id: "",
          width: 0,
          height: 0,
          scale: 0
        }
        for (const prop of statement.block?.properties ?? []) {
          if (prop.$type === "DrawingHeight") {
            drawing.height = Number(prop.value.value)
          } else if (prop.$type === "DrawingScale") {
            drawing.scale = Number(prop.value.value)
          } else if (prop.$type === "DrawingWidth") {
            drawing.width = Number(prop.value.value)
          } else if (prop.$type === "DrawingTitleBlock") {
            drawing.titleBlock = {
              title: "",
              author: "",
              date: ""
            };
            const titleBlock = prop.value
            for (const titleProp of titleBlock.properties) {
              if (titleProp.$type === "TitleBlockTitle") {
                drawing.titleBlock.title = titleProp.value.value
              } else if (titleProp.$type === "TitleBlockDate") {
                drawing.titleBlock.date = titleProp.value.value
              } else if (titleProp.$type === "TitleBlockAuthor") {
                drawing.titleBlock.author = titleProp.value.value
              }
            }
          }
        }
        defaultProject.drawingTemplates.push(drawing);
      } else if (isSymbolStatement(statement)) {
        if (isBuiltin) continue; // TODO: maybe include builtin
        let svg: string | undefined;
        let labelLocation: string | undefined;
        const ports: Port[] = [];
        for (const symbolProp of statement.block?.properties || []) {
          if (symbolProp.$type === "PortElement") {
            const port: Port = {
              id: symbolProp.name,
              x: 0,
              y: 0,
              rot: 0,
            };
            for (const portProp of symbolProp.block.properties) {
              const value = Number(portProp.value.value);
              if (portProp.$type === "XPos") {
                port["x"] = value;
              } else if (portProp.$type === "YPos") {
                port["y"] = value;
              } else if (portProp.$type === "Rot") {
                port["rot"] = value;
              } else {
                // TODO: error handling for unknown property?
              }
            }
            ports.push(port);
          } else if (symbolProp.$type === "LabelLocation") {
            labelLocation = symbolProp.location;
          } else if (symbolProp.$type === "SvgRef") {
            svg = symbolProp.key.value;
          } else {
            // TODO: error handling for unknown property?
          }
        }
        const symbol: ComponentDefinition = {
          id: statement.name,
          extendsId: statement.base?.symbolInput.ref?.name,
          ports,
          svg,
          label: labelLocation,
          // TODO: Indicate builtin status.
        };
        defaultProject.componentDefinitions.push(symbol);
      } else if (isGroup(statement)) {
        // TODO: Clean up and prevent duplicates here.
        const componentIds: string[] = [];
        const connectionIds: string[] = [];
        const tagIds: string[] = [];
        let groupName = "";
        for (const groupStatement of statement.block.statements) {
          if (groupStatement.$type === "ConnectionStatement") {
            const result = parseConnectionStatement(groupStatement, context);
            componentIds.push(...result.componentIds);
            connectionIds.push(...result.connectionIds);
          } else if (groupStatement.$type === "ComponentDeclaration") {
            componentIds.push(groupStatement.name)
          } else if (groupStatement.$type === "GroupName") {
            groupName = groupStatement.name
          } else if (groupStatement.$type === "TagArray") {
            for (const tag of groupStatement.elements) {
              tagIds.push(tag.ref.ref?.name ?? "")
            }
          }
        }
        const group = {
          id: statement.name,
          name: groupName,
          componentIds,
          connectionIds,
          tagIds
        };
        defaultProject.groups.push(group);
      } else if (isSchematicStatement(statement)) {
        const schematic: Schematic = {
          id: statement.name,
          name: statement.name,
          sourceDocumentId: "", // TODO
          usedLayouts: [],
          layout: {
            placements: [],
            routes: []
          },
          drawing: {
            templateId: "",
          }
        }

        for (const option of statement.block.options) {
          if (option.$type === "LayoutRef") {
            const layoutObject: UsedLayout = {
              layoutId: "",
              x: 0,
              y: 0
            }
            const layoutRef = option.layoutId.ref?.name ?? ""
            layoutObject.layoutId = layoutRef;
            for (const prop of option.block?.properties ?? []) {
              if (prop.$type === "XPos") {
                layoutObject.x = Number(prop.value.value)
              } else if (prop.$type === "YPos") {
                layoutObject.y = Number(prop.value.value)
              } else if (prop.$type === "Rot") {
                layoutObject.rot = Number(prop.value.value)
              } else {
                // TODO: error handling for unknown property?
              }
            }
            schematic.usedLayouts.push(layoutObject)
          } else if (option.$type === "DrawingRef") {
            schematic.drawing.templateId = option.ref.ref?.name ?? ""
            if (!option.block) continue
            schematic.drawing.fields = {};
            const titleBlockProp = option.block.value
            for (const titleProp of titleBlockProp?.properties ?? []) {
              if (titleProp.$type === "TitleBlockTitle") {
                schematic.drawing.fields['title'] = titleProp.value.value
              } else if (titleProp.$type === "TitleBlockDate") {
                schematic.drawing.fields['date'] = titleProp.value.value
              } else if (titleProp.$type === "TitleBlockAuthor") {
                schematic.drawing.fields['author'] = titleProp.value.value
              }
            }
          } else if (option.$type === "GroupRefArray") {
            const groupIds: string[] = [];
            for (const groupRef of option.ref) {
              const groupId = groupRef.ref?.name ?? ""
              groupIds.push(groupId)
            }
            schematic.includeGroupIds?.push(...groupIds) 
          }
        }

        defaultProject.schematics.push(schematic);
      }
    }
  }

  defaultProject.componentInstances.push(...context.components)
  defaultProject.connectionInstances.push(...context.connections)
  defaultProject.layouts.push(defaultLayoutGroup);
  defaultProject.documents.map((d) => ({
    uri: d.uri.toString(),
    text: "<TODO>", // Hiding text for development d.textDocument.getText(),
    imports: [], // TODO
  }))

  // TODO: lower models -> IR
  return {
    version: COMPILER_VERSION,
    workspace: {
      id: "default-workspace",
      projects: [defaultProject]
    },
    diagnostics: coreDiagnostics,
  };
}
