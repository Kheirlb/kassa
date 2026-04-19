grammar Kassa

import "./kassa-base"
import "./kassa-components"
import "./kassa-connections"
import "./kassa-tags"
import "./kassa-symbols"
import "./kassa-layout"
import "./kassa-drawing"

entry Model:
  imports+=Import*
  statements+=Statement*;

Import:
  'import' path=String;

Statement:
  ConnectionStatement
| ComponentDeclaration
| NamedConnection
| TagDeclarations
| LayoutGroup
| LayoutElement
| DrawingStatement
| SymbolStatement
;
