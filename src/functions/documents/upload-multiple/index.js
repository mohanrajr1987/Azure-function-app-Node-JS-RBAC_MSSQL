import { app } from '@azure/functions';
import { documentController } from '../../../controllers/document.js';
import { authenticate, authorize } from '../../../middlewares/auth.js';
import { validate, documentSchemas } from '../../../middlewares/validation.js';

app.http('uploadMultipleDocuments', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents/multiple',
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

      // Authorize document creation
      if (!authorize(request, 'document:create')) {
        return {
          status: 403,
          body: { message: 'Forbidden' }
        };
      }

      // Parse multipart form data
      const formData = await parseMultipartFormData(request);
      
      if (!validate(documentSchemas.uploadDocument, formData.fields)) {
        return {
          status: 400,
          body: { message: 'Invalid request body' }
        };
      }

      // Add files to request object for controller
      request.files = formData.files;
      request.body = formData.fields;

      const result = await documentController.uploadMultipleDocuments(request);
      return {
        status: 201,
        body: result
      };
    } catch (error) {
      context.error('Multiple documents upload error:', error);
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

// Helper function to parse multipart form data
async function parseMultipartFormData(request) {
  const contentType = request.headers.get('content-type');
  const boundary = contentType.split('boundary=')[1];

  const buffer = await request.arrayBuffer();
  const parts = new TextDecoder().decode(buffer).split('--' + boundary);
  const formData = {};
  const files = [];

  parts.forEach(part => {
    if (part.includes('Content-Disposition')) {
      const fieldMatch = part.match(/name="([^"]+)"/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        if (part.includes('filename')) {
          const fileMatch = part.match(/filename="([^"]+)"/);
          if (fileMatch) {
            const filename = fileMatch[1];
            const fileContent = part.split('\\r\\n\\r\\n')[1].trim();
            files.push({
              fieldname: fieldName,
              originalname: filename,
              buffer: Buffer.from(fileContent)
            });
          }
        } else {
          const value = part.split('\\r\\n\\r\\n')[1].trim();
          try {
            formData[fieldName] = JSON.parse(value);
          } catch {
            formData[fieldName] = value;
          }
        }
      }
    }
  });

  return { fields: formData, files };
}
