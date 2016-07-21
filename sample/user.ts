import * as orm from 'orm-js/decorators';
import Group from './group';


@orm.Entity()
export default class User {
  @orm.Field()
  @orm.Id()
  id: number;
  
  @orm.Field()
  userName: string;
  
  @orm.Field()
  emailAddress: string;
  
  @orm.Field()
  passwordHash: string;
  
  @orm.Field()
  @orm.Associate(Group, 'users')
  groups: Group[];
}