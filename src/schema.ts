import * as changeCase from 'change-case';
import { EntityClass } from './query';


export class Schema {
  tables = new Map<EntityClass | Function, Table>();
  
  hasTable(entity: EntityClass | Function) {
    return this.tables.has(entity);
  }
  
  getTable(entity: EntityClass | Function) {
    let table: Table;
    
    if(!this.tables.has(entity)) {
      table = new Table(entity);
      this.tables.set(entity, table);
    } else {
      table = this.tables.get(entity);
    }
    
    return table;
  }
  
  convertItemToObject(entity: Object) {
    let table = this.getTable(entity.constructor);
    
    let data = {};
    
    for(let field of table.fields.values()) {
      data[field.internalName] = entity[field.name];
    }
    
    return data;
  }
  
  convertObjectToItem<T>(data: Object,
    entity: { new(): T },
    prefix: string,
    item?: T): T {
    let table = this.getTable(entity);
    /* if all fields are null, return null */
    let isNull = true;
    
    if(table.idField) {
      if(data[`${prefix}.${table.idField.internalName}`] == null) {
        return null;
      }
    }
    
    if(!item) item = new entity();
    
    if(table.extends) {
      this.convertObjectToItem(data,
        <EntityClass> table.extends.entity,
        `${prefix}._base`, item);
    }
    
    for(let field of table.fields.values()) {
      if(field.associatedField) {
        let refEntity = field.associatedField.table.entity;
        let refPrefix = `${prefix}.${field.internalName}`;
        let refItem = this.convertObjectToItem(data, <EntityClass> refEntity, refPrefix);
        
        if(refItem) {
          if(field.associatedField.isArray) {
            if(!refItem[field.associatedField.name]) refItem[field.associatedField.name] = [];
            if(item) refItem[field.associatedField.name].push(item);
          } else {
            refItem[field.associatedField.name] = item;
          }
        }
        
        if(field.isArray) {
          if(!item[field.name]) item[field.name] = [];
          if(refItem) item[field.name].push(refItem);
        } else {
          item[field.name] = refItem;
        }
      } else {
        item[field.name] = data[`${prefix}.${field.internalName}`];
      }
      
      if(item[field.name] != null) isNull = false;
    }
    
    if(isNull) return null;
    
    return item;
  }
  
  dump() {
    let stream = process.stdout;
    stream.write(`Schema dump\n\n`);
    
    for(let table of this.tables.values()) {
      stream.write(`Table: ${table.name}`);
      if(table.extends) stream.write(` extends ${table.extends.name}`);
      stream.write(`\n`);
      
      for(let field of table.fields.values()) {
        let a = field == table.idField ? '*' : '';
        if(field.associatedField) {
          stream.write(`\tField: ${a}${field.internalName} -> `);
          if(field.leading) stream.write(`*`);
          stream.write(`${field.associatedField.table.name}.`);
          stream.write(`${field.associatedField.internalName}`);
          if(field.isArray) stream.write(`[]`);
          stream.write(`\n`);
        } else {
          stream.write(`\tField: ${a}${field.internalName}\n`);
        }
      }
      
      stream.write(`\n`);
    }
  }
}

/**
 * @brief Abstract database table.
 */
export class Table {
  name: string;
  fields = new Map<string, Field>();
  idField: Field; // only set, if a single field without coalition is the id
  idFields: Field[];
  extends: Table;
  extendedBy: Table[];
  
  constructor(public entity: Function) {
    this.name = changeCase.snake(entity.name);
    this.idField = null;
    this.idFields = [];
    this.extends = null;
    this.extendedBy = [];
  }
  
  createField(name: string, type?: Function) {
    let field = new Field(this, name, type);
    this.fields.set(field.internalName, field);
    return field;
  }
  
  getField(name: string) {
    name = changeCase.snake(name);
    return this.fields.get(name);
  }
  
  hasField(name: string) {
    name = changeCase.snake(name);
    return this.fields.has(name);
  }
}

/**
 * @brief Abstract database table field.
 */
export class Field {
  internalName: string;
  associatedField: Field;
  isArray: boolean;
  leading: boolean;
  joinTable: string;
  
  constructor(public table: Table, public name: string, public type?: Function) {
    this.internalName = changeCase.snake(name);
    
    this.associatedField = null;
    this.isArray = false;
    this.joinTable = null;
  }
  
  associate(field: Field) {
    this.associatedField = field;
    this.leading = true;
    
    field.associatedField = this;
    field.leading = false;
    
    if(this.isArray && field.isArray) {
      let tableName: string;
      
      if(this.table.name < field.table.name) {
        tableName = `${this.table.name}_${this.internalName}`;
      } else {
        tableName = `${field.table.name}_${field.internalName}`;
      }
      
      this.joinTable = field.joinTable = tableName;
    }
  }
}