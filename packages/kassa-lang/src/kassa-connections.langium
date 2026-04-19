import "./kassa-components"

ConnectionStatement:
  start=ConnectedComponent connections+=ConnectionKind+;

ConnectionKind:
  standard=StandardConnection | direct=DirectConnection;

StandardConnection:
  operator='-->' target=ConnectedComponent;

DirectConnection:
  DirectConnectionToComponent | DirectConnectionToConnection;

DirectConnectionToComponent:
  operator='->' target=ConnectedComponent;

ConnectedComponent:
  ref=ConnectedComponentRef | define=ConnectedComponentDefine;

ConnectedComponentRef:
  inlet=PortRef? componentIdRef=[ComponentDeclaration] outlet=PortRef?;

ConnectedComponentDefine:
  inlet=PortRef? componentId=ComponentDeclaration outlet=PortRef?;

PortRef:
  '[' portName=[PortElement] ']';

DirectConnectionToConnection:
  operator1='->' namedConnection=[NamedConnection] operator2='->' target=ConnectedComponent;

NamedConnection:
  name=Identifier ':' 'NamedConnection';
