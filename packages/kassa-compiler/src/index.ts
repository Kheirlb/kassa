import { createKassaServices } from "@kassa/lang";
import type { CompilerResult } from "@kassa/core";
import { isConnectionStatement, Model } from "@kassa/lang/ast";
import { EmptyFileSystem, URI, LangiumDocument } from "langium";

export async function compileProjectFromMemory(
  entryId: string,
  readFile: (id: string) => string | undefined
): Promise<CompilerResult> {
  const services = createKassaServices(EmptyFileSystem);

  const factory = services.shared.workspace.LangiumDocumentFactory;
  const docs = services.shared.workspace.LangiumDocuments;
  const builder = services.shared.workspace.DocumentBuilder;

  const entryUri = URI.parse(entryId);
  // TODO: better error handling
  const entryText = readFile(entryId);
  if (!entryText) {
    return { version: "0.0.1", projects: [], documents: [], diagnostics: [{ severity: "error", message: `Entry file not found: ${entryId}` }] };
  }

  // Create typed document (and run parser)
  const entryDoc: LangiumDocument<Model> = factory.fromString<Model>(entryText, entryUri);
  docs.addDocument(entryDoc);

  // Build lifecycle (and run validation)
  await builder.build([entryDoc], { validation: true });

  // "Lower" to IR
  return compileDocuments([entryDoc]);
}

export function compileDocuments(docs: LangiumDocument<Model>[]): CompilerResult {
  const diagnostics = docs.flatMap(d => d.diagnostics ?? []);
  const models = docs.map(d => d.parseResult.value); // typed Model
  const model = models[0]; // TODO: handle multiple models

  // for (const statement of model.statements) {
  //   if (isConnectionStatement(statement)) {
  //     console.log("Found a connection statement:", statement);
  //   }
  // }

  // TODO: lower models -> IR
  return {
    version: "0.0.1",
    projects: [
      {
        id: "project-1",
        name: "Example Project",
        componentDefinitions: [],
        components: [],
        connections: [],
        drawings: [],
        groups: [],
        layouts: [],
        schematics: [],
        tags: [],
        tagsets: []
      },
    ],
    documents: docs.map(d => ({
      uri: d.uri.toString(),
      text: d.textDocument.getText(),
      imports: [] // TODO
    })),
    diagnostics: []
  };
}
