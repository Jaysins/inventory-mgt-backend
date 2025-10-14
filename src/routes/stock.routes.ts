import { Router } from 'express';
import { stockController } from '../controllers';
import { validate, authenticate, sanitizeBody } from '../middlewares';
import {
  addStockSchema,
  removeStockSchema,
  transferStockSchema,
} from '../validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /stock/alerts/all
 * Get all low stock items across all warehouses (must be before other routes)
 */
router.get('/alerts/all', stockController.getAllLowStockAlerts);

/**
 * POST /stock/add
 * Add stock to warehouse
 */
router.post(
  '/add',
  sanitizeBody,
  validate(addStockSchema),
  stockController.addStock
);

/**
 * POST /stock/remove
 * Remove stock from warehouse
 */
router.post(
  '/remove',
  sanitizeBody,
  validate(removeStockSchema),
  stockController.removeStock
);

/**
 * POST /stock/transfer
 * Transfer stock between warehouses
 */
router.post(
  '/transfer',
  sanitizeBody,
  validate(transferStockSchema),
  stockController.transferStock
);

/**
 * POST /stock/check-reorder
 * Trigger automatic reorder check
 */
router.post('/check-reorder', stockController.triggerReorder);

/**
 * GET /stock/warehouse/:warehouseId
 * Get stock levels for a specific warehouse
 */
router.get('/warehouse/:warehouseId', stockController.getWarehouseStock);

/**
 * GET /stock/warehouse/:warehouseId/alerts
 * Get low stock alerts for a specific warehouse
 */
router.get('/warehouse/:warehouseId/alerts', stockController.getWarehouseLowStockAlerts);

/**
 * GET /stock/product/:productId
 * Get stock levels for a product across all warehouses
 */
router.get('/product/:productId', stockController.getProductStock);

export default router;