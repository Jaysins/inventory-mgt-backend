import { Product, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

import { PaginationOptions, ProductFilters } from '../types';



class ProductRepository {
  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    return await prisma.product.create({
      data,
    });
  }

  async findById(id: string): Promise<Product | null> {
    return await prisma.product.findUnique({
      where: { id },
    });
  }

  async findByIdWithSupplier(id: string): Promise<
    | (Product & {
        defaultSupplier: {
          id: string;
          name: string;
          contactInfo: string;
        };
      })
    | null
  > {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        defaultSupplier: {
          select: {
            id: true,
            name: true,
            contactInfo: true,
          },
        },
      },
    });
  }

  async findAll(
    filters: ProductFilters,
    options: PaginationOptions
  ): Promise<{ data: Product[]; total: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    if (filters.defaultSupplierId) {
      where.defaultSupplierId = filters.defaultSupplierId;
    }

    // Execute queries in parallel
    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          defaultSupplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  async updateById(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return await prisma.product.update({
      where: { id },
      data,
    });
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await prisma.product.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async softDelete(id: string): Promise<Product> {
    return await prisma.product.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  async findBySupplier(supplierId: string): Promise<Product[]> {
    return await prisma.product.findMany({
      where: {
        defaultSupplierId: supplierId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findActive(): Promise<Product[]> {
    return await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async exists(name: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.ProductWhereInput = {
      name: {
        equals: name,
        mode: 'insensitive',
      },
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await prisma.product.count({ where });
    return count > 0;
  }

  async findAllWithStockSummary(
    filters: ProductFilters,
    options: PaginationOptions
  ): Promise<{
    data: (Product & {
      totalStock: number;
      warehouseCount: number;
    })[];
    total: number;
  }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    if (filters.defaultSupplierId) {
      where.defaultSupplierId = filters.defaultSupplierId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          defaultSupplier: {
            select: {
              id: true,
              name: true,
            },
          },
          warehouseStocks: {
            select: {
              quantity: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate total stock and warehouse count
    const data = products.map((product) => {
      const totalStock = product.warehouseStocks.reduce(
        (sum, stock) => sum + stock.quantity,
        0
      );
      const warehouseCount = product.warehouseStocks.length;

      const { warehouseStocks, ...productData } = product;

      return {
        ...productData,
        totalStock,
        warehouseCount,
      };
    });

    return { data, total };
  }
}

export default new ProductRepository();