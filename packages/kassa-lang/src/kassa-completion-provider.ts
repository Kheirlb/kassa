import { LangiumDocument } from "langium";
import { DefaultCompletionProvider } from "langium/lsp";
import type { CompletionParams } from 'vscode-languageserver-protocol';
import { CompletionList } from 'vscode-languageserver';

export class KassaCompletionProvider extends DefaultCompletionProvider {
  override async getCompletion(document: LangiumDocument, params: CompletionParams): Promise<CompletionList | undefined> {
    console.log("[kassa-lang] getCompletion", document.textDocument.getText())
    const result = await super.getCompletion(document, params);
    console.log("[kassa-lang] getCompletion result", result)
    return result;
  }
}
