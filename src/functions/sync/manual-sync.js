import { app } from '@azure/functions';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { loggingMiddleware } from '../../middlewares/logging.js';
import { logInfo, logError, startOperation } from '../../utils/logger.js';
import { syncSharePointFiles } from './sharepoint-sync.js';

/**
 * @swagger
 * /api/sharepoint-sync/manual:
 *   post:
 *     summary: Manually trigger SharePoint to Blob Storage sync
 *     description: Manually triggers the sync process from SharePoint to Azure Blob Storage
 *     tags: [SharePoint]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       202:
 *         description: Sync process started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "SharePoint sync process started"
 *                 operationId:
 *                   type: string
 *                   example: "sync-op-123"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.http('manualSharePointSync', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sharepoint-sync/manual',
  handler: async (request, context) => {
    return loggingMiddleware(context, request, async () => {
      const { operation, end } = startOperation('manualSharePointSync');

      try {
        // Authenticate request
        const authResult = await authenticate(request);
        if (!authResult.authenticated) {
          logInfo('Unauthorized manual sync attempt', {
            ip: request.headers['x-forwarded-for'] || request.headers['x-real-ip']
          });
          end(false, { reason: 'unauthorized' });
          return {
            status: 401,
            body: { message: 'Unauthorized' }
          };
        }

        // Authorize sync operation
        if (!authorize(request, 'sync:execute')) {
          logInfo('Forbidden manual sync attempt', {
            userId: authResult.user.id,
            role: authResult.user.role
          });
          end(false, { reason: 'forbidden' });
          return {
            status: 403,
            body: { message: 'Forbidden' }
          };
        }

        // Start sync process
        const operationId = `sync-${Date.now()}`;
        logInfo('Starting manual sync operation', {
          userId: authResult.user.id,
          operationId
        });

        // Trigger sync process asynchronously
        syncSharePointFiles().catch(error => {
          logError('Manual sync operation failed', {
            error,
            operationId,
            userId: authResult.user.id
          });
        });

        end(true, { operationId });

        return {
          status: 202,
          body: {
            message: 'SharePoint sync process started',
            operationId
          }
        };
      } catch (error) {
        logError(error, {
          functionName: context.executionContext.functionName,
          operation: 'manualSharePointSync'
        });

        end(false, { error: error.message });

        return {
          status: 500,
          body: {
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          }
        };
      }
    });
  }
});
