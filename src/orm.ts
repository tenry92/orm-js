import * as fs from 'fs';
import { join as joinPath } from 'path';
import * as changeCase from 'change-case';
import { Schema, Table } from './schema';
import { AbstractDatabase } from './abstract-database';
import { Query, EntityClass } from './query';
import * as node from './query';


let database: AbstractDatabase = null;
let connected = false;
export let schema = new Schema();


function snakeFieldName(str: string) {
  return str.split('.').map(name => changeCase.snake(name)).join('.');
}

export function setDatabase(db: AbstractDatabase) {
  database = db;
  database.schema = schema;
}

export async function connect() {
  if(connected) return;
  
  await database.connect();
  connected = true;
}

export async function build() {
  await connect();
  await database.createSchema();
}

export async function dumpSchema() {
  await connect();
  schema.dump();
}

export class Repository<T> {
  table: Table;
  
  constructor(private entity: { new(): T }) {
    this.table = schema.getTable(entity);
  }
  
  query(): QueryBuilder<T> {
    return new QueryBuilder<T>(this.entity);
  }
  
  async findOne(extra?: Object) { return this.query().findOne(extra); }
  async findAll(extra?: Object[]) { return this.query().findAll(extra); }
  async insert(item: T) { return this.query().insert(item); }
  async delete(item: T) { return this.query().delete(item); }
}

export class QueryBuilder<T> {
  private query: Query;
  table: Table;
  
  constructor(public entity: { new(): T }) {
    this.query = {
      target: entity
    };
    this.table = schema.getTable(entity);
  }
  
  
  /* finding results */
  
  async findOne(extra?: Object) {
    // this.query.limit = 1;
    // issue: limit = 1 wouldn't work with X-to-many assoc joins
    let arr = extra && [];
    let result = await database.findAll<T>(this.query, arr);
    
    if(result.length > 0) {
      for(let key in arr[0]) {
        extra[key] = arr[0][key];
      }
      
      return result[0];
    } else {
      return null;
    }
  }
  
  async findAll(extra?: Object[]) {
    return await database.findAll<T[]>(this.query, extra);
  }
  
  async insert(item: T) {
    await database.insert(this.query, item);
  }
  
  async delete(item?: T) {
    await database.delete(this.query, item);
  }
  
  async total() {
    return await database.total(this.query);
  }
  
  
  /* query params */
  
  distinct() {
    this.query.distinct = true;
    return this;
  }
  
  limit(limit: number) {
    this.query.limit = limit;
    return this;
  }
  
  offset(offset: number) {
    this.query.offset = offset;
    return this;
  }
  
  sortBy(entity: EntityClass, field: string, order?: string): this;
  sortBy(field: string, order?: string): this;
  
  sortBy(a: any, b?: any, c?: any) {
    let entity = this.query.target;
    let field: string;
    let order = 'asc';
    
    if(c != null) {
      entity = a;
      field = b;
      order = c;
    } else if(typeof b == 'string') {
      field = a;
      order = b;
    } else if(b != null) {
      entity = a;
      field = b;
    } else {
      field = a;
    }
    
    let table = schema.getTable(entity);
    
    if(!this.query.orders) this.query.orders = [];
    
    this.query.orders.push({
      field: `${this.table.name}.${snakeFieldName(field)}`,
      order: order
    });
    
    return this;
  }
  
  groupBy(entity: EntityClass, field: string): this;
  groupBy(field: string): this;
  
  groupBy(a?: any, b?: any) {
    let entity = this.query.target;
    let field: string;
    
    if(b != null) {
      entity = a;
      field = b;
    } else if(typeof a == 'object') {
      this.query.groups.push(a);
      return this;
    } else {
      field = a;
    }
    
    let table = schema.getTable(entity);
    
    if(!this.query.groups) this.query.groups = [];
    
    let node = <node.FieldNode>{
      type: 'field',
      field: `${this.table.name}.${field}`
    };
    this.query.groups.push(node);
    
    return this;
  }
  
  alias(node: node.ExpressionNode, alias: string) {
    if(!this.query.aliases) this.query.aliases = [];
    
    this.query.aliases.push({ node, alias });
  }
  
  
  /* conditions */
  
  where(...expr: node.ExpressionNode[]) {
    return this.andWhere(...expr);
  }
  
  andWhere(...expr: node.ExpressionNode[]) {
    for(let item of expr) {
      if(!this.query.condition) {
        this.query.condition = item;
      } else {
        this.query.condition = this.and(this.query.condition, item);
      }
    }
    
    return this;
  }
  
  orWhere(...expr: node.ExpressionNode[]) {
    for(let item of expr) {
      if(!this.query.condition) {
        this.query.condition = item;
      } else {
        this.query.condition = this.or(this.query.condition, item);
      }
    }
    
    return this;
  }
  
  and(...expr: node.ExpressionNode[]) {
    return this.commonLogical('and', ...expr);
  }
  
  or(...expr: node.ExpressionNode[]) {
    return this.commonLogical('or', ...expr);
  }
  
  private commonLogical(type: string, ...expr: node.ExpressionNode[]) {
    let root: node.ExpressionNode = null;
    
    for(let item of expr) {
      if(!root) {
        root = item;
      } else {
        let link = <node.BinaryNode>{
          type: type,
          left: root,
          right: item
        };
        
        root = link;
      }
    }
    
    return root;
  }
  
  eq(left: node.ExpressionNode | string, right: node.ExpressionNode | string) {
    return this.commonBinary('eq', left, right);
  }
  
  neq(left: node.ExpressionNode | string, right: node.ExpressionNode | string) {
    return this.commonBinary('neq', left, right);
  }
  
  lt(left: node.ExpressionNode | string, right: node.ExpressionNode | string) {
    return this.commonBinary('lt', left, right);
  }
  
  le(left: node.ExpressionNode | string, right: node.ExpressionNode | string) {
    return this.commonBinary('le', left, right);
  }
  
  gt(left: node.ExpressionNode | string, right: node.ExpressionNode | string) {
    return this.commonBinary('gt', left, right);
  }
  
  ge(left: node.ExpressionNode | string, right: node.ExpressionNode | string) {
    return this.commonBinary('ge', left, right);
  }
  
  private commonBinary(type: string,
    left: node.ExpressionNode | string, right: node.ExpressionNode | string) {
    if(typeof left == 'string') {
      left = this.field(<string> left);
    }
    
    if(typeof right == 'string') {
      left = this.field(<string> right);
    }
    
    return <node.BinaryNode> {
      type: type,
      left: left,
      right: right
    };
  }
  
  
  /* functions */
  
  sum(param: node.ExpressionNode | string) {
    if(typeof param == 'string') {
      return <node.CallNode> {
        type: 'call',
        function: 'sum',
        parameters: [ this.field(<string> param) ]
      };
    } else {
      return <node.CallNode> {
        type: 'call',
        function: 'sum',
        parameters: [ param ]
      };
    }
  }
  
  
  quote(value: string) {
    return <node.LiteralNode>{
      type: 'literal',
      value: value
    };
  }
  
  field(name: string) {
    return <node.FieldNode> {
      type: 'field',
      field: `${this.table.name}.${snakeFieldName(name)}`
    };
  }
}