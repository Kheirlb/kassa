import type { AstNodeDescription, LangiumDocument, ReferenceInfo, Scope } from 'langium';
import { AstUtils, DefaultScopeComputation, EMPTY_SCOPE } from 'langium';
import { DefaultScopeProvider, stream, StreamScope } from 'langium';
import * as ast from './generated/ast.js';

export class KassaScopeComputation extends DefaultScopeComputation {}

/**
 * Kassa scope provider (that should be just the default currently).
 */
export class KassaScopeProvider extends DefaultScopeProvider {
  override getScope(context: ReferenceInfo): Scope {
    const referenceType = this.reflection.getReferenceType(context);

    // A port is a class member of sorts for a symbol.
    // A port references is too nested to easily cross link, so we need to help langium here.
    if (referenceType === 'PortElement') {
      const containerWithInfo = context.container.$container
      // Grab the related symbol nodes based on the component type.
      let symbolNode: ast.SymbolStatement | undefined;
      if (ast.isConnectedComponentDefine(containerWithInfo)) {
        symbolNode = containerWithInfo.componentId.componentType.ref;
      } else if (ast.isConnectedComponentRef(containerWithInfo)) {
        symbolNode = containerWithInfo.componentIdRef.ref?.componentType.ref
      } else if (ast.isRouteBasicConnection(containerWithInfo)) {
        if (context.container.$containerProperty === "outlet") {
          symbolNode = containerWithInfo.fromComponentId.ref?.componentType.ref
        } else if (context.container.$containerProperty === "inlet") {
          symbolNode = containerWithInfo.toComponentId.ref?.componentType.ref
        }
      }
      if (symbolNode) {
        // Example: "outlet" is on v0 of type "Valve"
        // v0: Valve
        // v0 [outlet] --> [inlet] v1: Valve
        // Valve is defined in another file with a valid PortElement.
        // Collect up the port nodes.
        const portDescs: AstNodeDescription[] = [];
        for (const property of symbolNode?.block?.properties ?? []) {
          if (ast.isPortElement(property)) {
            const desc = this.descriptions.createDescription(property, property.name)
            portDescs.push(desc)
            // TODO: Make inlet work.
            // "inlet" is being pushed, but unfortunately the intellisense doesn't work
            // when it is partially typed "inle".
            // I know most languages require context before the cursor, but I was hoping
            // if v1 is already defined to the right, things would work.
          }
        }
        return this.createScope(portDescs, EMPTY_SCOPE);
      }
    }

    // Component declarations needs to look at the entire document.
    // Even stuff defined in a connection.
    if (referenceType !== 'ComponentDeclaration') {
      return super.getScope(context);
    }

    const doc = AstUtils.getDocument(context.container);
    const root = doc.parseResult.value;
    const localDescs = AstUtils.streamAllContents(root)
      .filter(ast.isComponentDeclaration)
      .map(node => this.descriptions.createDescription(node, node.name));

    return this.createScope(localDescs, EMPTY_SCOPE);
  }
}
