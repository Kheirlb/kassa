import type { ReferenceInfo, Scope } from 'langium';
import { AstUtils, EMPTY_SCOPE } from 'langium';
import { DefaultScopeProvider } from 'langium';
import { KassaAstType, Model, isComponentDeclaration } from './generated/ast.js';

export class KassaScopeProvider extends DefaultScopeProvider {
    override getScope(context: ReferenceInfo): Scope {
        switch(context.container.$type as keyof KassaAstType) {
            case 'ConnectedComponentRef':
                if (context.property.includes("componentId")) {
                    return this.getImportedStuff(context);
                }
                break;
        }
        return super.getScope(context);
        // const referenceType = this.reflection.getReferenceType(context);

        // // Only customize component refs; everything else is default.
        // if (referenceType !== 'ComponentDeclaration') {
        //     return super.getScope(context);
        // }

        // const doc = AstUtils.getDocument(context.container);
        // const model = doc.parseResult.value as Model;

        // // 1) Start with the DEFAULT scope
        // // const base = super.getScope(context);

        // // 2) Add local declarations found anywhere in this doc (inline/nested)
        // const locals = AstUtils.streamAllContents(model)
        //     .filter(isComponentDeclaration)
        //     .map(node => this.descriptions.createDescription(node, node.name));

        // // 3) Overlay locals on top of base (locals win if same name)
        // return this.createScope(locals, EMPTY_SCOPE);
    }

    private getImportedStuff(context: ReferenceInfo) {
        const doc = AstUtils.getDocument(context.container);
        const model = doc.parseResult.value as Model;
        const descriptions = model.fileImports.flatMap(fileImport =>
            fileImport.componentImports.map(componentImport => {
                if (componentImport.name) {
                    return this.descriptions.createDescription(componentImport, componentImport.name)
                }
                if (componentImport.componentId.ref) {
                    return this.descriptions.createDescription(componentImport.componentId.ref, componentImport.componentId.ref.name)
                }
                return undefined;
            })
        )
        .filter(description => description != undefined)
        .map(description => description!);
        return this.createScope(descriptions);
    } 
}
