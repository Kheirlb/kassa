import "./kassa-base"
import "./kassa-tags"
import "./kassa-symbols"

ComponentStatement:
  'component' name=Identifier base=BaseComponent? ('='? block=ComponentBlock)?;

BaseComponent:
  '<' componentInput=[ComponentStatement] '>';

ComponentBlock:
  '{' (properties+=ComponentProperty (','? properties+=ComponentProperty)*)? ','? '}';

ComponentProperty:
  SymbolRef | PortElement;

SymbolRef:
  'symbol' ':' symbolRef=[SymbolStatement];

PortElement:
  'port' name=Identifier '=' block=DefinePortBlock;

DefinePortBlock:
  '{' (properties+=PortProperty (','? properties+=PortProperty)*)? ','? '}';

PortProperty:
  PortInterface | Limits;

PortInterface:
  'interface' ':' interface=InterfaceSpec;

// --- InterfaceSpec
InterfaceSpec:
  NptInterface | OrbInterface | SwagelokInterface | FlangeInterface | RefInterface;

RefInterface:
  ref=[InterfaceDeclaration];

// --- Instance ---
ComponentInstanceDeclaration:
  name=Identifier ':' componentType=[SymbolStatement] ('='? value=ComponentInstanceBlock)?;

ComponentInstanceBlock:
  '{' (properties+=ComponentInstanceProperty (','? properties+=ComponentInstanceProperty)*)? ','? '}';

ComponentInstanceProperty:
  ComponentInstanceNameProperty | TagSetTagsProperty | ComponentInstanceOptionsProperty;

ComponentInstanceNameProperty:
  'name' ':' value=String;

ComponentInstanceOptionsProperty:
  'hardware' ':' OptionsArray;

OptionsArray:
  '[' (option+=OptionRef (','? option+=OptionRef)*)? ','? ']';

OptionRef:
  source=Identifier '.' key=(Identifier | String | Number);
