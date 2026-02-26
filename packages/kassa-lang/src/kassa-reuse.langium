import "./kassa-base"
import "./kassa-components"

FileImport: //NEW: imports of the same file are gathered in a list
  'import' '{' 
    componentImports+=ComponentImport (',' componentImports+=ComponentImport)* 
  '}' 'from' file=StringValue; 

ComponentImport:
  componentId=[ComponentDeclaration] ('as' name=Identifier)?;
