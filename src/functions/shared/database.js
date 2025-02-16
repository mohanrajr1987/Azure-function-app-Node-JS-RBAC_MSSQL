import { initializeDatabase } from '../../config/database.js';
import { User, Role, Permission, Document } from '../../models/index.js';

let isInitialized = false;

export const initializeModels = async () => {
  if (!isInitialized) {
    const sequelize = await initializeDatabase();

    // Initialize models with the sequelize instance
    const models = [User, Role, Permission, Document];
    for (const model of models) {
      if (model.initialize) {
        await model.initialize(sequelize);
      }
    }

    // Sync database in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync();
    }

    isInitialized = true;
  }
};
