grammar Kassa

import "./kassa-base"
import "./kassa-components"
import "./kassa-connections"
import "./kassa-tags"
import "./kassa-symbols"
import "./kassa-layout"
import "./kassa-drawing"

entry Model:
  (statements+=Statement)*;

Statement:
  ConnectionStatement
| ComponentDeclaration
| TagDeclarations
| LayoutGroup
| LayoutElement
| DrawingStatement
| SymbolStatement
;
