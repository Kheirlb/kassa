import "./kassa-groups"
import "./kassa-layout"
import "./kassa-drawing"

SchematicStatement:
  'schematic' name=Identifier block=SchematicBlock;

SchematicBlock:
  '{' options+=SchematicOptions* '}';

SchematicOptions:
  GroupRefArray | LayoutRef | DrawingRef;

GroupRefArray:
  'groups' '[' (ref+=[Group] (','? ref+=[Group])*)? ','? ']';

DrawingRef:
  'drawing' ':' ref=[DrawingTemplate];

LayoutRef:
  'use' layoutId=[Layout] ('=' block=LayoutPlaceBlock)?;
