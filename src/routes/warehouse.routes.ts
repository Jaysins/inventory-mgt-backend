import { Router } from 'express';
import { warehouseController } from '../controllers';
import { validate, authenticate, sanitizeBody } from '../middlewares';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  queryWarehouseSchema,
} from '../validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /warehouses/active/list
 * Get all active warehouses (must be before /:id route)
 */
router.get('/active/list', warehouseController.getActive);

/**
 * POST /warehouses
 * Create a new warehouse
 */
router.post(
  '/',
  sanitizeBody,
  validate(createWarehouseSchema),
  warehouseController.create
);

/**
 * GET /warehouses
 * Get all warehouses with filters and pagination
 */
router.get('/', validate(queryWarehouseSchema, 'query'), warehouseController.getAll);

/**
 * GET /warehouses/:id
 * Get warehouse by ID with summary
 */
router.get('/:id', warehouseController.getById);

/**
 * GET /warehouses/:id/capacity
 * Get warehouse capacity status
 */
router.get('/:id/capacity', warehouseController.getCapacityStatus);

/**
 * PUT /warehouses/:id
 * Update warehouse
 */
router.put(
  '/:id',
  sanitizeBody,
  validate(updateWarehouseSchema),
  warehouseController.update
);

/**
 * DELETE /warehouses/:id
 * Delete warehouse (soft delete)
 */
router.delete('/:id', warehouseController.delete);

export default router;