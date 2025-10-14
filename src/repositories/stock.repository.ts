import { WarehouseStock, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

class StockRepository {
  async create(data: Prisma.WarehouseStockCreateInput): Promise<WarehouseStock> {
    return await prisma.warehouseStock.create({
      data,
    });
  }

  async findById(id: string): Promise<WarehouseStock | null> {
    return await prisma.warehouseStock.findUnique({
      where: { id },
    });
  }

  async findByProductAndWarehouse(
    productId: string,
    warehouseId: string
  ): Promise<WarehouseStock | null> {
    return await prisma.warehouseStock.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
    });
  }

  async findByWarehouse(warehouseId: string): Promise<
    (WarehouseStock & {
      product: {
        id: string;
        name: string;
        reorderThreshold: number;
      };
    })[]
  > {
    return await prisma.warehouseStock.findMany({
      where: { warehouseId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            reorderThreshold: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findByProduct(productId: string): Promise<
    (WarehouseStock & {
      warehouse: {
        id: string;
        name: string;
        location: string;
      };
    })[]
  > {
    return await prisma.warehouseStock.findMany({
      where: { productId },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        quantity: 'desc',
      },
    });
  }

  async updateQuantity(
    productId: string,
    warehouseId: string,
    quantity: number
  ): Promise<WarehouseStock> {
    return await prisma.warehouseStock.update({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
      data: {
        quantity,
        lastRestocked: new Date(),
      },
    });
  }

  async incrementQuantity(
    productId: string,
    warehouseId: string,
    quantity: number
  ): Promise<WarehouseStock> {
    return await prisma.warehouseStock.update({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
      data: {
        quantity: {
          increment: quantity,
        },
        lastRestocked: new Date(),
      },
    });
  }

  async decrementQuantity(
    productId: string,
    warehouseId: string,
    quantity: number
  ): Promise<WarehouseStock> {
    return await prisma.warehouseStock.update({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
      data: {
        quantity: {
          decrement: quantity,
        },
      },
    });
  }

  async findStocksBelowThreshold(): Promise<
    (WarehouseStock & {
      product: {
        id: string;
        name: string;
        reorderThreshold: number;
        defaultSupplierId: string;
        defaultSupplier: {
          id: string;
          name: string;
        };
      };
      warehouse: {
        id: string;
        name: string;
        capacity: number;
        currentOccupancy: number;
      };
    })[]
  > {
    // Get all warehouse stocks with product and warehouse details
    const stocks = await prisma.warehouseStock.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            reorderThreshold: true,
            defaultSupplierId: true,
            isActive: true,
            defaultSupplier: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            capacity: true,
            currentOccupancy: true,
            isActive: true,
          },
        },
      },
    });

    // Filter stocks that are below threshold
    // Only include active products, warehouses, and suppliers
    return stocks.filter(
      (stock) =>
        stock.quantity < stock.product.reorderThreshold &&
        stock.product.isActive &&
        stock.warehouse.isActive &&
        stock.product.defaultSupplier.isActive
    );
  }

  async getTotalQuantityByProduct(productId: string): Promise<number> {
    const result = await prisma.warehouseStock.aggregate({
      where: { productId },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity || 0;
  }

  async upsert(
    productId: string,
    warehouseId: string,
    quantity: number
  ): Promise<WarehouseStock> {
    return await prisma.warehouseStock.upsert({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
      update: {
        quantity: {
          increment: quantity,
        },
        lastRestocked: new Date(),
      },
      create: {
        product: {
          connect: { id: productId },
        },
        warehouse: {
          connect: { id: warehouseId },
        },
        quantity,
        lastRestocked: new Date(),
      },
    });
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await prisma.warehouseStock.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(productId: string, warehouseId: string): Promise<boolean> {
    const count = await prisma.warehouseStock.count({
      where: {
        productId,
        warehouseId,
      },
    });
    return count > 0;
  }

  async getLowStockAlerts(warehouseId: string): Promise<
    (WarehouseStock & {
      product: {
        id: string;
        name: string;
        reorderThreshold: number;
      };
    })[]
  > {
    const stocks = await prisma.warehouseStock.findMany({
      where: { warehouseId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            reorderThreshold: true,
            isActive: true,
          },
        },
      },
    });

    return stocks.filter(
      (stock) =>
        stock.quantity < stock.product.reorderThreshold && stock.product.isActive
    );
  }
}

export default new StockRepository();