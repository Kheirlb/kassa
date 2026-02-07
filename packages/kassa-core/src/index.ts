export type Diagnostic = {
  severity: "error" | "warning" | "info";
  message: string;
  // add range later
};

export type KassaIR = {
  version: string;
  symbols: Array<{ id: string; kind: string }>;
  connections: Array<{ from: string; to: string }>;
};
