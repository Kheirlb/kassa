import {
  AstNode,
  AstUtils,
  ValidationAcceptor,
  ValidationChecks,
} from "langium";
import { KassaServices } from "./kassa-module.js";
import type { KassaAstType, Model } from "./ast/index.js";

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
    ],
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class KassaValidator {
  checkUniqueImports(model: Model, accept: ValidationAcceptor): void {
    // Create a set of visited imports to track duplicates and warn the user.
    const uniqueImports = new Set();
    model.imports.forEach((d) => {
      if (uniqueImports.has(d.path)) {
        // Warn the user they tried to reimport the same file.
        accept("warning", `'${d.path}' is imported multiple times.`, {
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
        // Warn the user they tried to reimport the same file.
        accept("warning", `'${d.path}' is imported multiple times.`, {
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
