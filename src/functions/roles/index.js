import { roleController } from '../../controllers/role.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { validate, roleSchemas } from '../../middlewares/validation.js';

const routeHandlers = {
  'POST /': {
    handler: roleController.createRole,
    middleware: [
      authenticate,
      authorize('role:manage'),
      validate(roleSchemas.createRole)
    ]
  },
  'GET /': {
    handler: roleController.listRoles,
    middleware: [authenticate, authorize('role:manage')]
  },
  'GET /:id': {
    handler: roleController.getRole,
    middleware: [authenticate, authorize('role:manage')]
  },
  'PUT /:id': {
    handler: roleController.updateRole,
    middleware: [
      authenticate,
      authorize('role:manage'),
      validate(roleSchemas.updateRole)
    ]
  },
  'DELETE /:id': {
    handler: roleController.deleteRole,
    middleware: [authenticate, authorize('role:manage')]
  },
  'POST /assign': {
    handler: roleController.assignRoleToUser,
    middleware: [
      authenticate,
      authorize('role:manage'),
      validate(roleSchemas.assignRole)
    ]
  },
  'DELETE /:userId/:roleId': {
    handler: roleController.removeRoleFromUser,
    middleware: [authenticate, authorize('role:manage')]
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

    // Create mock response object
    const res = {
      status: function(code) {
        context.res = { ...context.res, status: code };
        return this;
      },
      json: function(data) {
        context.res = { ...context.res, body: data };
        return this;
      }
    };

    // Execute middleware chain
    let middlewareIndex = 0;
    const next = async () => {
      if (middlewareIndex < handler.middleware.length) {
        await handler.middleware[middlewareIndex++](req, res, next);
      } else {
        await handler.handler(req, res);
      }
    };

    await next();

    // Set default response if not set
    if (!context.res) {
      context.res = {
        status: 200,
        body: { message: 'Success' }
      };
    }
  } catch (error) {
    context.log.error('Error in role function:', error);
    context.res = {
      status: 500,
      body: {
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    };
  }
}
