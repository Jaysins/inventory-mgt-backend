import { Router } from 'express';
import auditLogController from '../controllers/auditLog.controller';
import { authenticate, validate } from '../middlewares';
import { paginationSchema } from '../validators/core.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(paginationSchema, 'query'),
  auditLogController.getUserLogs
);

// router.get(
//   '/recent',
//   validate(paginationSchema, 'query'),
//   auditLogController.getRecentLogs
// );

export default router;
