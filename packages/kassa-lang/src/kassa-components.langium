import "./kassa-base"
import "./kassa-tags"

ComponentDeclaration:
  name=Identifier ':' type=ComponentType ('='? value=ComponentBlock)?;

ComponentType:
  name=Identifier;

ComponentBlock:
  '{' (properties+=ComponentProperty (','? properties+=ComponentProperty)*)? ','? '}';

ComponentProperty:
  ComponentNameProperty | TagSetTagsProperty;
// TODO ComponentPartsProperty;

ComponentNameProperty:
  'name' ':' value=String;

