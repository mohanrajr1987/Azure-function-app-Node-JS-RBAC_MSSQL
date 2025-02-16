import { app } from '@azure/functions';
import { roleController } from '../../../controllers/role.js';
import { authenticate, authorize } from '../../../middlewares/auth.js';
import { validate, roleSchemas } from '../../../middlewares/validation.js';

app.http('manageRoles', {
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  authLevel: 'anonymous',
  route: 'roles/{id?}',
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

      // Authorize role management
      if (!authorize(request, 'role:manage')) {
        return {
          status: 403,
          body: { message: 'Forbidden' }
        };
      }

      const { params } = context.bindingData;
      const roleId = params?.id;

      switch (request.method) {
        case 'GET':
          if (roleId) {
            const role = await roleController.getRole(roleId);
            if (!role) {
              return {
                status: 404,
                body: { message: 'Role not found' }
              };
            }
            return {
              status: 200,
              body: role
            };
          } else {
            const roles = await roleController.listRoles();
            return {
              status: 200,
              body: roles
            };
          }

        case 'POST':
          const createBody = await request.json();
          if (!validate(roleSchemas.createRole, createBody)) {
            return {
              status: 400,
              body: { message: 'Invalid request body' }
            };
          }
          const newRole = await roleController.createRole(createBody);
          return {
            status: 201,
            body: newRole
          };

        case 'PUT':
          if (!roleId) {
            return {
              status: 400,
              body: { message: 'Role ID is required' }
            };
          }
          const updateBody = await request.json();
          if (!validate(roleSchemas.updateRole, updateBody)) {
            return {
              status: 400,
              body: { message: 'Invalid request body' }
            };
          }
          const updatedRole = await roleController.updateRole(roleId, updateBody);
          if (!updatedRole) {
            return {
              status: 404,
              body: { message: 'Role not found' }
            };
          }
          return {
            status: 200,
            body: updatedRole
          };

        case 'DELETE':
          if (!roleId) {
            return {
              status: 400,
              body: { message: 'Role ID is required' }
            };
          }
          await roleController.deleteRole(roleId);
          return {
            status: 204
          };

        default:
          return {
            status: 405,
            body: { message: 'Method not allowed' }
          };
      }
    } catch (error) {
      context.error('Role management error:', error);
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
