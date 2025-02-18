import { userController } from '../../controllers/user.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { validate, userSchemas } from '../../middlewares/validation.js';
import { createContext, executeMiddleware, handleError } from '../shared/middleware.js';
import { parseCookies } from '../../middlewares/cookieParser.js';

const routeHandlers = {
  'POST /register': {
    handler: userController.register,
    middleware: [validate(userSchemas.register)]
  },
  'POST /login': {
    handler: userController.login,
    middleware: [validate(userSchemas.login)]
  },
  'GET /profile': {
    handler: userController.getProfile,
    middleware: [authenticate]
  },
  'PUT /profile': {
    handler: userController.updateProfile,
    middleware: [authenticate, validate(userSchemas.updateProfile)]
  },
  'GET /': {
    handler: userController.listUsers,
    middleware: [authenticate, authorize('user:read')]
  },
  'POST /:userId/deactivate': {
    handler: userController.deactivateUser,
    middleware: [authenticate, authorize('user:update')]
  },
  'POST /refresh': {
    handler: userController.refreshToken,
    middleware: []
  }
};

export default async function (context, req) {
  try {
    const route = context.bindingData.route || '';
    const method = req.method;
    const routeKey = `${method} /${route}`;
    
    const handler = routeHandlers[routeKey];
    if (!handler) {
      context.res = {
        status: 404,
        body: { message: 'Route not found' }
      };
      return;
    }

    // Initialize context and execute middleware
    const { req: request, res } = await createContext(context, req);
    await executeMiddleware([parseCookies, ...handler.middleware, handler.handler], request, res);

    // Set default response if not set
    if (!context.res) {
      context.res = {
        status: 200,
        body: { message: 'Success' }
      };
    }
  } catch (error) {
    handleError(context, error);
  }
}
