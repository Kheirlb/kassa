import type { Diagnostic, KassaIR } from "@kassa/core";
import type { Model } from "@kassa/lang/ast";

// later: import langium services from @kassa/lang and parse text
export function compileText(_model: Model, _sourceText: string): { diagnostics: Diagnostic[]; ir?: KassaIR } {
  // MVP stub
  return {
    diagnostics: [],
    ir: { version: "0.0.1", symbols: [], connections: [] }
  };
}
