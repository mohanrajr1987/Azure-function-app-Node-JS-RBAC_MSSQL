import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

// Access token expiration: 15 minutes
const ACCESS_TOKEN_EXPIRATION = '15m';
// Refresh token expiration: 7 days
const REFRESH_TOKEN_EXPIRATION = '7d';

export const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, config.app.jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRATION
  });

  const refreshToken = jwt.sign(payload, config.app.jwtSecret, {
    expiresIn: REFRESH_TOKEN_EXPIRATION
  });

  return { accessToken, refreshToken };
};

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.app.jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRATION
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.app.jwtSecret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  const [bearer, token] = authHeader.split(' ');
  if (bearer !== 'Bearer' || !token) return null;
  
  return token;
};
