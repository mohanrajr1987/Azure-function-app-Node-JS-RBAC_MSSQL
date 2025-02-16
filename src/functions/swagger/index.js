import { app } from '@azure/functions';
import { swaggerSpec, createSwaggerUI } from '../../swagger/index.js';

app.http('swagger', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'swagger/{*path}',
  handler: async (request, context) => {
    const path = request.params.path || '';

    if (path === 'json') {
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(swaggerSpec),
      };
    }

    return {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: createSwaggerUI(),
    };
  },
});
