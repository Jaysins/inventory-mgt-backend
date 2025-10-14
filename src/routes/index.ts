import { Router } from 'express';
import supplierRoutes from './supplier.routes';
import warehouseRoutes from './warehouse.routes';
import productRoutes from './product.routes';
import stockRoutes from './stock.routes';
import purchaseOrderRoutes from './purchaseOrder.routes';

const router = Router();

/**
 * Health check endpoint
 * GET /health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Inventory Management API is healthy',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Routes
 */
router.use('/suppliers', supplierRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/products', productRoutes);
router.use('/stock', stockRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);

export default router;