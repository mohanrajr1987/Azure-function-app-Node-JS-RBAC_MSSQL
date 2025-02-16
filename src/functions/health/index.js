import { app } from '@azure/functions';
import { initializeServices } from '../../index.js';
import { loggingMiddleware } from '../../middlewares/logging.js';
import { logInfo, logError, startOperation } from '../../utils/logger.js';

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async (request, context) => {
    return loggingMiddleware(context, request, async () => {
      try {
        // Start a new operation for performance tracking
        const { operation, end } = startOperation('healthCheck');

        try {
          // Check database and storage connections
          await initializeServices();

          // Log successful health check
          logInfo('Health check successful', {
            environment: process.env.NODE_ENV,
            functionName: context.executionContext.functionName
          });

          // End operation as successful
          end(true);

          return {
            status: 200,
            body: {
              status: 'healthy',
              timestamp: new Date().toISOString(),
              environment: process.env.NODE_ENV
            }
          };
        } catch (error) {
          // End operation as failed
          end(false, { error: error.message });
          throw error;
        }
      } catch (error) {
        // Log error with context
        logError(error, {
          functionName: context.executionContext.functionName,
          operation: 'healthCheck'
        });

        return {
          status: 503,
          body: {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: process.env.NODE_ENV === 'development' ? error.message : 'Service unavailable'
          }
        };
      }
    });
  }
});
