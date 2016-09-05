export type EntityClass = { new(): Object };

export interface Query {
  target: EntityClass;
  
  distinct?: boolean;
  limit?: number;
  offset?: number;
  orders?: Order[];
  groups?: ExpressionNode[];
  condition?: ExpressionNode;
  aliases?: Alias[];
  // having?: ExpressionNode[]; - todo
}

export interface Order {
  field: string;
  order?: string;
}

export interface ExpressionNode {
  type: string;
}

export interface BinaryNode extends ExpressionNode {
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface LiteralNode extends ExpressionNode {
  value: any;
}

export interface FieldNode extends ExpressionNode {
  field: string;
}

export interface CallNode extends ExpressionNode {
  function: string;
  parameters: ExpressionNode[];
}

export interface Alias {
  node: ExpressionNode;
  alias: string;
}
