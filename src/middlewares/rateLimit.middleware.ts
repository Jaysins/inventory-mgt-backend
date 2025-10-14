import rateLimit from 'express-rate-limit';
import { appConfig } from '../config';

export const globalRateLimit = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  skipSuccessfulRequests: true
});

export const conversionRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 conversions per minute
  message: {
    success: false,
    message: 'Too many conversion requests, please slow down'
  }
});





