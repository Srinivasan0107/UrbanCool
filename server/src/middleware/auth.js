import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError('No token provided', 401);
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new AppError('Forbidden: insufficient role', 403);
    }
    next();
  };
}
