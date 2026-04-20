import "./kassa-base"
import "./kassa-components"
import "./kassa-connections"

ConnectionGroup:
  'connect' name=Identifier '{' connectionStatements+=ConnectionStatement* '}';
