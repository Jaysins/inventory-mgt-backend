import { Router } from 'express';
import { userController } from '../controllers';
import { validate, sanitizeBody } from '../middlewares';
import {
  registerSchema,
  loginSchema
} from '../validators';

const router = Router();

router.post(
  '/register',
  sanitizeBody,
  validate(registerSchema),
  userController.register
);

router.post(
  '/login',
  sanitizeBody,
  validate(loginSchema),
  userController.login
);


export default router;