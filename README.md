# orm-js

Note: this module is still in the early alpha phase and still very experimental.
Support for JavaScript (i.e., not using TypeScript) isn't provided yet.

This module allows you to map your entity classes, as written in JavaScript or
TypeScript, to a database schema, using decorators. Support for SQLite is
available through the separate module `orm-js-sqlite`, support for other
databases is planned.

*orm-js* is designed to work with JavaScript *Promise*. It's suitable to work
with `async/await` in TypeScript.


## Introduction

Many web applications consist of code (such as JavaScript) and data stored in a
database system (such as MySQL, SQLite). *orm-js* provides you some abstraction
in order to save your data object to the database or retieve the data mapped
back to an object. It also takes care for the database creation and the
relations between the various tables (entities).

Take a look at the following code snippet:

```TypeScript
import * as orm from 'orm-js/decorators';


@orm.Entity() // mark the following class as an entity
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
}
~~~

The entity name (`User`) as well as the property names and types are
automatically determined by *orm-js*, you don't need to take care of the naming
(unless you have two entities with the same name).

Properties missing the `@orm.Field()` decorator will not be saved to the
database, the field won't be created in the schema. You can optionally use
`@orm.Id()` for a single field to mark it as the primary key, which is used to
uniquely identify a single data record.

You can declare your entities in several JavaScript or TypeScript files or put
several of them in a single file. It's your responsibility to load all these
files in order to use the *orm-js* system. For example, you can put all your
entity files in a single directory, which you can scan for files to `require()`.
In this example, a simple `require('./user')` is enough to tell `orm-js` about
this entity (because of the `@orm.Entity()` decorator).

After you've loaded all your entities, you can connect to your database and use
`orm-js`.


## Database Connection

*orm-js* itself does not provide connection to a database. Currently there's
only `orm-js-sqlite` available. Before you can use *orm-js* (you may load your
entities before, however), you have to bind a database connection:

~~~TypeScript
import * as orm from 'orm-js';
import SqliteDatabase from 'orm-js-sqlite';

let connection = new SqliteDatabase('database.db');
orm.setDatabase(connection);

async () => {
  try {
    await orm.connect();
    console.log('Database is connected!');
  } catch(err) {
    console.error(err);
  }
}();
~~~


## Schema Creation

The database schema (the tables, fields, relations etc.) is managed by `orm-js`,
you usually can't use any existing schema. After you've loaded your entities and
connected to your database, you use `build()` to create a new database schema:

~~~TypeScript
import * as orm from 'orm-js/orm';

async () => {
  try {
    await orm.build();
    console.log('Schema created!');
  } catch(err) {
    console.error(err);
  }
}();
~~~


## Repositories

In order to get or save entity objects, you can use the `Repository` class
provided by `orm-js/orm`. For each entity, you have to instanciate a new
`Repository` with the entity class passed as its parameter. The following
example creates a new user and retrieves it back from the database:

~~~TypeScript
import * as orm from 'orm-js/orm';
import User from './user';

async () => {
  let repo = new orm.Repository(User);
  
  let user = new User();
  user.userName = 'Hero Brain';
  user.emailAddress = 'hero@brain.net';
  
  // you can use insert() for both new and updating entities
  await repo.insert(user);
  
  // a numeric ID field is automatically set by the insert operation
  console.log(`User got the id: ${user.id}`);
  
  // get an array of User entities
  let userList = await repo.findAll();
  console.log(userList);
}();
~~~


## Install

Via npm:

    $ npm install orm-js

You'll need to install a database connector for *orm-js*, in order to connect to
an actual database. Currently there's only `orm-js-sqlite` available:

    $ npm install orm-js-sqlite

When using TypeScript, make sure to enable both `experimentalDecorators` and
`emitDecoratorMetadata` in your tsconfig.json:

~~~JSON
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    ...
  },
  ...
}
~~~


## License

orm-js is licensed under the ISC License.