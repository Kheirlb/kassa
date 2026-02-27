import "./kassa-base"
import "./kassa-tags"

ComponentDeclaration:
  name=Identifier ':' type=ComponentType ('='? value=ComponentBlock)?;

ComponentType:
  name=Identifier;

ComponentBlock:
  '{' (properties+=ComponentProperty (','? properties+=ComponentProperty)*)? ','? '}';

ComponentProperty:
  ComponentNameProperty | TagSetTagsProperty | ComponentOptionsProperty;

ComponentNameProperty:
  'name' ':' value=String;

OptionsSource:
  name=Identifier;

ComponentOptionsProperty:
  'hardware' ':' OptionsArray;

OptionsArray:
  '[' (option+=OptionRef (','? option+=OptionRef)*)? ','? ']';

OptionRef:
  source=Identifier '.' key=(Identifier | String | Number);
