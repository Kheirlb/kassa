// symbol Valve = {
//   svg: "valve"
//   label: bottom_mid
//   port inlet  = { x: 30 y: 60 rot: 180 }
//   port outlet = { x: 90 y: 60 rot: 0 }
// }

import { LangiumDocument } from "langium";
import * as ast from "./generated/ast.js";

type PortEntry = {
  label: string;
  x?: number;
  y?: number;
  rot?: number;
  // action: string; // edit/add/remove/default?
}

export type SymbolCatalogEntry = {
  name: string;
  // basename?: string;
  // svg?: string;
  // ports: PortEntry[]
  ports: string[]
}

export function buildCatalog(doc: LangiumDocument): SymbolCatalogEntry[] {
  const out: SymbolCatalogEntry[] = [];
  const model = doc.parseResult.value as ast.Model;
  for (const statement of model.statements) {
    if (ast.isSymbolStatement(statement)) {
      const orderedPorts: string[] = [];
      for (const property of statement.block?.properties || []) {
        if (ast.isPortElement(property)) {
          orderedPorts.push(property.name)
        }
      }
      out.push({
        name: statement.name,
        ports: orderedPorts
      })
    }
  }
  return out;
}
