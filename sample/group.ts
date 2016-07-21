import * as orm from 'orm-js/decorators';
import User from './user';


@orm.Entity()
export default class Group {
  @orm.Field()
  @orm.Id()
  id: number;
  
  @orm.Field()
  name: string;
  
  @orm.Field()
  @orm.Associate(User, 'groups');
  users: User[];
}