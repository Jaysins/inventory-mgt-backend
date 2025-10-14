import { PurchaseOrder, OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database'
import { PaginationOptions, PurchaseOrderFilters } from '../types';

class PurchaseOrderRepository {
  async create(data: Prisma.PurchaseOrderCreateInput): Promise<PurchaseOrder> {
    return await prisma.purchaseOrder.create({
      data,
    });
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    return await prisma.purchaseOrder.findUnique({
      where: { id },
    });
  }

  async findByIdWithRelations(id: string): Promise<
    | (PurchaseOrder & {
        product: {
          id: string;
          name: string;
        };
        supplier: {
          id: string;
          name: string;
        };
        warehouse: {
          id: string;
          name: string;
          location: string;
        };
      })
    | null
  > {
    return await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });
  }

  async findAll(
    filters: PurchaseOrderFilters,
    options: PaginationOptions
  ): Promise<{ data: PurchaseOrder[]; total: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseOrderWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters.orderDateFrom || filters.orderDateTo) {
      where.orderDate = {};
      if (filters.orderDateFrom) {
        where.orderDate.gte = filters.orderDateFrom;
      }
      if (filters.orderDateTo) {
        where.orderDate.lte = filters.orderDateTo;
      }
    }

    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          orderDate: 'desc',
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return { data, total };
  }

  async updateById(
    id: string,
    data: Prisma.PurchaseOrderUpdateInput
  ): Promise<PurchaseOrder> {
    return await prisma.purchaseOrder.update({
      where: { id },
      data,
    });
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    actualArrivalDate?: Date
  ): Promise<PurchaseOrder> {
    const data: Prisma.PurchaseOrderUpdateInput = {
      status,
    };

    if (actualArrivalDate) {
      data.actualArrivalDate = actualArrivalDate;
    }

    return await prisma.purchaseOrder.update({
      where: { id },
      data,
    });
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await prisma.purchaseOrder.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async findPendingOrders(): Promise<
    (PurchaseOrder & {
      product: {
        id: string;
        name: string;
      };
      warehouse: {
        id: string;
        name: string;
      };
    })[]
  > {
    return await prisma.purchaseOrder.findMany({
      where: {
        status: OrderStatus.PENDING,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        expectedArrivalDate: 'asc',
      },
    });
  }

  async findByProduct(productId: string): Promise<PurchaseOrder[]> {
    return await prisma.purchaseOrder.findMany({
      where: { productId },
      orderBy: {
        orderDate: 'desc',
      },
    });
  }

  async findByWarehouse(warehouseId: string): Promise<PurchaseOrder[]> {
    return await prisma.purchaseOrder.findMany({
      where: { warehouseId },
      orderBy: {
        orderDate: 'desc',
      },
    });
  }

  async findBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    return await prisma.purchaseOrder.findMany({
      where: { supplierId },
      orderBy: {
        orderDate: 'desc',
      },
    });
  }

  async findOverdueOrders(): Promise<
    (PurchaseOrder & {
      product: {
        id: string;
        name: string;
      };
      supplier: {
        id: string;
        name: string;
      };
      warehouse: {
        id: string;
        name: string;
      };
    })[]
  > {
    return await prisma.purchaseOrder.findMany({
      where: {
        status: OrderStatus.PENDING,
        expectedArrivalDate: {
          lt: new Date(),
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        expectedArrivalDate: 'asc',
      },
    });
  }

  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    received: number;
    cancelled: number;
  }> {
    const [total, pending, received, cancelled] = await Promise.all([
      prisma.purchaseOrder.count(),
      prisma.purchaseOrder.count({ where: { status: OrderStatus.PENDING } }),
      prisma.purchaseOrder.count({ where: { status: OrderStatus.RECEIVED } }),
      prisma.purchaseOrder.count({ where: { status: OrderStatus.CANCELLED } }),
    ]);

    return { total, pending, received, cancelled };
  }

  async hasPendingOrder(productId: string, warehouseId: string): Promise<boolean> {
    const count = await prisma.purchaseOrder.count({
      where: {
        productId,
        warehouseId,
        status: OrderStatus.PENDING,
      },
    });
    return count > 0;
  }

  async getPendingQuantity(productId: string, warehouseId: string): Promise<number> {
    const result = await prisma.purchaseOrder.aggregate({
      where: {
        productId,
        warehouseId,
        status: OrderStatus.PENDING,
      },
      _sum: {
        quantityOrdered: true,
      },
    });

    return result._sum.quantityOrdered || 0;
  }
}

export default new PurchaseOrderRepository();