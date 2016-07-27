import 'reflect-metadata';
import * as orm from './orm';
import * as schema from './schema';
import { EntityClass } from './query';


export interface IdOptions {
  coalition?: string | string[];
}


export function Entity() {
  return (target: Function) => {
    // let tableName = changeCase.snake(target.name);
  };
}

export function Extends(base: EntityClass) {
  return (target: Function) => {
    let table = orm.schema.getTable(target);
    let baseTable = orm.schema.getTable(base);
    table.extends = baseTable;
    baseTable.extendedBy.push(table);
    
    // todo: error if baseTable.idField is not available
    table.idField = table.createField(baseTable.idField.name, baseTable.idField.type);
  };
}

export function Field() {
  return (target: Object, propertyKey: string) => {
    let type = Reflect.getMetadata('design:type', target, propertyKey);
    
    let tableName = target.constructor.name;
    let fieldName = propertyKey;
    
    let table = orm.schema.getTable(target.constructor);
    let field: schema.Field;
    if(table.hasField(fieldName)) {
      field = table.getField(fieldName);
      field.type = type;
    } else {
      field = table.createField(fieldName, type);
    }
    
    
    if(type == Array) field.isArray = true;
  };
}

export function Associate(ref: EntityClass, reversedBy: string) {
  return (target: Object, propertyKey: string) => {
    Field()(target, propertyKey);
    
    if(!ref) return; // expecting reversed ref from yet unknown ref
    
    let tableName = target.constructor.name;
    let fieldName = propertyKey;
    
    let table = orm.schema.getTable(target.constructor);
    let field = table.getField(fieldName);
    
    let refTable = orm.schema.getTable(ref);
    let refField = refTable.getField(reversedBy);
    
    if(!refField) {
      throw new Error(`Unknown field ${reversedBy} in ${refTable.name}, referenced by ${tableName}.${fieldName}.`);
    }
    
    field.associate(refField);
  };
}

export function Id(options: IdOptions = {}) {
  return (target: Object, propertyKey: string) => {
    Field()(target, propertyKey);
    
    let tableName = target.constructor.name;
    let fieldName = propertyKey;
    
    let table = orm.schema.getTable(target.constructor);
    let field = table.getField(fieldName);
    
    if(options.coalition) {
      let coalition: string[] = [];
      
      if(typeof options.coalition == 'string') {
        coalition = (<string> options.coalition).split(/[\s,]+/);
      } else {
        coalition = <string[]> options.coalition;
      }
      
      if(coalition.length > 0) {
        table.idFields = [ field ];
        
        for(let partner of coalition) {
          Field()(target, partner);
          let partnerField = table.getField(partner);
          table.idFields.push(partnerField);
        }
      } else {
        table.idField = field;
      }
    } else {
      table.idField = field;
    }
  };
}