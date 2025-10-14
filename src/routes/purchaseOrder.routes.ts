import { Router } from 'express';
import { purchaseOrderController } from '../controllers';
import { validate, authenticate, sanitizeBody } from '../middlewares';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  queryPurchaseOrderSchema,
} from '../validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /purchase-orders/stats
 * Get order statistics (must be before /:id route)
 */
router.get('/stats', purchaseOrderController.getStats);

/**
 * GET /purchase-orders/pending/list
 * Get all pending orders (must be before /:id route)
 */
router.get('/pending/list', purchaseOrderController.getPending);

/**
 * GET /purchase-orders/overdue/list
 * Get overdue orders (must be before /:id route)
 */
router.get('/overdue/list', purchaseOrderController.getOverdue);

/**
 * POST /purchase-orders
 * Create a new purchase order
 */
router.post(
  '/',
  sanitizeBody,
  validate(createPurchaseOrderSchema),
  purchaseOrderController.create
);

/**
 * GET /purchase-orders
 * Get all purchase orders with filters and pagination
 */
router.get(
  '/',
  validate(queryPurchaseOrderSchema, 'query'),
  purchaseOrderController.getAll
);

/**
 * GET /purchase-orders/:id
 * Get purchase order by ID
 */
router.get('/:id', purchaseOrderController.getById);

/**
 * PUT /purchase-orders/:id
 * Update purchase order
 */
router.put(
  '/:id',
  sanitizeBody,
  validate(updatePurchaseOrderSchema),
  purchaseOrderController.update
);

/**
 * POST /purchase-orders/:id/cancel
 * Cancel purchase order
 */
router.post('/:id/cancel', purchaseOrderController.cancel);

/**
 * POST /purchase-orders/:id/receive
 * Receive purchase order (mark as received and update stock)
 */
router.post('/:id/receive', purchaseOrderController.receive);

export default router;