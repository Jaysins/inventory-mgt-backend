import { Response, NextFunction } from 'express';
import { supplierService } from '../services';
import { sendSuccess, sendPaginated } from '../utils/response';
import { SUCCESS_MESSAGES } from '../utils/constants';
import { getPaginationParams } from '../utils/pagination';
import { AuthRequest } from '../types';

class SupplierController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, contactInfo } = req.body;

      const supplier = await supplierService.createSupplier({
        name,
        contactInfo,
      });

      return sendSuccess(res, supplier, 'Supplier created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const supplier = await supplierService.getSupplierWithProductCount(id);

      return sendSuccess(res, supplier, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const { isActive, name } = req.query;

      const filters: any = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (name) filters.name = name as string;

      const result = await supplierService.listSuppliers(filters, page, limit);

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
      const suppliers = await supplierService.getActiveSuppliers();

      return sendSuccess(res, suppliers, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const supplier = await supplierService.updateSupplier(id, updates);

      return sendSuccess(res, supplier, 'Supplier updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await supplierService.deleteSupplier(id);

      return sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default new SupplierController();