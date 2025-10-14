import { Response, NextFunction } from 'express';
import { stockService } from '../services';
import { sendSuccess } from '../utils/response';
import { SUCCESS_MESSAGES } from '../utils/constants';
import { AuthRequest } from '../types';

class StockController {
  async addStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { productId, warehouseId, quantity } = req.body;

      const result = await stockService.addStock({
        productId,
        warehouseId,
        quantity,
      });

      return sendSuccess(res, result, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  async removeStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { productId, warehouseId, quantity } = req.body;

      const result = await stockService.removeStock({
        productId,
        warehouseId,
        quantity,
      });

      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async transferStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { productId, fromWarehouseId, toWarehouseId, quantity } = req.body;

      const result = await stockService.transferStock({
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
      });

      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getWarehouseStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { warehouseId } = req.params;

      const stocks = await stockService.getWarehouseStockLevels(warehouseId);

      return sendSuccess(res, stocks, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

  async getProductStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;

      const stocks = await stockService.getProductStockAcrossWarehouses(productId);

      return sendSuccess(res, stocks, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

  async getWarehouseLowStockAlerts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { warehouseId } = req.params;

      const alerts = await stockService.getLowStockAlerts(warehouseId);

      return sendSuccess(res, alerts, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

  async getAllLowStockAlerts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const alerts = await stockService.getAllLowStockItems();

      return sendSuccess(res, alerts, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

  async triggerReorder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await stockService.checkAndReorder();

      return sendSuccess(
        res,
        result,
        `Automatic reorder completed. ${result.ordersCreated} order(s) created.`
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new StockController();