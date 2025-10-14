import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { validate, authenticate, authRateLimit, sanitizeBody } from '../middlewares';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

router.post(
  '/register',
  authRateLimit,
  sanitizeBody,
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  authRateLimit,
  sanitizeBody,
  validate(loginSchema),
  authController.login
);

router.get(
  '/profile',
  authenticate,
  authController.getProfile
);

export default router;




