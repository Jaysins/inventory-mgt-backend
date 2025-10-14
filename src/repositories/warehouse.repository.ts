import { Warehouse, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { PaginationOptions, WarehouseFilters } from '../types';


class WarehouseRepository {
  async create(data: Prisma.WarehouseCreateInput): Promise<Warehouse> {
    return await prisma.warehouse.create({
      data,
    });
  }

  async findById(id: string): Promise<Warehouse | null> {
    return await prisma.warehouse.findUnique({
      where: { id },
    });
  }

  async findAll(
    filters: WarehouseFilters,
    options: PaginationOptions
  ): Promise<{ data: Warehouse[]; total: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    
    const where: Prisma.WarehouseWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.location) {
      where.location = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    
    const [data, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.warehouse.count({ where }),
    ]);

    return { data, total };
  }

  async updateById(
    id: string,
    data: Prisma.WarehouseUpdateInput
  ): Promise<Warehouse> {
    return await prisma.warehouse.update({
      where: { id },
      data,
    });
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await prisma.warehouse.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async softDelete(id: string): Promise<Warehouse> {
    return await prisma.warehouse.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  async checkCapacity(id: string): Promise<number> {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      select: {
        capacity: true,
        currentOccupancy: true,
      },
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    return warehouse.capacity - warehouse.currentOccupancy;
  }

  async canAccommodate(id: string, additionalQuantity: number): Promise<boolean> {
    const availableSpace = await this.checkCapacity(id);
    return availableSpace >= additionalQuantity;
  }

  async incrementOccupancy(id: string, quantity: number): Promise<Warehouse> {
    return await prisma.warehouse.update({
      where: { id },
      data: {
        currentOccupancy: {
          increment: quantity,
        },
      },
    });
  }

  async decrementOccupancy(id: string, quantity: number): Promise<Warehouse> {
    return await prisma.warehouse.update({
      where: { id },
      data: {
        currentOccupancy: {
          decrement: quantity,
        },
      },
    });
  }

  async findByIdWithStockSummary(id: string): Promise<
    | (Warehouse & {
        _count: { warehouseStocks: number };
        availableCapacity: number;
        capacityUtilization: number;
      })
    | null
  > {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: { warehouseStocks: true },
        },
      },
    });

    if (!warehouse) {
      return null;
    }

    const availableCapacity = warehouse.capacity - warehouse.currentOccupancy;
    const capacityUtilization = (warehouse.currentOccupancy / warehouse.capacity) * 100;

    return {
      ...warehouse,
      availableCapacity,
      capacityUtilization: Math.round(capacityUtilization * 100) / 100, 
    };
  }

  async findActive(): Promise<Warehouse[]> {
    return await prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async exists(name: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.WarehouseWhereInput = {
      name: {
        equals: name,
        mode: 'insensitive',
      },
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await prisma.warehouse.count({ where });
    return count > 0;
  }
}

export default new WarehouseRepository();