import "./kassa-components"

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

ConnectedComponent:
  ref=ConnectedComponentRef | define=ConnectedComponentDefine;

ConnectedComponentRef:
  inlet=Port? componentId=[ComponentDeclaration] outlet=Port?;

ConnectedComponentDefine:
  inlet=Port? componentId=ComponentDeclaration outlet=Port?;

Port:
  '[' portName=Identifier ']';
