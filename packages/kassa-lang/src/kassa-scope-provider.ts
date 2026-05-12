import { AstNode, AstNodeDescription, DocumentCache, LangiumCoreServices, LangiumDocument, ReferenceInfo, Scope, URI } from 'langium';
import { AstUtils, DefaultScopeComputation, EMPTY_SCOPE, MultiMapScope } from 'langium';
import { DefaultScopeProvider } from 'langium';
import { dirname, join } from 'node:path'; // TODO: Remove dep.
import * as ast from './generated/ast.js';
import { KassaServices } from './kassa-module.js';
import { KassaVisibleDocumentService } from './kassa-visible-documents.js';

export class KassaScopeComputation extends DefaultScopeComputation {
  override async collectExportedSymbols(
    document: LangiumDocument<AstNode>
  ): Promise<AstNodeDescription[]> {
    // console.log("[kassa-lang] running collectExportedSymbols")
    const exported = await super.collectExportedSymbols(document);
    const seen = new Set(exported.map(e => `${e.type}:${e.name}`));

    const extra: AstNodeDescription[] = [];
    for (const node of AstUtils.streamAllContents(document.parseResult.value)) {
      if (ast.isComponentDeclaration(node) && node.name) {
        const key = `ComponentDeclaration:${node.name}`;
        if (!seen.has(key)) {
          extra.push(this.descriptions.createDescription(node, node.name, document));
          seen.add(key);
        }
      }
    }

    return [...exported, ...extra];
  }
}

/**
 * Kassa scope provider.
 */
export class KassaScopeProvider extends DefaultScopeProvider {
  // Cache for global scopes, which are expensive to compute and don't change often.
  private documentCache: DocumentCache<string, Scope>;
  protected readonly visibleDocuments: KassaVisibleDocumentService;

  constructor(services: KassaServices) {
    super(services);
    this.documentCache = new DocumentCache<string, Scope>(services.shared);
    this.visibleDocuments = services.references.VisibleDocuments;
  }

  // https://github.com/eclipse-langium/langium/discussions/1957
  // "Global" scope is now file + imports (including builtin).
  protected override getGlobalScope(referenceType: string, context: ReferenceInfo): Scope {
    const document = AstUtils.getDocument(context.container) as LangiumDocument<ast.Model>;

    return this.documentCache.get(document.uri, referenceType, () => {
      const uris = this.visibleDocuments.collectVisibleUris(document);
      return new MultiMapScope(this.indexManager.allElements(referenceType, uris));
    });
  }

  override getScope(context: ReferenceInfo): Scope {
    const referenceType = this.reflection.getReferenceType(context);

    // A port is a "class member" of sorts for a symbol.
    // Unfortunately, port references are too nested for Langium to easily cross link, so we need to help langium here.
    // TODO: Make referenceType comparison more type safe.
    if (referenceType === 'PortElement') {
      // Grab the symbol node that the port belongs to.
      const containerWithInfo = context.container.$container
      // Grab the related symbol nodes based on the component type.
      // Ports can be defined in three-ish places:
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
            // TODO: Implement custom completion provider.
            // "inlet" is being correctly identified, but unfortunately the intellisense doesn't work
            // when it is partially typed "inle".
            // I know most languages require context before the cursor, but I was hoping
            // if v1 is already defined to the right, things would work.
          }
        }
        return this.createScope(portDescs, EMPTY_SCOPE);
      }
    }

    return super.getScope(context);
  }
}
