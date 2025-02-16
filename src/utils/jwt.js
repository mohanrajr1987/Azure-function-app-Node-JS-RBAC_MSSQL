import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

export const generateToken = (payload) => {
  return jwt.sign(payload, config.app.jwtSecret, {
    expiresIn: config.app.jwtExpiration
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
