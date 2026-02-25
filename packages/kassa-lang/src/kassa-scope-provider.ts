import type { ReferenceInfo, Scope } from 'langium';
import { AstUtils } from 'langium';
import { DefaultScopeProvider } from 'langium';
import { isComponentDeclaration } from './generated/ast.js';

export class KassaScopeProvider extends DefaultScopeProvider {
    override getScope(context: ReferenceInfo): Scope {
        const referenceType = this.reflection.getReferenceType(context);

        // Only customize component refs; everything else is default.
        if (referenceType !== 'ComponentDeclaration') {
            return super.getScope(context);
        }

        const doc = AstUtils.getDocument(context.container);
        const root = doc.parseResult.value;

        // 1) Start with the DEFAULT scope
        const base = super.getScope(context);

        // 2) Add local declarations found anywhere in this doc (inline/nested)
        const locals = AstUtils.streamAllContents(root)
            .filter(isComponentDeclaration)
            .map(node => this.descriptions.createDescription(node, node.name));

        // 3) Overlay locals on top of base (locals win if same name)
        return this.createScope(locals, base);
    }
}
