import { Router } from 'express';
import { userController } from '../controllers';
import { validate, authenticate, sanitizeBody } from '../middlewares';
import {
  changePasswordSchema,
  updateProfileSchema,
} from '../validators';

const router = Router();

router.use(authenticate);

router.get('/profile', userController.getProfile);

router.put(
  '/profile',
  sanitizeBody,
  validate(updateProfileSchema),
  userController.updateProfile
);

router.post(
  '/change-password',
  sanitizeBody,
  validate(changePasswordSchema),
  userController.changePassword
);

export default router;