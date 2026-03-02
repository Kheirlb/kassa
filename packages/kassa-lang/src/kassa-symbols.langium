import "./kassa-base"
import "./kassa-layout"

// ---- symbol/component definition ----
SymbolStatement:
  'symbol' name=Identifier base=BaseSymbol? ('='? block=CustomSymbolBlock)?;

BaseSymbol:
  '<' symbolInput=Identifier '>';

CustomSymbolBlock:
  '{' (properties+=CustomSymbolProperty (','? properties+=CustomSymbolProperty)*)? ','? '}';

CustomSymbolProperty:
  SvgRef | LabelLocation | CystomSymbolElement;

SvgRef:
  'svg' ':' key=StringValue;

LabelLocation:
  'label' ':' location=Identifier;

CystomSymbolElement:
  'port' name=Identifier '=' block=DefinePortBlock;

DefinePortBlock:
  '{' (properties+=PortProperty (','? properties+=PortProperty)*)? ','? '}';

PortProperty:
  XPos | YPos | Rot;
