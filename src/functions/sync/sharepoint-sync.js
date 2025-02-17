import { app } from '@azure/functions';
import { Client } from '@microsoft/microsoft-graph-client';
import { BlobServiceClient } from '@azure/storage-blob';
import 'isomorphic-fetch';

/**
 * @swagger
 * /api/sharepoint-sync:
 *   get:
 *     summary: Manually trigger SharePoint to Blob Storage sync
 *     description: Syncs files from a specified SharePoint drive to Azure Blob Storage
 *     tags: [SharePoint]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "SharePoint sync completed successfully"
 *                 syncDetails:
 *                   type: object
 *                   properties:
 *                     totalFiles:
 *                       type: integer
 *                       example: 10
 *                     syncedFiles:
 *                       type: integer
 *                       example: 8
 *                     skippedFiles:
 *                       type: integer
 *                       example: 2
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fileName:
 *                             type: string
 *                             example: "document.pdf"
 *                           error:
 *                             type: string
 *                             example: "File already exists"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - User lacks necessary permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *                 error:
 *                   type: string
 *                   example: "Error accessing SharePoint drive"
 */

// Initialize Graph Client
const getGraphClient = (accessToken) => {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
};

// Initialize Blob Service Client
const getBlobServiceClient = () => {
  return BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
};

// Get access token using client credentials
const getAccessToken = async () => {
  const tokenEndpoint = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: process.env.AZURE_CLIENT_ID,
    client_secret: process.env.AZURE_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    body: body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const data = await response.json();
  return data.access_token;
};

// Download file from SharePoint
const downloadSharePointFile = async (graphClient, driveId, itemId) => {
  const response = await graphClient
    .api(`/drives/${driveId}/items/${itemId}/content`)
    .get();
  return response;
};

// Upload file to Blob Storage
const uploadToBlob = async (containerClient, blobName, content) => {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(content, content.length);
  return blockBlobClient.url;
};

// Main sync function
app.timer('sharePointSync', {
  schedule: '0 */1 * * * *', // Run every hour
  handler: async (myTimer, context) => {
    try {
      context.log('Starting SharePoint to Blob Storage sync');

      // Get access token
      const accessToken = await getAccessToken();
      const graphClient = getGraphClient(accessToken);

      // Initialize blob service
      const blobServiceClient = getBlobServiceClient();
      const containerClient = blobServiceClient.getContainerClient(
        process.env.AZURE_STORAGE_CONTAINER_NAME
      );

      // Get files from SharePoint drive
      const driveId = process.env.SHAREPOINT_DRIVE_ID;
      const files = await graphClient
        .api(`/drives/${driveId}/root/children`)
        .get();

      // Process each file
      for (const file of files.value) {
        if (file.file) { // Only process files, not folders
          try {
            // Download file from SharePoint
            const content = await downloadSharePointFile(
              graphClient,
              driveId,
              file.id
            );

            // Upload to Blob Storage
            const blobName = `sharepoint-sync/${file.name}`;
            const blobUrl = await uploadToBlob(
              containerClient,
              blobName,
              content
            );

            context.log(`Successfully synced file: ${file.name} to ${blobUrl}`);
          } catch (fileError) {
            context.error(`Error processing file ${file.name}:`, fileError);
          }
        }
      }

      context.log('SharePoint to Blob Storage sync completed');
    } catch (error) {
      context.error('Error in SharePoint sync:', error);
      throw error;
    }
  }
});
