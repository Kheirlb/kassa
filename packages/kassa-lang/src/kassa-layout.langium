import "./kassa-base"
import "./kassa-components"
// ---- layout statements ----

LayoutGroup:
  'layout' name=Identifier? '='? '{' layoutElements+=LayoutElement+ '}';

LayoutElement:
  LayoutComponent | RouteConnection;

LayoutComponent:
  'place' componentId=[ComponentDeclaration] '='? block=LayoutPlaceBlock;

LayoutPlaceBlock:
  '{' (properties+=PlaceProperty (','? properties+=PlaceProperty)*)? ','?  '}';

PlaceProperty:
  XPos | YPos | ZPos | Rot;

XPos:
  'x' ':' value=NumberValue;

YPos:
  'y' ':' value=NumberValue;

ZPos:
  'z' ':' value=NumberValue;

Rot:
  'rot' ':' value=NumberValue;

RouteConnection:
  // TODO: Support referenced connections "v0-->v1" instead of conn1?
  RouteNamedConnection;

RouteNamedConnection:
  // TODO Narrow component options in validation?
  'route' componentId=[ComponentDeclaration] '='? array=RouteArray;

RouteArray:
  '[' (elements+=RouteSection (','? elements+=RouteSection)*)? ','? ']';

RouteSection:
  Direction | Auto;

Direction:
  dir=Identifier amount=NumberValue;

Auto returns string:
  'auto';
