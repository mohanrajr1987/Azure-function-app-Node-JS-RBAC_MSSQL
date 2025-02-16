import swaggerJsdoc from 'swagger-jsdoc';
import { join } from 'path';
import { readFileSync } from 'fs';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Azure Functions RBAC File Upload API',
    version: '1.0.0',
    description: 'API documentation for Azure Functions with RBAC and File Upload capabilities',
  },
  servers: [
    {
      url: process.env.FUNCTION_APP_URL || 'http://localhost:7071',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    join(process.cwd(), 'src', 'functions', '**', '*.js'),
    join(process.cwd(), 'src', 'models', '*.js'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

// Create a function to serve Swagger UI
export function createSwaggerUI() {
  const swaggerUiHtml = readFileSync(
    join(process.cwd(), 'node_modules', 'swagger-ui-dist', 'swagger-ui.html'),
    'utf8'
  );
  
  return swaggerUiHtml.replace(
    'https://petstore.swagger.io/v2/swagger.json',
    '/api/swagger.json'
  );
}
