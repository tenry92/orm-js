import * as orm from 'orm-js/decorators';
import Group from './group';


@orm.entity()
export default class User {
  @orm.field()
  @orm.id()
  id: number;
  
  @orm.field()
  userName: string;
  
  @orm.field()
  emailAddress: string;
  
  @orm.field()
  passwordHash: string;
  
  @orm.field()
  @orm.associate(Group, 'users')
  groups: Group[];
}