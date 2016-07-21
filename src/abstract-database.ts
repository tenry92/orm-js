import { Schema, Table } from './schema';
import { Query } from './query';


export abstract class AbstractDatabase {
  schema: Schema;
  
  abstract async connect();
  abstract async createSchema();
  abstract async findAll<T>(query: Query, extra: Object[]): Promise<T[]>;
  abstract async insert(query: Query, item: Object);
  abstract async delete(query: Query, item?: Object);
  abstract async total(query: Query): Promise<number>;
}