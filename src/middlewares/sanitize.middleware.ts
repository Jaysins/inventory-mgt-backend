import { Request, Response, NextFunction } from 'express';
import { sanitizeInput } from '../helpers/validation';

function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      // Remove keys that start with $ or contain . (MongoDB operators)
      if (key.startsWith('$') || key.includes('.')) {
        continue; // ← BLOCKS MONGODB INJECTION
      }
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return obj;
}


export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  
  next();
};