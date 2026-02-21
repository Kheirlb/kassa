// ---- values ----

Value:
  ObjectValue | ArrayValue | LiteralValue;

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

// PropertyKey returns string:
//   Identifier | String | 'tag' | 'tagset'
// ;

// ---- terminals ----

terminal Identifier: /[_a-zA-Z]\w*/;
terminal String: /"[^"]*"/;
terminal Number: /-?\d+(\.\d+)?/;

hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
