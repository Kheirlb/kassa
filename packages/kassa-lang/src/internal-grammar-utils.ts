// The functions below are copied from langium to support a similar import resolution.
// https://github.com/eclipse-langium/langium/discussions/2152
// TODO: Cleanup nomenclature to match kassa grammer "Model"

import { AstUtils, LangiumDocuments, URI, UriUtils } from "langium";
import * as ast from './generated/ast.js';

export function resolveImportUri(imp: ast.Import): URI | undefined {
  if (imp.path === undefined || imp.path.length === 0) {
    return undefined;
  }
  const dirUri = UriUtils.dirname(AstUtils.getDocument(imp).uri);
  let grammarPath = imp.path;
  if (!grammarPath.endsWith('.kassa')) {
    grammarPath += '.kassa';
  }
  return UriUtils.resolvePath(dirUri, grammarPath);
}

export function resolveImport(documents: LangiumDocuments, imp: ast.Import): ast.Model | undefined {
  const resolvedUri = resolveImportUri(imp);
  if (!resolvedUri) {
    return undefined;
  }
  const resolvedDocument = documents.getDocument(resolvedUri);
  if (!resolvedDocument) {
    return undefined;
  }
  const node = resolvedDocument.parseResult.value;
  if (ast.isModel(node)) {
    return node;
  }
  return undefined;
}

export function resolveTransitiveImports(documents: LangiumDocuments, grammar: ast.Model): ast.Model[]
export function resolveTransitiveImports(documents: LangiumDocuments, importNode: ast.Import): ast.Model[]
export function resolveTransitiveImports(documents: LangiumDocuments, grammarOrImport: ast.Model | ast.Import): ast.Model[] {
  if (ast.isImport(grammarOrImport)) {
    const resolvedGrammar = resolveImport(documents, grammarOrImport);
    if (resolvedGrammar) {
      const transitiveGrammars = resolveTransitiveImportsInternal(documents, resolvedGrammar);
      transitiveGrammars.push(resolvedGrammar);
      return transitiveGrammars;
    }
    return [];
  } else {
    return resolveTransitiveImportsInternal(documents, grammarOrImport);
  }
}

/**
 * Resolves all transitively imported grammars of the given grammar.
 * In case of grammars importing each other in circular way, each grammar is remembered only once.
 * The initial grammar will never be part of the result.
 * @param documents the service to get all available Langium documents
 * @param grammar the grammar to transitively resolve its imported grammars
 * @param initialGrammar Even if the initial grammar transitively imports itself in circular way again, the initial grammar will not be part of the result!
 * @param visited since grammars might import each other in circular way, this set remembers the already visited gramar URIs to prevent loops
 * @param grammars the result set of already imported and resolved grammars
 * @returns the collected `grammars` in a new array
 */
function resolveTransitiveImportsInternal(documents: LangiumDocuments, grammar: ast.Model, initialGrammar = grammar, visited: Set<URI> = new Set(), grammars: Set<ast.Model> = new Set()): ast.Model[] {
  const doc = AstUtils.getDocument(grammar);
  if (initialGrammar !== grammar) {
    grammars.add(grammar);
  }
  if (!visited.has(doc.uri)) {
    visited.add(doc.uri);
    for (const imp of grammar.imports) {
      const importedGrammar = resolveImport(documents, imp);
      if (importedGrammar) {
        resolveTransitiveImportsInternal(documents, importedGrammar, initialGrammar, visited, grammars);
      }
    }
  }
  return Array.from(grammars);
}
