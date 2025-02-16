import { config } from '../src/config/config.js';
import sequelize from '../src/config/database.js';

// Use test database
config.database.name = `${config.database.name}_test`;

// Sync database before tests
before(async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Test database synced');
  } catch (error) {
    console.error('Failed to sync test database:', error);
    process.exit(1);
  }
});

// Clean up after tests
after(async () => {
  try {
    await sequelize.close();
    console.log('Test database connection closed');
  } catch (error) {
    console.error('Failed to close test database connection:', error);
    process.exit(1);
  }
});
