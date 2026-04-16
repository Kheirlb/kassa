import type { AstNodeDescription, LangiumDocument, ReferenceInfo, Scope } from 'langium';
import { AstUtils, DefaultScopeComputation, EMPTY_SCOPE } from 'langium';
import { DefaultScopeProvider, stream, StreamScope } from 'langium';
import { dirname, join } from 'node:path'; // TODO: Remove dep.
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

    // For `v1: Valve`, restrict visible types to:
    // - same-file top-level declarations
    // - imported-file top-level exported declarations
    //
    // Adjust this condition if your actual reference site differs.
    if (
      ast.isComponentDeclaration(context.container) &&
      context.property === 'componentType'
    ) {
      const document = AstUtils.getDocument(context.container);
      const model = document.parseResult.value as ast.Model;

      const descriptions: AstNodeDescription[] = [];

      // Same-file declarations that should be usable as component types
      for (const stmt of model.statements ?? []) {
        if (ast.isSymbolStatement(stmt)) {
          descriptions.push(this.descriptions.createDescription(stmt, stmt.name));
        }

        // Later, add more allowed imported type kinds here if needed.
        // Example:
        // if (ast.isWhateverTypeStatement(stmt)) {
        //   descriptions.push(this.descriptions.createDescription(stmt, stmt.name));
        // }
      }

      // Imported-file exported declarations
      const currentUri = document.uri;
      const currentDir = dirname(currentUri.path);
      const uris = new Set<string>();

      for (const fileImport of model.imports ?? []) {
        // TODO: Figure out how to handle imports without node.js?
        const filePath = join(currentDir, fileImport.path);
        const uri = currentUri.with({ path: filePath });
        uris.add(uri.toString());
      }

      // Pull globally exported elements from only those imported files
      const importedDescriptions = this.indexManager.allElements(referenceType, uris).toArray();

      return this.createScope(
        [...descriptions, ...importedDescriptions],
        EMPTY_SCOPE
      );
    }

    // Component declarations needs to look at the entire document.
    // Even stuff defined in a connection.
    if (referenceType === 'ComponentDeclaration') {
      const doc = AstUtils.getDocument(context.container);
      const root = doc.parseResult.value;
      const localDescs = AstUtils.streamAllContents(root)
        .filter(ast.isComponentDeclaration)
        .map(node => this.descriptions.createDescription(node, node.name));

      return this.createScope(localDescs, EMPTY_SCOPE);
    }

    return super.getScope(context);
  }
}
