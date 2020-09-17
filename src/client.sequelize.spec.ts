import * as lib from './index';
import { Sequelize, Model, DataTypes } from 'sequelize';

const dbUrl = process.env.AURORA_TEST_DB_URL;

console.log(dbUrl);

describe('Simulate raw postgres client', () => {
  test('create table, insert and retrieve a record', async () => {
    const client = new lib.Client(dbUrl);
    const options = client.dataApiRetrievePostgresDataApiClientConfig();
    console.log(options);

    const sequelize = new Sequelize({
      ...(options as any),
      dialect: 'postgres',
      dialectModule: lib,
    });

    await sequelize.authenticate();

    class User extends Model {
      public id!: number; // Note that the `null assertion` `!` is required in strict mode.
      public name!: string;
      public age!: number | null; // for nullable fields
    }

    User.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: new DataTypes.STRING(128),
          allowNull: false,
        },
        age: {
          type: new DataTypes.INTEGER(),
          allowNull: true,
        },
      },
      {
        tableName: 'users',
        sequelize, // passing the `sequelize` instance is required
      },
    );

    await sequelize.sync({ alter: true });

    const newUser = await User.create({
      name: 'Johnny',
      age: 30,
    });
    console.log(newUser.id, newUser.name, newUser.age);

    const foundUser = await User.findOne({ where: { name: 'Johnny' } });
    expect(foundUser).toBeTruthy();
    expect(foundUser.name).toBe('Johnny');
    expect(foundUser.id).toBeGreaterThan(0);

    await sequelize.close();
  });
});
