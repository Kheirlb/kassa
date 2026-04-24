import "./kassa-base"
import "./kassa-tags"
import "./kassa-symbols"

ComponentDeclaration:
  name=Identifier ':' componentType=[SymbolStatement] ('='? value=ComponentBlock)?;

ComponentReference:
  ref=[ComponentDeclaration];

ComponentBlock:
  '{' (properties+=ComponentProperty (','? properties+=ComponentProperty)*)? ','? '}';

ComponentProperty:
  ComponentNameProperty | TagSetTagsProperty | ComponentOptionsProperty;

ComponentNameProperty:
  'name' ':' value=String;

OptionsSource:
  name=Identifier;

ComponentOptionsProperty:
  'hardware' ':' HardwareOptionsArray;

HardwareOptionsArray:
  '[' (option+=HardwareOptionRef (','? option+=HardwareOptionRef)*)? ','? ']';

ImportCsv:
  'load' path=String 'as' name=Identifier;

HardwareOptionRef:
  source=[ImportCsv] '.' key=(Identifier | String | Number);
