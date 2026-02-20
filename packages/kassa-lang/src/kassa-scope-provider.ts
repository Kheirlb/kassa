// Get default scope provider working.
import type { AstNodeDescription, ReferenceInfo, Scope, ScopeOptions } from 'langium';
import { AstUtils, EMPTY_SCOPE } from 'langium';
import { DefaultScopeProvider, stream, StreamScope } from 'langium';
import { isComponentDeclaration } from './generated/ast.js';

function dumpScope(scope: Scope, limit = 30) {
  const names: string[] = [];
  for (const el of scope.getAllElements()) {
    names.push(el.name);
    if (names.length >= limit) break;
  }
  console.log('Scope elements (first %d): %o', limit, names);
}

/**
 * Kassa scope provider (that should be just the default currently).
 */
export class KassaScopeProvider extends DefaultScopeProvider {

    override getScope(context: ReferenceInfo): Scope {
      const referenceType = this.reflection.getReferenceType(context);

      if (referenceType !== 'ComponentDeclaration') {
        return super.getScope(context);
      }
    
      const doc = AstUtils.getDocument(context.container);
      const root = doc.parseResult.value;
    
      const localDescs = AstUtils.streamAllContents(root)
        .filter(isComponentDeclaration)
        .map(node => this.descriptions.createDescription(node, node.name));
    
      return this.createScope(localDescs, EMPTY_SCOPE);
  }
}
