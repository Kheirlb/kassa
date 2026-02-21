import "./kassa-base"

DrawingStatement:
  'drawing' name=Identifier ('='? block=DrawingBlock)?;

DrawingBlock:
  '{' (properties+=DrawingProperty (','? properties+=DrawingProperty)*)? ','? '}';

DrawingProperty:
  DrawingHeight | DrawingWidth | DrawingScale | DrawingTitleBlock;

DrawingHeight:
  'height' ':' value=NumberValue;

DrawingWidth:
  'width' ':' value=NumberValue;

DrawingScale:
  'scale' ':' value=NumberValue;

DrawingTitleBlock:
  'titleBlock' ':' value=TitleBlock;

// ---- nested block ----

TitleBlock:
  '{' (properties+=TitleBlockProperty (','? properties+=TitleBlockProperty)*)? ','? '}';

TitleBlockProperty:
  TitleBlockTitle | TitleBlockAuthor | TitleBlockDate;

TitleBlockTitle:
  'title' ':' value=StringValue;

TitleBlockAuthor:
  'author' ':' value=StringValue;

// “better”: accept either "2026" or 2026
TitleBlockDate:
  'date' ':' value=(StringValue | NumberValue);