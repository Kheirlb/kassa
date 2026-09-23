import { LangiumDocuments, LeafCstNode, MaybePromise, Properties, GrammarUtils, AstUtils, AstNode } from "langium";
import { DefaultDefinitionProvider } from "langium/lsp";
import { KassaServices } from "./kassa-module";
import { DefinitionParams, LocationLink, Range } from "vscode-languageserver";
import * as ast from './generated/ast.js';
import { resolveImport } from "./internal-grammar-utils";

export class KassaDefinitionProvider extends DefaultDefinitionProvider {

    protected documents: LangiumDocuments;

    constructor(services: KassaServices) {
        super(services);
        this.documents = services.shared.workspace.LangiumDocuments;
    }

    protected override collectLocationLinks(sourceCstNode: LeafCstNode, _params: DefinitionParams): MaybePromise<LocationLink[] | undefined> {
        const pathFeature: Properties<ast.Import> = 'path';
        if (ast.isImport(sourceCstNode.astNode) && GrammarUtils.findAssignment(sourceCstNode)?.feature === pathFeature) {
            const importedGrammar = resolveImport(this.documents, sourceCstNode.astNode);
            if (importedGrammar?.$document) {
                const targetObject = this.findTargetObject(importedGrammar) ?? importedGrammar;
                const selectionRange = this.nameProvider.getNameNode(targetObject)?.range ?? Range.create(0, 0, 0, 0);
                const previewRange = targetObject.$cstNode?.range ?? Range.create(0, 0, 0, 0);
                return [
                    LocationLink.create(
                        importedGrammar.$document.uri.toString(),
                        previewRange,
                        selectionRange,
                        sourceCstNode.range
                    )
                ];
            }
            return undefined;
        }
        return super.collectLocationLinks(sourceCstNode, _params);
    }

    protected findTargetObject(importedGrammar: ast.Model): AstNode | undefined {
        // // Jump to grammar name or the first element
        // if (importedGrammar.isDeclared) {
        //     return importedGrammar;
        // }
        return AstUtils.streamContents(importedGrammar).head();
    }
}
