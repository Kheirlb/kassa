export type KassaProject = {
  version: string;
  symbols: Array<{ id: string; kind: string }>;
  connections: Array<{ from: string; to: string }>;
  // diagnostics: Diagnostic[];
};
