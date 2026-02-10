import type { KassaProject } from "@kassa/core";
import type { Model } from "@kassa/lang/ast";

export function compileText(text: string) {
  return compileModule(text, 'memory://main.kassa');
}

export function compileModule(text: string, _id: string) {

  return { 
    filename: 'valves.kassa',
    symbols: [],
    connections: [],
    imports: []
  }
}

export function compileProject(
  entryId: string,
  readFile: (id: string) => string
): KassaProject {
  return {
    version: "0.0.1",
    symbols: [],
    connections: [],
    diagnostics: []
  };
}
