import { app } from '@azure/functions';
import { documentController } from '../../../controllers/document.js';
import { authenticate, authorize } from '../../../middlewares/auth.js';
import { validate, documentSchemas } from '../../../middlewares/validation.js';
import { loggingMiddleware } from '../../../middlewares/logging.js';
import { logInfo, logError, startOperation } from '../../../utils/logger.js';

app.http('uploadDocument', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'documents',
  handler: async (request, context) => {
    return loggingMiddleware(context, request, async () => {
      const { operation, end } = startOperation('documentUpload');
      
      try {
        // Authenticate request
        const authResult = await authenticate(request);
        if (!authResult.authenticated) {
          logInfo('Unauthorized document upload attempt', {
            ip: request.headers['x-forwarded-for'] || request.headers['x-real-ip']
          });
          end(false, { reason: 'unauthorized' });
          return {
            status: 401,
            body: { message: 'Unauthorized' }
          };
        }

        // Authorize document creation
        if (!authorize(request, 'document:create')) {
          logInfo('Forbidden document upload attempt', {
            userId: authResult.user.id,
            role: authResult.user.role
          });
          end(false, { reason: 'forbidden' });
          return {
            status: 403,
            body: { message: 'Forbidden' }
          };
        }

        // Parse multipart form data
        const formData = await parseMultipartFormData(request);
        
        if (!validate(documentSchemas.uploadDocument, formData.fields)) {
          logInfo('Invalid document upload request', {
            userId: authResult.user.id,
            fields: formData.fields
          });
          end(false, { reason: 'validation_failed' });
          return {
            status: 400,
            body: { message: 'Invalid request body' }
          };
        }

        // Add file to request object for controller
        request.file = formData.files[0];
        request.body = formData.fields;

        logInfo('Processing document upload', {
          userId: authResult.user.id,
          fileName: request.file.originalname,
          fileSize: request.file.buffer.length
        });

        const result = await documentController.uploadDocument(request);

        logInfo('Document upload successful', {
          userId: authResult.user.id,
          documentId: result.id,
          fileName: result.fileName,
          fileSize: result.fileSize
        });

        end(true);

        return {
          status: 201,
          body: result
        };
      } catch (error) {
        logError(error, {
          functionName: context.executionContext.functionName,
          operation: 'documentUpload',
          userId: request.user?.id,
          fileName: request.file?.originalname
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
