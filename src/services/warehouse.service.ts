import { Warehouse } from '@prisma/client';

import { BadRequestError, NotFoundError } from '../utils/errors';
import { CreateWarehouseData, UpdateWarehouseData, WarehouseFilters } from '../types';
import { warehouseRepository } from '../repositories';


class WarehouseService {
  async createWarehouse(data: CreateWarehouseData): Promise<Warehouse> {
    if (data.capacity <= 0) {
      throw new BadRequestError('Warehouse capacity must be greater than 0');
    }

    const exists = await warehouseRepository.exists(data.name);
    if (exists) {
      throw new BadRequestError(`Warehouse with name "${data.name}" already exists`);
    }

    const warehouse = await warehouseRepository.create({
      name: data.name.trim(),
      location: data.location.trim(),
      capacity: data.capacity,
      currentOccupancy: 0,
    });

    return warehouse;
  }

  async getWarehouseById(id: string): Promise<Warehouse> {
    const warehouse = await warehouseRepository.findById(id);

    if (!warehouse) {
      throw new NotFoundError('Warehouse not found');
    }

    return warehouse;
  }

  async getWarehouseWithSummary(id: string): Promise<
    Warehouse & {
      _count: { warehouseStocks: number };
      availableCapacity: number;
      capacityUtilization: number;
    }
  > {
    const warehouse = await warehouseRepository.findByIdWithStockSummary(id);

    if (!warehouse) {
      throw new NotFoundError('Warehouse not found');
    }

    return warehouse;
  }

  async listWarehouses(
    filters: WarehouseFilters,
    page: number,
    limit: number
  ): Promise<{ data: Warehouse[]; total: number }> {
    return await warehouseRepository.findAll(filters, { page, limit });
  }

  async updateWarehouse(id: string, data: UpdateWarehouseData): Promise<Warehouse> {
    const warehouse = await this.validateWarehouseExists(id);

    if (data.name) {
      const exists = await warehouseRepository.exists(data.name, id);
      if (exists) {
        throw new BadRequestError(`Warehouse with name "${data.name}" already exists`);
      }
    }

    if (data.capacity !== undefined) {
      if (data.capacity <= 0) {
        throw new BadRequestError('Warehouse capacity must be greater than 0');
      }

      if (data.capacity < warehouse.currentOccupancy) {
        throw new BadRequestError(
          `Cannot set capacity to ${data.capacity}. Current occupancy is ${warehouse.currentOccupancy}. Please reduce stock first.`
        );
      }
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.location) updateData.location = data.location.trim();
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return await warehouseRepository.updateById(id, updateData);
  }

  async deleteWarehouse(id: string): Promise<{ success: boolean; message: string }> {
    const warehouse = await this.validateWarehouseExists(id);

    if (warehouse.currentOccupancy > 0) {
      throw new BadRequestError(
        `Cannot delete warehouse. It currently holds ${warehouse.currentOccupancy} items. Please clear the warehouse first.`
      );
    }

    await warehouseRepository.softDelete(id);

    return {
      success: true,
      message: 'Warehouse deleted successfully',
    };
  }

  async getWarehouseCapacityStatus(id: string): Promise<{
    capacity: number;
    currentOccupancy: number;
    availableCapacity: number;
    capacityUtilization: number;
    status: 'low' | 'medium' | 'high' | 'full';
  }> {
    const warehouse = await this.validateWarehouseExists(id);

    const availableCapacity = warehouse.capacity - warehouse.currentOccupancy;
    const capacityUtilization = (warehouse.currentOccupancy / warehouse.capacity) * 100;

    let status: 'low' | 'medium' | 'high' | 'full';
    if (capacityUtilization >= 100) {
      status = 'full';
    } else if (capacityUtilization >= 80) {
      status = 'high';
    } else if (capacityUtilization >= 50) {
      status = 'medium';
    } else {
      status = 'low';
    }

    return {
      capacity: warehouse.capacity,
      currentOccupancy: warehouse.currentOccupancy,
      availableCapacity,
      capacityUtilization: Math.round(capacityUtilization * 100) / 100,
      status,
    };
  }

  async getActiveWarehouses(): Promise<Warehouse[]> {
    return await warehouseRepository.findActive();
  }

  async canAccommodate(id: string, quantity: number): Promise<boolean> {
    return await warehouseRepository.canAccommodate(id, quantity);
  }

  async validateWarehouseExists(id: string): Promise<Warehouse> {
    const warehouse = await warehouseRepository.findById(id);

    if (!warehouse) {
      throw new NotFoundError('Warehouse not found');
    }

    return warehouse;
  }

  async checkCapacity(id: string): Promise<number> {
    return await warehouseRepository.checkCapacity(id)
  }
}

export default new WarehouseService();