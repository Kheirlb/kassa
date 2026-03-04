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
  SvgRef | LabelLocation | PortElement;

SvgRef:
  'svg' ':' key=StringValue;

LabelLocation:
  'label' ':' location=Identifier;

PortElement:
  'port' name=Identifier '=' block=DefinePortBlock;

DefinePortBlock:
  '{' (properties+=PortProperty (','? properties+=PortProperty)*)? ','? '}';

PortProperty:
  XPos | YPos | Rot;
