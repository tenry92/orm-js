import * as orm from 'orm-js/decorators';
import User from './user';


@orm.entity()
export default class Group {
  @orm.field()
  @orm.id()
  id: number;
  
  @orm.field()
  name: string;
  
  @orm.field()
  @orm.associate(User, 'groups');
  users: User[];
}