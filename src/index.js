import { config } from './config/config.js';
import sequelize from './config/database.js';
import storageService from './services/storage.js';

// Initialize services
const initializeServices = async () => {
  try {
    // Initialize storage service
    await storageService.initialize();
    console.log('Storage service initialized');

    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    throw error;
  }
};

// Initialize services when the application starts
initializeServices().catch(error => {
  console.error('Initialization error:', error);
  process.exit(1);
});

// Export the initialization function for use in Azure Functions
export { initializeServices };
