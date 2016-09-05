import { Query } from './query';
import { Schema } from './schema';

export abstract class AbstractDatabase {
  schema: Schema;
  
  abstract async connect();
  abstract async createSchema();
  abstract async findAll<T>(query: Query, extra: Object[]): Promise<T[]>;
  abstract async insert(query: Query, item: Object);
  abstract async delete(query: Query, item?: Object);
  abstract async total(query: Query): Promise<number>;
}
