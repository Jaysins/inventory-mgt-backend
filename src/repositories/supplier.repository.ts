import {  Supplier, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { SupplierFilters, PaginationOptions } from '../types';


class SupplierRepository {
  async create(data: Prisma.SupplierCreateInput): Promise<Supplier> {
    return await prisma.supplier.create({
      data,
    });
  }

  async findById(id: string): Promise<Supplier | null> {
    return await prisma.supplier.findUnique({
      where: { id },
    });
  }

  async findAll(
    filters: SupplierFilters,
    options: PaginationOptions
  ): Promise<{ data: Supplier[]; total: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    return { data, total };
  }

  async updateById(
    id: string,
    data: Prisma.SupplierUpdateInput
  ): Promise<Supplier> {
    return await prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await prisma.supplier.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async softDelete(id: string): Promise<Supplier> {
    return await prisma.supplier.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  async exists(name: string): Promise<boolean> {
    const count = await prisma.supplier.count({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });
    return count > 0;
  }

  async findByIdWithProductCount(id: string): Promise<
    | (Supplier & {
        _count: { products: number };
      })
    | null
  > {
    return await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findActive(): Promise<Supplier[]> {
    return await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}

export default new SupplierRepository();