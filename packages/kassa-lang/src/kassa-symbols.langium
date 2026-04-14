import "./kassa-base"
import "./kassa-layout"

// ---- symbol/component definition ----
SymbolStatement:
  'symbol' name=Identifier base=BaseSymbol? ('='? block=SymbolBlock)?;

BaseSymbol:
  '<' symbolInput=[SymbolStatement] '>';

SymbolBlock:
  '{' (properties+=SymbolProperty (','? properties+=SymbolProperty)*)? ','? '}';

SymbolProperty:
  SvgRef | LabelLocation | SymbolPortElement;

SvgRef:
  'svg' ':' key=StringValue;

LabelLocation:
  'label' ':' location=Identifier;

SymbolPortElement:
  'port' name=Identifier '=' block=DefineSymbolPortBlock;

DefineSymbolPortBlock:
  '{' (properties+=SymbolPortProperty (','? properties+=SymbolPortProperty)*)? ','? '}';

SymbolPortProperty:
  XPos | YPos | Rot;
