import { Response, NextFunction } from 'express';
import { sendSuccess, sendPaginated } from '../utils/response';
import { SUCCESS_MESSAGES } from '../utils/constants';
import { getPaginationParams } from '../utils/pagination';
import { AuthRequest } from '../types';
import { productService } from '../services';

class ProductController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, description, reorderThreshold, defaultSupplierId } = req.body;

      const product = await productService.createProduct({
        name,
        description,
        reorderThreshold,
        defaultSupplierId,
      });

      return sendSuccess(res, product, 'Product created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const product = await productService.getProductWithSupplier(id);

      return sendSuccess(res, product, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

  async getStockLevels(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const stockLevels = await productService.getProductStockLevels(id);

      return sendSuccess(res, stockLevels, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const { isActive, name, defaultSupplierId, includeStock } = req.query;

      const filters: any = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (name) filters.name = name as string;
      if (defaultSupplierId) filters.defaultSupplierId = defaultSupplierId as string;

      // If includeStock is true, get products with stock summary
      const shouldIncludeStock = includeStock === 'true';
      
      const result = shouldIncludeStock
        ? await productService.listProductsWithStock(filters, page, limit)
        : await productService.listProducts(filters, page, limit);

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
      const products = await productService.getActiveProducts();

      return sendSuccess(res, products, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const product = await productService.updateProduct(id, updates);

      return sendSuccess(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await productService.deleteProduct(id);

      return sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();