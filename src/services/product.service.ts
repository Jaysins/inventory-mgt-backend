import { Product } from '@prisma/client';

import { BadRequestError, NotFoundError } from '../utils/errors';
import { CreateProductData, UpdateProductData, ProductFilters } from '../types';
import { productRepository } from '../repositories';
import { supplierService, warehouseStockService } from '../services';


class ProductService {
  async createProduct(data: CreateProductData): Promise<Product> {
    if (data.reorderThreshold < 0) {
      throw new BadRequestError('Reorder threshold must be 0 or greater');
    }

    await supplierService.validateSupplierExists(data.defaultSupplierId);

    const exists = await productRepository.exists(data.name);
    if (exists) {
      throw new BadRequestError(`Product with name "${data.name}" already exists`);
    }

    const product = await productRepository.create({
      name: data.name.trim(),
      description: data.description?.trim(),
      reorderThreshold: data.reorderThreshold,
      defaultSupplier: {
        connect: { id: data.defaultSupplierId },
      },
    });

    return product;
  }

  async getProductById(id: string): Promise<Product> {
    const product = await productRepository.findById(id);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  async getProductWithSupplier(id: string): Promise<
    Product & {
      defaultSupplier: {
        id: string;
        name: string;
        contactInfo: string;
      };
    }
  > {
    const product = await productRepository.findByIdWithSupplier(id);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  async listProducts(
    filters: ProductFilters,
    page: number,
    limit: number
  ): Promise<{ data: any[]; total: number }> {
    return await productRepository.findAll(filters, { page, limit });
  }

  async listProductsWithStock(
    filters: ProductFilters,
    page: number,
    limit: number
  ): Promise<{
    data: (Product & {
      totalStock: number;
      warehouseCount: number;
    })[];
    total: number;
  }> {
    return await productRepository.findAllWithStockSummary(filters, { page, limit });
  }

  async getProductStockLevels(productId: string): Promise<{
    product: Product;
    totalStock: number;
    stockByWarehouse: Array<{
      warehouseId: string;
      warehouseName: string;
      location: string;
      quantity: number;
      lastRestocked: Date;
    }>;
    belowThreshold: boolean;
  }> {
    const product = await this.validateProductExists(productId);

    const stocks = await warehouseStockService.findByProduct(productId);

    const totalStock = stocks.reduce((sum, stock) => sum + stock.quantity, 0);

    const stockByWarehouse = stocks.map((stock) => ({
      warehouseId: stock.warehouse.id,
      warehouseName: stock.warehouse.name,
      location: stock.warehouse.location,
      quantity: stock.quantity,
      lastRestocked: stock.lastRestocked,
    }));

    return {
      product,
      totalStock,
      stockByWarehouse,
      belowThreshold: totalStock < product.reorderThreshold,
    };
  }

  async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    await this.validateProductExists(id);

    if (data.name) {
      const exists = await productRepository.exists(data.name, id);
      if (exists) {
        throw new BadRequestError(`Product with name "${data.name}" already exists`);
      }
    }

    if (data.defaultSupplierId) {
      await supplierService.validateSupplierExists(data.defaultSupplierId);
    }

    if (data.reorderThreshold !== undefined && data.reorderThreshold < 0) {
      throw new BadRequestError('Reorder threshold must be 0 or greater');
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim();
    if (data.reorderThreshold !== undefined) updateData.reorderThreshold = data.reorderThreshold;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    
    if (data.defaultSupplierId) {
      updateData.defaultSupplier = {
        connect: { id: data.defaultSupplierId },
      };
    }

    return await productRepository.updateById(id, updateData);
  }

  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    await this.validateProductExists(id);

    const totalStock = await warehouseStockService.getTotalQuantityByProduct(id);
    if (totalStock > 0) {
      throw new BadRequestError(
        `Cannot delete product. It has ${totalStock} units in stock across warehouses. Please clear stock first.`
      );
    }

    await productRepository.softDelete(id);

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }

  async getActiveProducts(): Promise<Product[]> {
    return await productRepository.findActive();
  }

  async validateProductExists(id: string): Promise<Product> {
    const product = await productRepository.findById(id);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }
}

export default new ProductService();