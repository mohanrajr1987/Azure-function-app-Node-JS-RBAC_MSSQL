import { Sequelize } from 'sequelize';
import { config } from './config.js';

let sequelize = null;

export const initializeDatabase = async () => {
  if (!sequelize) {
    sequelize = new Sequelize(
      config.database.name,
      config.database.username,
      config.database.password,
      {
        host: config.database.host,
        port: config.database.port,
        dialect: 'mssql',
        dialectOptions: {
          options: {
            encrypt: true,
            trustServerCertificate: config.database.trustServerCertificate
          }
        },
        logging: config.database.logging ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    try {
      await sequelize.authenticate();
      console.log('Database connection established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      throw error;
    }
  }
  return sequelize;
};

export default sequelize;
