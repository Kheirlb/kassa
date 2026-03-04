import "./kassa-base"
import "./kassa-components"
import "./kassa-connections"

LayoutGroup:
  'layout' name=Identifier? '='? LayoutBlock;

LayoutBlock:
  '{' layoutElements+=LayoutElement+ '}';

LayoutElement:
  LayoutComponent | RouteConnection;

LayoutComponent:
  'place' componentId=[ComponentDeclaration] '=' block=LayoutPlaceBlock;

LayoutPlaceBlock:
  '{' (properties+=PlaceProperty (','? properties+=PlaceProperty)*)? ','?  '}';

PlaceProperty:
  XPos | YPos | ZPos | Rot | Mirror;

XPos:
  'x' ':' value=NumberValue;

YPos:
  'y' ':' value=NumberValue;

ZPos:
  'z' ':' value=NumberValue;

Rot:
  'rot' ':' value=NumberValue;

Mirror:
  'mirror' (':' value=BooleanValue)?;

RouteConnection:
  RouteNamedConnection | RouteBasicConnection;

RouteNamedConnection:
  'route' componentId=[ComponentDeclaration] '=' array=RouteArray;

RouteBasicConnection:
  'route' '(' fromComponentId=[ComponentDeclaration] outlet=PortRef? '-->' inlet=PortRef? toComponentId=[ComponentDeclaration] ')' '=' array=RouteArray;

RouteArray:
  '[' (elements+=RouteSection (','? elements+=RouteSection)*)? ','? ']';

RouteSection:
  Direction | Auto;

Direction:
  dir=Identifier? amount=NumberValue;

Auto returns string:
  'auto';
