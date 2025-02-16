import { app } from '@azure/functions';
import { documentController } from '../../../controllers/document.js';
import { authenticate, authorize } from '../../../middlewares/auth.js';
import { loggingMiddleware } from '../../../middlewares/logging.js';
import { logInfo, logError, startOperation } from '../../../utils/logger.js';

app.http('listDocuments', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'documents',
  handler: async (request, context) => {
    return loggingMiddleware(context, request, async () => {
      const { operation, end } = startOperation('listDocuments');

      try {
        // Authenticate request
        const authResult = await authenticate(request);
        if (!authResult.authenticated) {
          logInfo('Unauthorized document list attempt', {
            ip: request.headers['x-forwarded-for'] || request.headers['x-real-ip']
          });
          end(false, { reason: 'unauthorized' });
          return {
            status: 401,
            body: { message: 'Unauthorized' }
          };
        }

        // Authorize document read
        if (!authorize(request, 'document:read')) {
          logInfo('Forbidden document list attempt', {
            userId: authResult.user.id,
            role: authResult.user.role
          });
          end(false, { reason: 'forbidden' });
          return {
            status: 403,
            body: { message: 'Forbidden' }
          };
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;

        logInfo('Processing document list request', {
          userId: authResult.user.id,
          role: authResult.user.role,
          page,
          limit
        });

        const documents = await documentController.listDocuments(authResult.user, page, limit);

        logInfo('Documents retrieved successfully', {
          userId: authResult.user.id,
          documentsCount: documents.length,
          page,
          limit
        });

        end(true, { 
          documentsCount: documents.length,
          page
        });

        return {
          status: 200,
          body: documents
        };
      } catch (error) {
        logError(error, {
          functionName: context.executionContext.functionName,
          operation: 'listDocuments',
          userId: request.user?.id,
          query: { page, limit }
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
