import {
  AstNode,
  DefaultWorkspaceManager,
  LangiumDocument,
  LangiumDocumentFactory
} from "langium";
import { LangiumSharedServices } from "langium/lsp";
import { WorkspaceFolder } from "vscode-languageserver-types";
import { URI } from "vscode-uri";
import { builtinKassa } from "./kassa-builtins.js";

export class KassaWorkspaceManager extends DefaultWorkspaceManager {

  private documentFactory: LangiumDocumentFactory;

  constructor(services: LangiumSharedServices) {
      super(services);
      this.documentFactory = services.workspace.LangiumDocumentFactory;
  }

  protected override async loadAdditionalDocuments(
      folders: WorkspaceFolder[],
      collector: (document: LangiumDocument<AstNode>) => void
  ): Promise<void> {
    console.log("[kassa-lang] loadAdditionalDocuments: builtinKassa");
    await super.loadAdditionalDocuments(folders, collector);
    // Load our library using the `builtin` URI schema
    collector(this.documentFactory.fromString(builtinKassa, URI.parse('builtin:///library.kassa')));
  }
}
