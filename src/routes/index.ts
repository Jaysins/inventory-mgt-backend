import { Router } from 'express';
import authRoutes from './auth.routes';
import auditLogRoutes from './auditLog.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/logs', auditLogRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;