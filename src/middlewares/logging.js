import { requestLogger, logError } from '../utils/logger.js';

export const loggingMiddleware = async (context, req, next) => {
  try {
    // Initialize request logger
    const reqLogger = requestLogger(context, req);
    
    // Call next middleware/function
    const response = await next();
    
    // Log response
    reqLogger.logResponse(response);
    
    return response;
  } catch (error) {
    // Log error with context
    logError(error, {
      functionName: context.executionContext.functionName,
      invocationId: context.invocationId,
      req: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        body: req.body
      }
    });
    
    // Return error response
    return {
      status: error.status || 500,
      body: {
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal Server Error' 
          : error.message
      }
    };
  }
};
