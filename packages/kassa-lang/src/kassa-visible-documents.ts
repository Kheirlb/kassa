import { LangiumDocument, URI } from "langium";
import type { Model } from "./ast/index.js";
import { dirname, join } from "node:path";

export interface VisibleDocumentService {
  collectVisibleUris(document: LangiumDocument<Model>): Set<string>;
}

export class KassaVisibleDocumentService implements VisibleDocumentService {
  collectVisibleUris(document: LangiumDocument<Model>): Set<string> {
    const currentUri = document.uri;
    const currentDir = dirname(currentUri.path);
    const uris = new Set<string>();
    // Add current and builtin docuemnts to the scope.
    uris.add(document.textDocument.uri);
    uris.add(URI.parse('builtin:///library.kassa').toString());
    const model = document.parseResult.value as Model;
    // Add imported files to the scope.
    for (const fileImport of model.imports) {
        const filePath = join(currentDir, fileImport.path);
        const uri = currentUri.with({ path: filePath });
        uris.add(uri.toString());
    }
    return uris;
  }
}
