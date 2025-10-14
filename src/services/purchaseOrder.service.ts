import { PurchaseOrder, OrderStatus } from '@prisma/client';

import { prisma } from '../config/database';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { CreatePurchaseOrderData, UpdatePurchaseOrderData, PurchaseOrderFilters } from '../types';
import { purchaseOrderRepository } from '../repositories';

import {supplierService, warehouseService, productService} from '../services';


class PurchaseOrderService {
  async createPurchaseOrder(data: CreatePurchaseOrderData): Promise<PurchaseOrder> {
    if (data.quantityOrdered <= 0) {
      throw new BadRequestError('Quantity ordered must be greater than 0');
    }

    await productService.validateProductExists(data.productId);

    await supplierService.validateSupplierExists(data.supplierId);

    await warehouseService.validateWarehouseExists(data.warehouseId);

    const canAccommodate = await warehouseService.canAccommodate(
      data.warehouseId,
      data.quantityOrdered
    );

    if (!canAccommodate) {
      const availableSpace = await warehouseService.checkCapacity(data.warehouseId);
      throw new BadRequestError(
        `Insufficient warehouse capacity. Requested: ${data.quantityOrdered}, Available: ${availableSpace}`
      );
    }

    let orderDate: Date = data.orderDate ? new Date(data.orderDate) : new Date();
    let expectedArrivalDate: Date;

    const leadTimeDays = data.leadTimeDays || 3;

    if (data.expectedArrivalDate) {
      expectedArrivalDate = new Date(data.expectedArrivalDate);
    } else {
      expectedArrivalDate = new Date(orderDate);
      expectedArrivalDate.setDate(expectedArrivalDate.getDate() + leadTimeDays);
    }

    const purchaseOrder = await purchaseOrderRepository.create({
      product: { connect: { id: data.productId } },
      supplier: { connect: { id: data.supplierId } },
      warehouse: { connect: { id: data.warehouseId } },
      quantityOrdered: data.quantityOrdered,
      orderDate,
      expectedArrivalDate,
      notes: data.notes,
      status: OrderStatus.PENDING,
    });

    return purchaseOrder;
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    const order = await purchaseOrderRepository.findById(id);

    if (!order) {
      throw new NotFoundError('Purchase order not found');
    }

    return order;
  }

  async getPurchaseOrderWithRelations(id: string): Promise<
    PurchaseOrder & {
      product: { id: string; name: string };
      supplier: { id: string; name: string };
      warehouse: { id: string; name: string; location: string };
    }
  > {
    const order = await purchaseOrderRepository.findByIdWithRelations(id);

    if (!order) {
      throw new NotFoundError('Purchase order not found');
    }

    return order;
  }

  async listPurchaseOrders(
    filters: PurchaseOrderFilters,
    page: number,
    limit: number
  ): Promise<{ data: PurchaseOrder[]; total: number }> {
    return await purchaseOrderRepository.findAll(filters, { page, limit });
  }

  async updatePurchaseOrder(id: string, data: UpdatePurchaseOrderData): Promise<PurchaseOrder> {
    const order = await this.getPurchaseOrderById(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestError(
        `Cannot update purchase order with status "${order.status}". Only PENDING orders can be updated.`
      );
    }

    if (data.quantityOrdered !== undefined) {
      if (data.quantityOrdered <= 0) {
        throw new BadRequestError('Quantity ordered must be greater than 0');
      }

      const difference = data.quantityOrdered - order.quantityOrdered;
      
      if (difference > 0) {
        const canAccommodate = await warehouseService.canAccommodate(
          order.warehouseId,
          difference
        );

        if (!canAccommodate) {
          const availableSpace = await warehouseService.checkCapacity(order.warehouseId);
          throw new BadRequestError(
            `Insufficient warehouse capacity for additional ${difference} units. Available: ${availableSpace}`
          );
        }
      }
    }

    const updateData: any = {};
    if (data.quantityOrdered !== undefined) updateData.quantityOrdered = data.quantityOrdered;
    if (data.expectedArrivalDate) updateData.expectedArrivalDate = data.expectedArrivalDate;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return await purchaseOrderRepository.updateById(id, updateData);
  }

  async cancelPurchaseOrder(id: string): Promise<PurchaseOrder> {
    const order = await this.getPurchaseOrderById(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestError(
        `Cannot cancel purchase order with status "${order.status}". Only PENDING orders can be cancelled.`
      );
    }

    return await purchaseOrderRepository.updateStatus(id, OrderStatus.CANCELLED);
  }

  async receivePurchaseOrder(id: string): Promise<{
    order: PurchaseOrder;
    stockUpdated: boolean;
    message: string;
  }> {
    const order = await this.getPurchaseOrderById(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestError(
        `Cannot receive purchase order with status "${order.status}". Only PENDING orders can be received.`
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: OrderStatus.RECEIVED,
          actualArrivalDate: new Date(),
        },
      });

      const existingStock = await tx.warehouseStock.findUnique({
        where: {
          productId_warehouseId: {
            productId: order.productId,
            warehouseId: order.warehouseId,
          },
        },
      });

      if (existingStock) {
        await tx.warehouseStock.update({
          where: {
            productId_warehouseId: {
              productId: order.productId,
              warehouseId: order.warehouseId,
            },
          },
          data: {
            quantity: {
              increment: order.quantityOrdered,
            },
            lastRestocked: new Date(),
          },
        });
      } else {
        await tx.warehouseStock.create({
          data: {
            product: { connect: { id: order.productId } },
            warehouse: { connect: { id: order.warehouseId } },
            quantity: order.quantityOrdered,
            lastRestocked: new Date(),
          },
        });
      }

      await tx.warehouse.update({
        where: { id: order.warehouseId },
        data: {
          currentOccupancy: {
            increment: order.quantityOrdered,
          },
        },
      });

      return updatedOrder;
    });

    return {
      order: result,
      stockUpdated: true,
      message: `Purchase order received successfully. Added ${order.quantityOrdered} units to warehouse.`,
    };
  }

  async getPendingOrders(): Promise<any[]> {
    return await purchaseOrderRepository.findPendingOrders();
  }

  async getOverdueOrders(): Promise<any[]> {
    return await purchaseOrderRepository.findOverdueOrders();
  }

  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    received: number;
    cancelled: number;
  }> {
    return await purchaseOrderRepository.getOrderStats();
  }

  async hasPendingOrder(productId: string, warehouseId: string): Promise<boolean> {
    return await purchaseOrderRepository.hasPendingOrder(productId, warehouseId)
  }
  
}

export default new PurchaseOrderService();