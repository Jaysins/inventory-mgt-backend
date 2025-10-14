import { Response, NextFunction } from 'express';

import { sendSuccess, sendPaginated } from '../utils/response';
import { SUCCESS_MESSAGES } from '../utils/constants';
import { getPaginationParams } from '../utils/pagination';
import { AuthRequest } from '../types';
import { warehouseService } from '../services';


class WarehouseController {
   
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, location, capacity } = req.body;

      const warehouse = await warehouseService.createWarehouse({
        name,
        location,
        capacity,
      });

      return sendSuccess(res, warehouse, 'Warehouse created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

   
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const warehouse = await warehouseService.getWarehouseWithSummary(id);

      return sendSuccess(res, warehouse, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

   
  async getCapacityStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const capacityStatus = await warehouseService.getWarehouseCapacityStatus(id);

      return sendSuccess(res, capacityStatus, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

   
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const { isActive, location, name } = req.query;

      const filters: any = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (location) filters.location = location as string;
      if (name) filters.name = name as string;

      const result = await warehouseService.listWarehouses(filters, page, limit);

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

   
  async getActive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const warehouses = await warehouseService.getActiveWarehouses();

      return sendSuccess(res, warehouses, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

   
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const warehouse = await warehouseService.updateWarehouse(id, updates);

      return sendSuccess(res, warehouse, 'Warehouse updated successfully');
    } catch (error) {
      next(error);
    }
  }

   
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await warehouseService.deleteWarehouse(id);

      return sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default new WarehouseController();