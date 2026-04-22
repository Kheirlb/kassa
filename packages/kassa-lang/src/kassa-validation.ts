import {
  AstNode,
  AstUtils,
  ValidationAcceptor,
  ValidationChecks,
} from "langium";
import { KassaServices } from "./kassa-module.js";
import type { ComponentDeclaration, DrawingStatement, KassaAstType, LayoutComponent, LayoutPlaceBlock, Model, SymbolStatement, TagBlock, TagDeclaration, TagSetDeclaration } from "./ast/index.js";

export function defineConnectionId(sourceName: string, sourceOutlet: string | undefined, targetName: string, targetInlet: string | undefined): string {
  return `connection-${sourceName}.${sourceOutlet ?? "auto"}-to-${targetName}.${targetInlet ?? "auto"}`;
}

export function formatConnection(sourceName: string, sourceOutlet: string | undefined, targetName: string, targetInlet: string | undefined) {
  return `${sourceName} ${sourceOutlet ? `[${sourceOutlet}] ` : ""}--> ${targetInlet ? `[${targetName}] ` : ""}${targetName}`
}

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: KassaServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.KassaValidator;
  const checks: ValidationChecks<KassaAstType> = {
    Model: [
      validator.checkUniqueImports,
      // validator.checkUniqueComponentsInModel,
      validator.checkUniqueIdentifiers,
      validator.validateUniqueLayouts,
    ],
    SymbolStatement: [validator.validatePorts],
    ComponentDeclaration: [validator.validateComponent],
    TagDeclaration: [validator.validateTagDeclaration],
    TagSetDeclaration: [validator.validateTagSets],
    DrawingStatement: [validator.validateDrawing],
    LayoutComponent: [validator.validateLayoutComponent]
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class KassaValidator {
  checkUniqueImports(model: Model, accept: ValidationAcceptor): void {
    // Create a set of visited imports to track duplicates.
    const uniqueImports = new Set();
    model.imports.forEach((d) => {
      if (uniqueImports.has(d.path)) {
        accept("error", `'${d.path}' is imported multiple times.`, {
          node: d,
          property: "path",
        });
      }
      uniqueImports.add(d.path);
    });

    // Do the same thing for CSV imports.
    const uniqueCsvImports = new Set();
    model.csvImports.forEach((d) => {
      if (uniqueCsvImports.has(d.path)) {
        accept("error", `'${d.path}' is imported multiple times.`, {
          node: d,
          property: "path",
        });
      }
      uniqueCsvImports.add(d.path);
    });
  }

  // TODO: Handle imports/builtin?
  // TODO: Unused with checkUniqueIdentifiers. Maybe delete?
  checkUniqueComponentsInModel(model: Model, accept: ValidationAcceptor): void {
    // Create a set of visited components to track duplicates.
    const uniqueComponents = new Set<string>();
    // TODO: Figure out why seen didn't work.
    // const seen = new Map<string, ComponentDeclaration>();
    // Check all top-level component declarations in the model for duplicates.
    model.statements.forEach((s) => {
      if (s.$type === "ComponentDeclaration") {
        // const first = seen.get(s.name);
        if (uniqueComponents.has(s.name)) {
          accept("error", `Component '${s.name}' is already defined.`, {
            node: s,
            property: "name",
            // data: {
            //   firstDefinition: { node: first, property: "name" },
            //   message: `First definition of '${s.name}' is here.`,
            // },
          });
        }
        // seen.set(s.name, s);
        uniqueComponents.add(s.name);
      }
    });

    // Also search in ConnectionStatements, which can also define components.
    model.statements.forEach((s) => {
      if (s.$type === "ConnectionStatement") {
        // Checking starting define.
        if (s.start.define) {
          const componentDeclaration = s.start.define.componentId;
          const componentName = componentDeclaration.name;
          // const first = seen.get(componentName);
          if (uniqueComponents.has(componentName)) {
            accept(
              "error",
              `Component '${componentName}' is already defined.`,
              {
                node: componentDeclaration,
                property: "name",
                // data: {
                //   firstDefinition: { node: first, property: "name" },
                //   message: `First definition of '${componentName}' is here.`,
                // },
              },
            );
          }
          // seen.set(componentName, componentDeclaration);
          uniqueComponents.add(componentName);
        }
        // Now iterate over connections for more defines.
        for (const conn of s.connections) {
          const componentDefined = conn.direct
            ? conn.direct.target.define
            : conn.standard?.target.define;
          if (componentDefined) {
            const componentDeclaration = componentDefined.componentId;
            const componentName = componentDeclaration.name;
            // const first = seen.get(componentName);
            if (uniqueComponents.has(componentName)) {
              accept(
                "error",
                `Component '${componentName}' is already defined.`,
                {
                  node: componentDeclaration,
                  property: "name",
                  // data: {
                  //   firstDefinition: { node: first, property: "name" },
                  //   message: `First definition of '${componentName}' is here.`,
                  // },
                },
              );
            }
            // seen.set(componentName, componentDeclaration);
            uniqueComponents.add(componentName);
          }
        }
      }
    });
  }

  // Had some "help" with this from some big LLM or something.
  // TODO: Understand/check quality.
  checkUniqueIdentifiers(model: Model, accept: ValidationAcceptor): void {
    const seen = new Map<string, AstNode>();

    // include root if needed, plus all descendants
    for (const node of [model, ...AstUtils.streamAllContents(model)]) {
      const name = this.getDeclaredName(node);
      if (!name) continue;

      const first = seen.get(name);
      if (first) {
        accept(
          "error",
          `Identifier '${name}' is already defined in this document.`,
          {
            node,
            property: "name",
          },
        );
      } else {
        seen.set(name, node);
      }
    }
  }

  // Validate the user is only position a component once top level.
  validateUniqueLayouts(model: Model, accept: ValidationAcceptor): void {
    const seen = new Set<string>();
    for (const statement of model.statements) {
      if (statement.$type === 'LayoutComponent') {
        const name = statement.componentId.ref?.name ?? "";
        if (seen.has(name)) {
          accept(
            "error",
            `Component '${name}' is already positioned.`,
            {
              node: statement,
              property: "componentId",
            },
          );
        } else {
          seen.add(name);
        }
      } else if (statement.$type === 'RouteNamedConnection') {
        const name = statement.namedConnection.ref?.name ?? "";
        if (seen.has(name)) {
          accept(
            "error",
            `Connection '${name}' is already routed.`,
            {
              node: statement,
              property: "namedConnection",
            },
          );
        } else {
          seen.add(name);
        }
      } else if (statement.$type === 'RouteBasicConnection') {
        // This one is much tricker haha as we need to know what connections actually exist.
        // For now, we are just going to check if the same text is provided.
        // TODO: Flesh this out, especially for the "automatic" cases.
        const name = defineConnectionId(statement.fromComponentId.ref?.name ?? "", statement.outlet?.portName.ref?.name, statement.toComponentId.ref?.name ?? "", statement.inlet?.portName.ref?.name)
        const formattedName = formatConnection(statement.fromComponentId.ref?.name ?? "", statement.outlet?.portName.ref?.name, statement.toComponentId.ref?.name ?? "", statement.inlet?.portName.ref?.name)
        if (seen.has(name)) {
          accept(
            "error",
            `Connection '${formattedName}' is already routed.`,
            {
              node: statement,
            },
          );
        } else {
          seen.add(name);
        }
      } else if (statement.$type === 'LayoutGroup') {
        const groupPointer = statement.name ? ` in group '${statement.name}'` : ' in a layout';
        const seenInGroup = new Set<string>();
        // Might as well run the same checks here so we add more details for the user with respect to full model.
        // TODO: Maybe warn user about model level placement?
        for (const layout of statement.block.layoutElements) {
          if (layout.$type === 'LayoutComponent') {
            const name = layout.componentId.ref?.name ?? "";
            if (seenInGroup.has(name)) {
              accept(
                "error",
                `Component '${name}' is already positioned${groupPointer}.`,
                {
                  node: layout,
                  property: "componentId",
                },
              );
            } else {
              seenInGroup.add(name);
            }
          } else if (layout.$type === 'RouteNamedConnection') {
            const name = layout.namedConnection.ref?.name ?? "";
            if (seenInGroup.has(name)) {
              accept(
                "error",
                `Connection '${name}' is already routed${groupPointer}.`,
                {
                  node: layout,
                  property: "namedConnection",
                },
              );
            } else {
              seenInGroup.add(name);
            }
          } else if (layout.$type === 'RouteBasicConnection') {
            // This one is much tricker haha as we need to know what connections actually exist.
            // For now, we are just going to check if the same text is provided.
            // TODO: Flesh this out, especially for the "automatic" cases.
            const name = defineConnectionId(layout.fromComponentId.ref?.name ?? "", layout.outlet?.portName.ref?.name, layout.toComponentId.ref?.name ?? "", layout.inlet?.portName.ref?.name)
            const formattedName = formatConnection(layout.fromComponentId.ref?.name ?? "", layout.outlet?.portName.ref?.name, layout.toComponentId.ref?.name ?? "", layout.inlet?.portName.ref?.name)
            if (seenInGroup.has(name)) {
              accept(
                "error",
                `Connection '${formattedName}' is already routed${groupPointer}.`,
                {
                  node: layout,
                },
              );
            } else {
              seenInGroup.add(name);
            }
          }
        }
      }
    }
  }

  // Ensure that ports are defined once per symbol.
  // Overlapping "inherited" ports are okay (don't need to check references, just direct definitions).
  validatePorts(symbol: SymbolStatement, accept: ValidationAcceptor): void {
    const portNames = new Set<string>();
    if (symbol.block) {
      for (const property of symbol.block.properties) {
        if (property.$type !== "PortElement") continue;
        if (portNames.has(property.name)) {
          accept(
            "error",
            `Port '${property.name}' is already defined in symbol '${symbol.name}'.`,
            {
              node: property,
              property: "name",
            },
          );
        } else {
          portNames.add(property.name);
        }
      }
    }
  }

  validateTagSets(tagSetDeclaration: TagSetDeclaration, accept: ValidationAcceptor) {
    const seen = new Set<string>();
    for (const prop of tagSetDeclaration.block.properties ?? []) {
      this.checkDuplicateProperty(prop, seen, accept, tagSetDeclaration.name);
      if (prop.$type === "TagArray") {
        // Check for tag reference duplicatation.
        const tagNames = new Set<string>();
        for (const tagRef of prop.elements) {
          const tagName = tagRef.ref.ref?.name ?? "";
          if (tagNames.has(tagName)) {
            accept(
              "error",
              `Tag '${tagName}' is referenced multiple times in tagset '${tagSetDeclaration.name}'.`,
              {
                node: tagRef,
                property: "ref",
              },
            );
          } else {
            tagNames.add(tagName);
          }
        }
      }
    }
  }

  validateTagDeclaration(tag: TagDeclaration, accept: ValidationAcceptor): void {
    const seen = new Set<string>();
    for (const prop of tag.block?.properties ?? []) {
      this.checkDuplicateProperty(prop, seen, accept, tag.name)
    }
  }

  validateComponent(component: ComponentDeclaration, accept: ValidationAcceptor): void {
    const seen = new Set<string>();
    for (const prop of component.value?.properties ?? []) {
      this.checkDuplicateProperty(prop, seen, accept, component.name)
      if (prop.$type === "TagArray") {
        // Check for tag reference duplicatation.
        const tagNames = new Set<string>();
        for (const tagRef of prop.elements) {
          const tagName = tagRef.ref.ref?.name ?? "";
          if (tagNames.has(tagName)) {
            accept(
              "error",
              `Tag '${tagName}' is referenced multiple times in component '${component.name}'.`,
              {
                node: tagRef,
                property: "ref",
              },
            );
          } else {
            tagNames.add(tagName);
          }
        }
      }
    }

    // Check for hardware reference duplication.
  }

  validateDrawing(drawingStatment: DrawingStatement, accept: ValidationAcceptor): void {
    const seen = new Set<string>();
    for (const prop of drawingStatment.block?.properties ?? []) {
      this.checkDuplicateProperty(prop, seen, accept, drawingStatment.name)
    }
  }

  validateLayoutComponent(place: LayoutComponent, accept: ValidationAcceptor): void {
    const seen = new Set<string>();
    for (const prop of place.block.properties) {
      this.checkDuplicateProperty(prop, seen, accept, place.componentId.ref?.name ?? "?")
    }
  }

  private checkDuplicateProperty(
    prop: { $type: string },
    seen: Set<string>,
    accept: ValidationAcceptor,
    name: string
  ): void {
    if (seen.has(prop.$type)) {
      accept("error", `Property '${prop.$type}' is already defined in '${name}'.`, {
        node: prop,
        property: "name",
      });
    }
    seen.add(prop.$type);
  }

  private getDeclaredName(node: AstNode): string | undefined {
    if ("$type" in node) {
      switch (node.$type) {
        // TODO: Figure out how to type safe these.
        case "ComponentDeclaration":
        case "NamedConnection":
        case "TagDeclaration":
        case "TagSetDeclaration":
        case "SymbolStatement":
        case "ConnectionGroup":
        case "LayoutGroup":
        case "DrawingStatement":
        case "SchematicStatement":
          return "name" in node && typeof node.name === "string"
            ? node.name
            : undefined;
        default:
          return undefined;
      }
    }
    return undefined;
  }
}
