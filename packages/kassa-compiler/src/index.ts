import { createKassaServices } from "@kassa/lang";
import type { KassaProject } from "@kassa/core";
import { isConnectionChain, Model } from "@kassa/lang/ast";
import { EmptyFileSystem, URI, LangiumDocument } from "langium";

export async function compileProjectFromMemory(
  entryId: string,
  readFile: (id: string) => string | undefined
): Promise<KassaProject> {
  const services = createKassaServices(EmptyFileSystem);

  const factory = services.shared.workspace.LangiumDocumentFactory;
  const docs = services.shared.workspace.LangiumDocuments;
  const builder = services.shared.workspace.DocumentBuilder;

  const entryUri = URI.parse(entryId);
  const entryText = readFile(entryId);
  if (!entryText) {
    // TODO: better error handling
    return { version: "0.0.1", symbols: [], connections: [] };
  }

  // Create typed document (and run parser)
  const entryDoc: LangiumDocument<Model> = factory.fromString<Model>(entryText, entryUri);
  docs.addDocument(entryDoc);

  // Build lifecycle (and run validation)
  await builder.build([entryDoc], { validation: true });

  // "Lower" to IR
  return compileDocuments([entryDoc]);
}

export function compileDocuments(docs: LangiumDocument<Model>[]): KassaProject {
  const diagnostics = docs.flatMap(d => d.diagnostics ?? []);
  const models = docs.map(d => d.parseResult.value); // typed Model
  const model = models[0]; // TODO: handle multiple models

  for (const item of model.items) {
    if (isConnectionChain(item)) {
      // item is typed as ConnectionChain here
      console.log("Found a connection chain:", item);
    }
  }

  // TODO: lower models -> IR
  return {
    version: "0.0.1",
    symbols: [],
    connections: []
  };
}
