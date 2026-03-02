import "./kassa-base"
import "./kassa-tags"
import "./kassa-symbols"

ComponentDeclaration:
  name=Identifier ':' type=[SymbolStatement] ('='? value=ComponentBlock)?;

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
