import { documentController } from '../../controllers/document.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { validate, documentSchemas } from '../../middlewares/validation.js';
import multer from 'multer';
import { Readable } from 'stream';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to handle file uploads
const handleFileUpload = (req) => {
  return new Promise((resolve, reject) => {
    if (!req.body || !req.body.length) {
      resolve();
      return;
    }

    const readableStream = new Readable();
    readableStream.push(req.body);
    readableStream.push(null);

    const bufs = [];
    readableStream.on('data', (chunk) => {
      bufs.push(chunk);
    });
    readableStream.on('end', () => {
      const buffer = Buffer.concat(bufs);
      req.file = {
        buffer,
        originalname: req.headers['x-file-name'],
        mimetype: req.headers['content-type'],
        size: buffer.length
      };
      resolve();
    });
    readableStream.on('error', reject);
  });
};

const routeHandlers = {
  'POST /': {
    handler: documentController.uploadDocument,
    middleware: [
      authenticate,
      authorize('document:create'),
      validate(documentSchemas.uploadDocument)
    ]
  },
  'POST /multiple': {
    handler: documentController.uploadMultipleDocuments,
    middleware: [
      authenticate,
      authorize('document:create'),
      validate(documentSchemas.uploadDocument)
    ]
  },
  'GET /': {
    handler: documentController.listDocuments,
    middleware: [authenticate, authorize('document:read')]
  },
  'GET /:id': {
    handler: documentController.getDocument,
    middleware: [authenticate, authorize('document:read')]
  },
  'PUT /:id': {
    handler: documentController.updateDocument,
    middleware: [
      authenticate,
      authorize('document:update'),
      validate(documentSchemas.updateDocument)
    ]
  },
  'DELETE /:id': {
    handler: documentController.deleteDocument,
    middleware: [authenticate, authorize('document:delete')]
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

    // Handle file upload if present
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      await handleFileUpload(req);
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
      },
      setHeader: function(name, value) {
        if (!context.res.headers) {
          context.res.headers = {};
        }
        context.res.headers[name] = value;
      },
      send: function(data) {
        context.res = {
          ...context.res,
          body: data,
          isRaw: true
        };
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
    context.log.error('Error in document function:', error);
    context.res = {
      status: 500,
      body: {
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    };
  }
}
