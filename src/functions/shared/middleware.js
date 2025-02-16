import { initializeModels } from './database.js';

export const createContext = async (context, req) => {
  // Initialize database and models
  await initializeModels();

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

  return { req, res };
};

export const executeMiddleware = async (middleware, req, res) => {
  let currentIndex = 0;

  const next = async () => {
    if (currentIndex < middleware.length) {
      await middleware[currentIndex++](req, res, next);
    }
  };

  await next();
};

export const handleError = (context, error) => {
  console.error('Function error:', error);
  
  context.res = {
    status: error.status || 500,
    body: {
      message: error.message || 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  };
};
