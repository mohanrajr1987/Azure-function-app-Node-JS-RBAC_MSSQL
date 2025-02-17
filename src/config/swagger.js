import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Azure Functions RBAC API',
    version: '1.0.0',
    description: 'API documentation for Azure Functions with RBAC and SharePoint integration',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:7071',
      description: 'Local development server',
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
    schemas: {
      Error: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Error message',
          },
          error: {
            type: 'string',
            description: 'Detailed error information (only in development)',
          },
        },
      },
      SharePointSyncResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Status message of the sync operation',
          },
          syncDetails: {
            type: 'object',
            properties: {
              totalFiles: {
                type: 'integer',
                description: 'Total number of files found in SharePoint',
              },
              syncedFiles: {
                type: 'integer',
                description: 'Number of files successfully synced',
              },
              skippedFiles: {
                type: 'integer',
                description: 'Number of files skipped',
              },
              errors: {
                type: 'array',
                description: 'List of errors encountered during sync',
                items: {
                  type: 'object',
                  properties: {
                    fileName: {
                      type: 'string',
                      description: 'Name of the file that encountered an error',
                    },
                    error: {
                      type: 'string',
                      description: 'Error message for the file',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'SharePoint',
      description: 'SharePoint integration endpoints',
    },
    {
      name: 'Documents',
      description: 'Document management endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/functions/**/*.js'],
};

export const swaggerSpec = swaggerJSDoc(options);
