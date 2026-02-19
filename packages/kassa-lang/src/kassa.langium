grammar Kassa

entry Model: (Newline* items+=Item)* Newline*;

Item: Statement | ConnectionStmt;

// ---- connection langauge ----

Endpoint: inlet=Port? componentId=[Declaration:Identifier] (':' type=Type)? outlet=Port?;

Port: '[' portName=Identifier ']';

ConnectionStmt:
  ConnectionStart | ConnectionContinue;

ConnectionStart:
  start=Endpoint ('-->' targets+=Endpoint?)*;

ConnectionContinue:
  '-->' targets+=Endpoint?;

// ---- basic statements ----

Statement: Declaration;

Declaration:
  name=Identifier ':' type=Type ('=' value=Value)?;

Type:
  name=Identifier;

// ---- values ----

Value: ObjectValue | ArrayValue | LiteralValue;

ArrayValue:
  '[' (elements+=Value (',' elements+=Value)*)? ','? ']';

ObjectValue:
  '{' (properties+=KeyValue (',' properties+=KeyValue)*)? ','? '}';

KeyValue:
  key=Identifier ':' value=Value;

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

// ---- terminals ----

terminal Identifier: /[_a-zA-Z]\w*/;
terminal String: /"[^"]*"/;
terminal Number: /-?\d+(\.\d+)?/;

// newline is a real token
terminal Newline: /[ \t]*;?[ \t]*(\r?\n)+/;

// whitespace excludes newline
//hidden terminal WS: /[ \t]+/;
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
