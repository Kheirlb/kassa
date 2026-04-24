import "./kassa-base"
import "./kassa-components"
import "./kassa-connections"

Group:
  'group' name=Identifier '='? block=GroupBlock;

GroupBlock:
  '{' statements+=GroupStatements* '}';

GroupStatements:
  GroupName
| TagSetTagsProperty
| ComponentDeclaration
| ConnectionStatement;

GroupName:
  'name' ':' name=String;
