import { app } from '@azure/functions';
import { userController } from '../../../controllers/user.js';
import { authenticate } from '../../../middlewares/auth.js';
import { validate, userSchemas } from '../../../middlewares/validation.js';

app.http('profile', {
  methods: ['GET', 'PUT'],
  authLevel: 'anonymous',
  route: 'users/profile',
  handler: async (request, context) => {
    try {
      // Authenticate request
      const authResult = await authenticate(request);
      if (!authResult.authenticated) {
        return {
          status: 401,
          body: { message: 'Unauthorized' }
        };
      }

      if (request.method === 'GET') {
        const profile = await userController.getProfile(authResult.user);
        return {
          status: 200,
          body: profile
        };
      } else if (request.method === 'PUT') {
        const body = await request.json();

        if (!validate(userSchemas.updateProfile, body)) {
          return {
            status: 400,
            body: { message: 'Invalid request body' }
          };
        }

        const updatedProfile = await userController.updateProfile(authResult.user, body);
        return {
          status: 200,
          body: updatedProfile
        };
      }
    } catch (error) {
      context.error('Profile error:', error);
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
