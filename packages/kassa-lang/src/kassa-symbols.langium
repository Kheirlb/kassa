import "./kassa-base"
import "./kassa-layout"

// ---- custom symbol ----
CustomSymbol:
  'symbol' name=Identifier '<' symbolInput=Identifier '>' ('='? block=CustomSymbolBlock)?;

CustomSymbolBlock:
  '{' (properties+=CustomSymbolProperty (','? properties+=CustomSymbolProperty)*)? ','? '}';

CustomSymbolProperty:
  CystomSymbolElement;

CystomSymbolElement:
  'port' name=Identifier '='? block=DefinePortBlock;

DefinePortBlock:
  '{' (properties+=PortProperty (','? properties+=PortProperty)*)? ','? '}';

PortProperty:
  XPos | YPos | Rot;
