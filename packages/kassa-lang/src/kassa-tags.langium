import "./kassa-base"

TagDeclarations:
  TagDeclaration | TagSetDeclaration;

TagDeclaration:
  'tag' name=Identifier ('='? block=TagBlock)?;

TagBlock:
  '{' (properties+=TagProperty (','? properties+=TagProperty)*)? ','? '}';

TagProperty:
  TagNameProperty | TagColorProperty;

TagNameProperty:
  'name' ':' value=String;

TagColorProperty:
  'color' ':' value=Color;

Color:
  BasicColor | HexColor;

BasicColor:
  name=Identifier;

HexColor:
  value=HEX_COLOR;

terminal HEX_COLOR: /#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?([0-9a-fA-F]{2})?/;

// "Group" tags via tagset

TagSetDeclaration:
  'tagset' name=Identifier '='? block=TagSetBlock;

TagSetBlock:
  '{' (properties+=TagSetProperty (','? properties+=TagSetProperty)*)? ','?  '}';

TagSetProperty:
  TagSetNameProperty | TagSetTagsProperty;

TagSetNameProperty:
  'name' ':' value=String;

TagSetTagsProperty:
  'tags' ':' TagRefList;

TagRefList:
  '[' (elements+=TagRef (','? elements+=TagRef)*)? ','? ']';

TagRef:
  ref=[TagDeclaration:Identifier];
