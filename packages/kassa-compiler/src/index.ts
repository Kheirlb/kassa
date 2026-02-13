import type { KassaProject } from "@kassa/core";
import { createKassaServices } from "@kassa/lang";
import { Model, isConnectionChain } from "@kassa/lang/ast";
import { EmptyFileSystem, URI, type LangiumDocument } from "langium";

export async function compileProjectFromMemory(
  entryId: string,
  readFile: (id: string) => string | undefined
): Promise<KassaProject> {
  const services = createKassaServices(EmptyFileSystem);
  const docs = services.shared.workspace.LangiumDocuments;

  const entryUri = URI.parse(entryId);
  const entryText = readFile(entryId);
  if (entryText == null) {
    return {
      version: "0.0.1",
      symbols: [],
      connections: []
    };
  }
  const entryDoc = docs.createDocument(entryUri, entryText);
  const toBuild: LangiumDocument[] = [entryDoc];
  await services.shared.workspace.DocumentBuilder.build(toBuild, { validation: true });
  // const diagnostics = toBuild.flatMap(d => d.diagnostics ?? []);

  const model = entryDoc.parseResult.value as Model;
  // Parse for symbols and connections?
  for (const item of model.items) {
    if (isConnectionChain(item)) {
      // item is typed as ConnectionChain here
    }
  }

  return {
    version: "0.0.1",
    symbols: [],
    connections: []
  };
}
