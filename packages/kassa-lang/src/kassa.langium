grammar Kassa

import "./kassa-base"
import "./kassa-components"
import "./kassa-connections"
import "./kassa-tags"
import "./kassa-symbols"
import "./kassa-layout"
import "./kassa-drawing"
import "./kassa-groups"
import "./kassa-schematics"

entry Model:
  imports+=Import*
  csvImports+=ImportCsv*
  statements+=Statement*;

Import:
  'import' path=String;

Statement:
  ConnectionStatement
| ComponentDeclaration
| NamedConnection
| TagDeclarations
| Group
| Layout
| LayoutElement
| DrawingTemplate
| SymbolStatement
| SchematicStatement
| NumberValue
;
