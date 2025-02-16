import { app } from '@azure/functions';
import { userController } from '../../../controllers/user.js';
import { validate, userSchemas } from '../../../middlewares/validation.js';

app.http('register', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users/register',
  handler: async (request, context) => {
    try {
      const body = await request.json();

      if (!validate(userSchemas.register, body)) {
        return {
          status: 400,
          body: { message: 'Invalid request body' }
        };
      }

      const result = await userController.register(body);
      return { 
        status: 201,
        body: result
      };
    } catch (error) {
      context.error('Register error:', error);
      return {
        status: 500,
        body: {
          message: 'Internal Server Error',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      };
    }
  }
});
