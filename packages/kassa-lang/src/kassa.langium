grammar Kassa

entry Model: (items+=Item)*;

Item: Statement | ConnectionStatement;

// ---- connection langauge ----

ConnectedComponent: inlet=Port? componentId=[ComponentDeclaration:Identifier] (':' type=ComponentType)? outlet=Port?;

Port: '[' portName=Identifier ']';

ConnectionStatement:
  ConnectionStart | ConnectionContinue;

ConnectionStart:
  start=ConnectedComponent connections+=ConnectionKind+;

ConnectionContinue:
  connections+=ConnectionKind+; // starts with an operator implicitly

ConnectionKind:
  (kind=StandardConnection | kind=DirectConnection);

StandardConnection:
  operator='-->' target=ConnectedComponent;

DirectConnection:
  operator='->' target=ConnectedComponent;

// ---- statements ----

Statement: ComponentDeclaration | TagDeclarations | LayoutStatement;

// ---- tag statements ----

TagDeclarations:
  TagDeclaration | TagSetDeclaration;

TagDeclaration:
  'tag' name=Identifier ('=' value=ObjectValue)?;

TagRef:
  ref=[TagDeclaration:Identifier];

TagRefList:
  '[' (elements+=TagRef (',' elements+=TagRef)*)? ','? ']';

TagSetDeclaration:
  'tagset' name=Identifier ('=' value=ObjectValue)?;

// ---- component statements ----

ComponentDeclaration:
  name=Identifier ':' type=ComponentType ('=' value=Value)?;

ComponentType:
  name=Identifier;

// ---- layout statements ----

LayoutStatement:
  'layout' name=Identifier? '{' layoutElements+=LayoutElement+ '}';

LayoutElement:
  LayoutComponent | RouteConnection;

LayoutComponent:
  'place' componentId=[ComponentDeclaration:Identifier] ':' value=ObjectValue;

RouteConnection:
  // TODO: Support referenced connections?
  RouteNamedConnection;

RouteNamedConnection:
  // Narrow component options in validation?
  'route' componentId=[ComponentDeclaration:Identifier] ':' value=ArrayValue;

// ---- values ----

Value: ObjectValue | ArrayValue | LiteralValue;

ArrayValue:
  '[' (elements+=Value (',' elements+=Value)*)? ','? ']';

ObjectValue:
  '{' (properties+=ObjectProperty (',' properties+=ObjectProperty)*)? ','? '}';

ObjectProperty:
  TagsProperty | KeyValue;

TagsProperty:
  'tags' ':' TagRefList;

KeyValue:
  key=PropertyKey ':' value=Value;

LiteralValue:
  IdentifierValue | StringValue | NumberValue | BooleanValue;

IdentifierValue:
  value=Identifier;

StringValue:
  value=String;

NumberValue:
  value=Number;

BooleanValue:
  value=('true' | 'false');

PropertyKey returns string:
  Identifier | String | 'tag' | 'tagset'
;

// ---- terminals ----

terminal Identifier: /[_a-zA-Z]\w*/;
terminal String: /"[^"]*"/;
terminal Number: /-?\d+(\.\d+)?/;

hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
