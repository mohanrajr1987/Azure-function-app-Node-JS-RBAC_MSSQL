import { app } from '@azure/functions';
import { userController } from '../../../controllers/user.js';
import { validate, userSchemas } from '../../../middlewares/validation.js';
import { loggingMiddleware } from '../../../middlewares/logging.js';
import { logInfo, logError, startOperation } from '../../../utils/logger.js';

app.http('login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users/login',
  handler: async (request, context) => {
    return loggingMiddleware(context, request, async () => {
      const { operation, end } = startOperation('userLogin');
      
      try {
        const body = await request.json();
        logInfo('Login attempt', { 
          email: body.email,
          functionName: context.executionContext.functionName 
        });

        if (!validate(userSchemas.login, body)) {
          logInfo('Login validation failed', { email: body.email });
          end(false, { reason: 'validation_failed' });
          return {
            status: 400,
            body: { message: 'Invalid request body' }
          };
        }

        const result = await userController.login(body);
        
        logInfo('Login successful', { 
          userId: result.user.id,
          email: result.user.email,
          role: result.user.role
        });

        end(true);

        return { 
          status: 200,
          body: result
        };
      } catch (error) {
        logError(error, {
          functionName: context.executionContext.functionName,
          operation: 'userLogin',
          email: request.body?.email
        });

        end(false, { error: error.message });

        return {
          status: error.status || 500,
          body: {
            message: error.status ? error.message : 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          }
        };
      }
    });
  }
});
