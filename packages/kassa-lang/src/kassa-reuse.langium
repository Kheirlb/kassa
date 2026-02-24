import "./kassa-base"

ImportStatement:
  'import' target=ImportTarget;

ImportTarget:
  path=StringValue | name=Identifier;

// SheetGroup:
//   'sheet' name=Identifier '='? block=SheetBlock;

