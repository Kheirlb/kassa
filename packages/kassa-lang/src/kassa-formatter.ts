import { AstNode } from 'langium';
import { AbstractFormatter, Formatting } from 'langium/lsp';
import * as ast from './generated/ast.js';

export class KassaFormatter extends AbstractFormatter {
    protected format(node: AstNode): void {
        const isMultiLine = node.$cstNode?.text.includes("\n") ?? false;
        const isLong = (node.$cstNode?.text.length ?? 0) >= 100;
        const isLongSingleLine = !isMultiLine && isLong
        const shouldFormatBlock = isMultiLine || isLongSingleLine
        if (shouldFormatBlock && (ast.isComponentBlock(node) ||
            ast.isTagBlock(node) ||
            ast.isTitleBlock(node) ||
            ast.isTagSetBlock(node) ||
            ast.isDrawingBlock(node) || 
            ast.isLayoutBlock(node) ||
            ast.isLayoutPlaceBlock(node) ||
            ast.isDefinePortBlock(node) ||
            ast.isSymbolBlock(node) ||
            ast.isDrawingTitleBlock(node) ||
            ast.isGroupBlock(node) || 
            ast.isSchematicBlock(node)
        )) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{')
            const bracesClose = formatter.keyword('}')
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesClose.prepend(Formatting.newLine());
            const maybeCommas = formatter.keywords(',')
            maybeCommas.prepend(Formatting.noSpace());
        }

        if (shouldFormatBlock && (ast.isArrayValue(node) || 
            ast.isHardwareOptionsArray(node) ||
            ast.isRouteArray(node) ||
            ast.isTagArray(node))
        ) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('[')
            const bracesClose = formatter.keyword(']')
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesClose.prepend(Formatting.newLine());
            const maybeCommas = formatter.keywords(',')
            maybeCommas.prepend(Formatting.noSpace());
        }

        const shouldFormatConnection = !isMultiLine && isLong;
        if (shouldFormatConnection && ast.isConnectionStatement(node)) {
            // v1: Valve --> v2: Valve ... etc
            // Becomes
            // v1: Valve
            // --> v2: Valve
            // etc

            // Put each connection on its own line
            const stmtFmt = this.getNodeFormatter(node);
            stmtFmt.nodes(...node.connections).prepend(Formatting.newLine({ allowMore: true }));

            // Now format the arrows inside each connection node
            for (const conn of node.connections) {
                const connFmt = this.getNodeFormatter(conn);

                // If a conn can contain multiple arrows:
                connFmt.keywords('-->').prepend(Formatting.newLine({ allowMore: true }));
                connFmt.keywords('->').prepend(Formatting.newLine({ allowMore: true }));
            }
        } 
    }
}
