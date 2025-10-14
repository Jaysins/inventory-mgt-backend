import { Response, NextFunction } from 'express';
import { purchaseOrderService } from '../services';
import { sendSuccess, sendPaginated } from '../utils/response';
import { SUCCESS_MESSAGES } from '../utils/constants';
import { getPaginationParams } from '../utils/pagination';
import { OrderStatus } from '@prisma/client';
import { AuthRequest } from '../types';

class PurchaseOrderController {
   
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { productId, supplierId, warehouseId, quantityOrdered, notes, leadTimeDays } =
        req.body;

      const purchaseOrder = await purchaseOrderService.createPurchaseOrder({
        productId,
        supplierId,
        warehouseId,
        quantityOrdered,
        notes,
        leadTimeDays,
      });

      return sendSuccess(res, purchaseOrder, 'Purchase order created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

   
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const purchaseOrder = await purchaseOrderService.getPurchaseOrderWithRelations(id);

      return sendSuccess(res, purchaseOrder, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

   
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const { status, productId, warehouseId, supplierId, orderDateFrom, orderDateTo } =
        req.query;

      const filters: any = {};
      if (status) filters.status = status as OrderStatus;
      if (productId) filters.productId = productId as string;
      if (warehouseId) filters.warehouseId = warehouseId as string;
      if (supplierId) filters.supplierId = supplierId as string;
      if (orderDateFrom) filters.orderDateFrom = new Date(orderDateFrom as string);
      if (orderDateTo) filters.orderDateTo = new Date(orderDateTo as string);

      const result = await purchaseOrderService.listPurchaseOrders(filters, page, limit);

      return sendPaginated(
        res,
        result.data,
        { page, limit, total: result.total },
        SUCCESS_MESSAGES.DATA_FETCHED
      );
    } catch (error) {
      next(error);
    }
  }

   
  async getPending(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const orders = await purchaseOrderService.getPendingOrders();

      return sendSuccess(res, orders, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

   
  async getOverdue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const orders = await purchaseOrderService.getOverdueOrders();

      return sendSuccess(res, orders, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

   
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await purchaseOrderService.getOrderStats();

      return sendSuccess(res, stats, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

   
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const purchaseOrder = await purchaseOrderService.updatePurchaseOrder(id, updates);

      return sendSuccess(res, purchaseOrder, 'Purchase order updated successfully');
    } catch (error) {
      next(error);
    }
  }

   
  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const purchaseOrder = await purchaseOrderService.cancelPurchaseOrder(id);

      return sendSuccess(res, purchaseOrder, 'Purchase order cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

   
  async receive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await purchaseOrderService.receivePurchaseOrder(id);

      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default new PurchaseOrderController();