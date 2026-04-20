import "./kassa-groups"
import "./kassa-layout"
import "./kassa-drawing"

SchematicOptions:
  ConnectionGroup | LayoutGroup | DrawingRef;

DrawingRef:
  'drawing' ':' ref=[DrawingStatement];

SchematicStatement:
  'schematic' name=Identifier '{' options+=SchematicOptions* '}';
