import * as appInsights from 'applicationinsights';
import winston from 'winston';
import { ApplicationInsightsTransport } from 'winston-applicationinsights';

// Initialize Application Insights
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectConsole(true)
  .setUseDiskRetryCaching(true)
  .start();

const client = appInsights.defaultClient;

// Create custom formatter
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  const metaString = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
  return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaString}`;
});

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    customFormat
  ),
  defaultMeta: { service: 'azure-function-rbac' },
  transports: [
    // Console transport for local development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Application Insights transport
    new ApplicationInsightsTransport({
      client,
      level: 'info',
      treatErrorsAsExceptions: true
    })
  ]
});

// Create request logger middleware
export const requestLogger = (context, req) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || context.invocationId;
  
  // Log request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body
  });

  // Add request tracking to Application Insights
  client.trackRequest({
    name: `${req.method} ${req.url}`,
    url: req.url,
    source: req.headers['user-agent'],
    duration: 0,
    resultCode: 200,
    success: true,
    properties: {
      requestId,
      functionName: context.executionContext.functionName
    }
  });

  return {
    logResponse: (response) => {
      const duration = Date.now() - start;
      
      // Log response
      logger.info('Outgoing response', {
        requestId,
        statusCode: response.status,
        duration,
        body: response.body
      });

      // Update request tracking with final status
      client.trackRequest({
        name: `${req.method} ${req.url}`,
        url: req.url,
        duration,
        resultCode: response.status,
        success: response.status < 400,
        properties: {
          requestId,
          functionName: context.executionContext.functionName
        }
      });
    }
  };
};

// Error logger
export const logError = (error, context = {}) => {
  logger.error('Error occurred', {
    error: {
      message: error.message,
      stack: error.stack,
      ...error
    },
    ...context
  });

  // Track exception in Application Insights
  client.trackException({
    exception: error,
    properties: context
  });
};

// Custom loggers for different levels
export const logInfo = (message, metadata = {}) => {
  logger.info(message, metadata);
  client.trackTrace({ message, severity: appInsights.Contracts.SeverityLevel.Information, properties: metadata });
};

export const logWarn = (message, metadata = {}) => {
  logger.warn(message, metadata);
  client.trackTrace({ message, severity: appInsights.Contracts.SeverityLevel.Warning, properties: metadata });
};

export const logDebug = (message, metadata = {}) => {
  logger.debug(message, metadata);
  client.trackTrace({ message, severity: appInsights.Contracts.SeverityLevel.Verbose, properties: metadata });
};

// Performance monitoring
export const startOperation = (name, properties = {}) => {
  const operation = client.startOperation({ name, properties });
  return {
    operation,
    end: (success = true, additionalProperties = {}) => {
      client.stopOperation(operation, { success, properties: { ...properties, ...additionalProperties } });
    }
  };
};

export default logger;
