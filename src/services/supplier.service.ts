import { Supplier } from '@prisma/client';

import { BadRequestError, NotFoundError } from '../utils/errors';
import { CreateSupplierData, UpdateSupplierData, SupplierFilters } from '../types';
import { supplierRepository } from '../repositories';


class SupplierService {
  async createSupplier(data: CreateSupplierData): Promise<Supplier> {
    const exists = await supplierRepository.exists(data.name);
    if (exists) {
      throw new BadRequestError(`Supplier with name "${data.name}" already exists`);
    }

    const supplier = await supplierRepository.create({
      name: data.name.trim(),
      contactInfo: data.contactInfo.trim(),
    });

    return supplier;
  }

  async getSupplierById(id: string): Promise<Supplier> {
    const supplier = await supplierRepository.findById(id);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    return supplier;
  }

  async getSupplierWithProductCount(id: string): Promise<
    Supplier & {
      _count: { products: number };
    }
  > {
    const supplier = await supplierRepository.findByIdWithProductCount(id);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    return supplier;
  }

  async listSuppliers(
    filters: SupplierFilters,
    page: number,
    limit: number
  ): Promise<{ data: Supplier[]; total: number }> {
    return await supplierRepository.findAll(filters, { page, limit });
  }

  async updateSupplier(id: string, data: UpdateSupplierData): Promise<Supplier> {
    await this.validateSupplierExists(id);

    if (data.name) {
      const exists = await supplierRepository.exists(data.name);
      if (exists) {
        const existingSupplier = await supplierRepository.findById(id);
        if (existingSupplier && existingSupplier.name.toLowerCase() !== data.name.toLowerCase()) {
          throw new BadRequestError(`Supplier with name "${data.name}" already exists`);
        }
      }
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.contactInfo) updateData.contactInfo = data.contactInfo.trim();
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return await supplierRepository.updateById(id, updateData);
  }

  async deleteSupplier(id: string): Promise<{ success: boolean; message: string }> {
    await this.validateSupplierExists(id);

    const supplierWithCount = await supplierRepository.findByIdWithProductCount(id);
    if (supplierWithCount && supplierWithCount._count.products > 0) {
      throw new BadRequestError(
        `Cannot delete supplier. It has ${supplierWithCount._count.products} associated product(s). Please reassign products first.`
      );
    }

    await supplierRepository.softDelete(id);

    return {
      success: true,
      message: 'Supplier deleted successfully',
    };
  }

  async getActiveSuppliers(): Promise<Supplier[]> {
    return await supplierRepository.findActive();
  }

  async validateSupplierExists(id: string): Promise<Supplier> {
    const supplier = await supplierRepository.findById(id);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    return supplier;
  }
}

export default new SupplierService();