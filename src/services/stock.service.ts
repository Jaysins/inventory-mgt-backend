import { prisma } from '../config/database';

import { BadRequestError, NotFoundError } from '../utils/errors';
import { AddStockData, RemoveStockData, TransferStockData, StockData } from '../types';
import { stockRepository } from '../repositories';

import productService from './product.service';
import warehouseService from './warehouse.service';
import purchaseOrderService from './purchaseOrder.service';


class WarehouseStockService {
 async findByProduct(productId: string): Promise <StockData[]> {
    return await stockRepository.findByProduct(productId)
 }

  async getTotalQuantityByProduct(productId: string): Promise <number> {
    return await stockRepository.getTotalQuantityByProduct(productId)
 }
   
  async checkAndReorder(): Promise<{
    ordersCreated: number;
    orders: Array<{
      productId: string;
      productName: string;
      warehouseId: string;
      warehouseName: string;
      currentStock: number;
      threshold: number;
      quantityOrdered: number;
      supplierId: string;
      supplierName: string;
      orderId: string;
    }>;
    skipped: Array<{
      productId: string;
      productName: string;
      warehouseId: string;
      reason: string;
    }>;
  }> {
    // 1. Find all stocks below threshold
    const lowStocks = await stockRepository.findStocksBelowThreshold();

    const ordersCreated: any[] = [];
    const skipped: any[] = [];

    // 2. Process each low stock item
    for (const stock of lowStocks) {
      try {
        const product = stock.product;
        const warehouse = stock.warehouse;

        // Skip if there's already a pending order for this product in this warehouse
        const hasPendingOrder = await purchaseOrderService.hasPendingOrder(
          product.id,
          warehouse.id
        );

        if (hasPendingOrder) {
          skipped.push({
            productId: product.id,
            productName: product.name,
            warehouseId: warehouse.id,
            reason: 'Pending order already exists',
          });
          continue;
        }

        // Calculate order quantity
        // Strategy: Order enough to reach threshold + 20% buffer
        const buffer = Math.ceil(product.reorderThreshold * 0.2);
        const targetQuantity = product.reorderThreshold + buffer;
        let quantityToOrder = targetQuantity - stock.quantity;

        // Check warehouse capacity
        const availableCapacity = warehouse.capacity - warehouse.currentOccupancy;

        if (availableCapacity <= 0) {
          skipped.push({
            productId: product.id,
            productName: product.name,
            warehouseId: warehouse.id,
            reason: 'Warehouse at full capacity',
          });
          continue;
        }

        // Adjust order quantity if it exceeds available capacity
        if (quantityToOrder > availableCapacity) {
          quantityToOrder = availableCapacity;
        }

        // Skip if adjusted quantity is too small (less than 10% of threshold)
        if (quantityToOrder < product.reorderThreshold * 0.1) {
          skipped.push({
            productId: product.id,
            productName: product.name,
            warehouseId: warehouse.id,
            reason: `Insufficient capacity (only ${availableCapacity} available)`,
          });
          continue;
        }

        // Calculate expected arrival date (3 days lead time)
        const orderDate = new Date();
        const expectedArrivalDate = new Date(orderDate);
        expectedArrivalDate.setDate(expectedArrivalDate.getDate() + 3);

        // Create purchase order
        const purchaseOrder = await purchaseOrderService.createPurchaseOrder({
          productId: product.id,
          supplierId: product.defaultSupplierId,
          warehouseId: warehouse.id,
          quantityOrdered: quantityToOrder,
          orderDate,
          expectedArrivalDate,
          notes: 'Auto-generated order - stock below threshold',
        });

        ordersCreated.push({
          productId: product.id,
          productName: product.name,
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          currentStock: stock.quantity,
          threshold: product.reorderThreshold,
          quantityOrdered: quantityToOrder,
          supplierId: product.defaultSupplierId,
          supplierName: product.defaultSupplier.name,
          orderId: purchaseOrder.id,
        });
      } catch (error: any) {
        skipped.push({
          productId: stock.product.id,
          productName: stock.product.name,
          warehouseId: stock.warehouse.id,
          reason: error.message || 'Unknown error',
        });
      }
    }

    return {
      ordersCreated: ordersCreated.length,
      orders: ordersCreated,
      skipped,
    };
  }

  
  async addStock(data: AddStockData): Promise<{
    success: boolean;
    stock: any;
    message: string;
  }> {
    // Validate: Quantity must be positive
    if (data.quantity <= 0) {
      throw new BadRequestError('Quantity must be greater than 0');
    }

    // Validate: Product exists
    await productService.validateProductExists(data.productId);

    // Validate: Warehouse exists
    await warehouseService.validateWarehouseExists(data.warehouseId);

    // Check warehouse capacity
    const canAccommodate = await warehouseService.canAccommodate(
      data.warehouseId,
      data.quantity
    );

    if (!canAccommodate) {
      const availableSpace = await warehouseService.checkCapacity(data.warehouseId);
      throw new BadRequestError(
        `Insufficient warehouse capacity. Requested: ${data.quantity}, Available: ${availableSpace}`
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Check if stock entry exists
      const existingStock = await tx.warehouseStock.findUnique({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
      });

      let updatedStock;
      if (existingStock) {
        // Update existing stock
        updatedStock = await tx.warehouseStock.update({
          where: {
            productId_warehouseId: {
              productId: data.productId,
              warehouseId: data.warehouseId,
            },
          },
          data: {
            quantity: {
              increment: data.quantity,
            },
            lastRestocked: new Date(),
          },
          include: {
            product: {
              select: { name: true },
            },
            warehouse: {
              select: { name: true },
            },
          },
        });
      } else {
        // Create new stock entry
        updatedStock = await tx.warehouseStock.create({
          data: {
            product: { connect: { id: data.productId } },
            warehouse: { connect: { id: data.warehouseId } },
            quantity: data.quantity,
            lastRestocked: new Date(),
          },
          include: {
            product: {
              select: { name: true },
            },
            warehouse: {
              select: { name: true },
            },
          },
        });
      }

      // Update warehouse occupancy
      await tx.warehouse.update({
        where: { id: data.warehouseId },
        data: {
          currentOccupancy: {
            increment: data.quantity,
          },
        },
      });

      return updatedStock;
    });

    return {
      success: true,
      stock: result,
      message: `Successfully added ${data.quantity} units to warehouse`,
    };
  }

  
  async removeStock(data: RemoveStockData): Promise<{
    success: boolean;
    stock: any;
    message: string;
  }> {
    // Validate: Quantity must be positive
    if (data.quantity <= 0) {
      throw new BadRequestError('Quantity must be greater than 0');
    }

    // Validate: Product exists
    await productService.validateProductExists(data.productId);

    // Validate: Warehouse exists
    await warehouseService.validateWarehouseExists(data.warehouseId);

    // Check if stock entry exists
    const existingStock = await stockRepository.findByProductAndWarehouse(
      data.productId,
      data.warehouseId
    );

    if (!existingStock) {
      throw new NotFoundError('Stock entry not found for this product in this warehouse');
    }

    // Check if sufficient stock exists
    if (existingStock.quantity < data.quantity) {
      throw new BadRequestError(
        `Insufficient stock. Available: ${existingStock.quantity}, Requested: ${data.quantity}`
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Decrement stock
      const updatedStock = await tx.warehouseStock.update({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
        data: {
          quantity: {
            decrement: data.quantity,
          },
        },
        include: {
          product: {
            select: { name: true },
          },
          warehouse: {
            select: { name: true },
          },
        },
      });

      // Update warehouse occupancy
      await tx.warehouse.update({
        where: { id: data.warehouseId },
        data: {
          currentOccupancy: {
            decrement: data.quantity,
          },
        },
      });

      return updatedStock;
    });

    return {
      success: true,
      stock: result,
      message: `Successfully removed ${data.quantity} units from warehouse`,
    };
  }

  
  async transferStock(data: TransferStockData): Promise<{
    success: boolean;
    message: string;
    from: any;
    to: any;
  }> {
    // Validate: Quantity must be positive
    if (data.quantity <= 0) {
      throw new BadRequestError('Quantity must be greater than 0');
    }

    // Validate: Product exists
    await productService.validateProductExists(data.productId);

    // Validate: Source and destination warehouses exist
    await warehouseService.validateWarehouseExists(data.fromWarehouseId);
    await warehouseService.validateWarehouseExists(data.toWarehouseId);

    // Validate: Cannot transfer to same warehouse
    if (data.fromWarehouseId === data.toWarehouseId) {
      throw new BadRequestError('Source and destination warehouses must be different');
    }

    // Check source stock
    const sourceStock = await stockRepository.findByProductAndWarehouse(
      data.productId,
      data.fromWarehouseId
    );

    if (!sourceStock) {
      throw new NotFoundError('Product not found in source warehouse');
    }

    if (sourceStock.quantity < data.quantity) {
      throw new BadRequestError(
        `Insufficient stock in source warehouse. Available: ${sourceStock.quantity}, Requested: ${data.quantity}`
      );
    }

    // Check destination warehouse capacity
    const canAccommodate = await warehouseService.canAccommodate(
      data.toWarehouseId,
      data.quantity
    );

    if (!canAccommodate) {
      const availableSpace = await warehouseService.checkCapacity(data.toWarehouseId);
      throw new BadRequestError(
        `Insufficient capacity in destination warehouse. Requested: ${data.quantity}, Available: ${availableSpace}`
      );
    }

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Decrement from source
      const fromStock = await tx.warehouseStock.update({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.fromWarehouseId,
          },
        },
        data: {
          quantity: {
            decrement: data.quantity,
          },
        },
        include: {
          warehouse: {
            select: { name: true, location: true },
          },
        },
      });

      // Update source warehouse occupancy
      await tx.warehouse.update({
        where: { id: data.fromWarehouseId },
        data: {
          currentOccupancy: {
            decrement: data.quantity,
          },
        },
      });

      // Check if destination stock entry exists
      const existingDestStock = await tx.warehouseStock.findUnique({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.toWarehouseId,
          },
        },
      });

      let toStock;
      if (existingDestStock) {
        // Increment existing destination stock
        toStock = await tx.warehouseStock.update({
          where: {
            productId_warehouseId: {
              productId: data.productId,
              warehouseId: data.toWarehouseId,
            },
          },
          data: {
            quantity: {
              increment: data.quantity,
            },
            lastRestocked: new Date(),
          },
          include: {
            warehouse: {
              select: { name: true, location: true },
            },
          },
        });
      } else {
        // Create new destination stock entry
        toStock = await tx.warehouseStock.create({
          data: {
            product: { connect: { id: data.productId } },
            warehouse: { connect: { id: data.toWarehouseId } },
            quantity: data.quantity,
            lastRestocked: new Date(),
          },
          include: {
            warehouse: {
              select: { name: true, location: true },
            },
          },
        });
      }

      // Update destination warehouse occupancy
      await tx.warehouse.update({
        where: { id: data.toWarehouseId },
        data: {
          currentOccupancy: {
            increment: data.quantity,
          },
        },
      });

      return { fromStock, toStock };
    });

    return {
      success: true,
      message: `Successfully transferred ${data.quantity} units between warehouses`,
      from: result.fromStock,
      to: result.toStock,
    };
  }

  
  async getWarehouseStockLevels(warehouseId: string): Promise<any[]> {
    // Validate: Warehouse exists
    await warehouseService.validateWarehouseExists(warehouseId);

    return await stockRepository.findByWarehouse(warehouseId);
  }

  
  async getProductStockAcrossWarehouses(productId: string): Promise<any[]> {
    // Validate: Product exists
    await productService.validateProductExists(productId);

    return await stockRepository.findByProduct(productId);
  }

  
  async getLowStockAlerts(warehouseId: string): Promise<any[]> {
    // Validate: Warehouse exists
    await warehouseService.validateWarehouseExists(warehouseId);

    return await stockRepository.getLowStockAlerts(warehouseId);
  }

  
  async getAllLowStockItems(): Promise<any[]> {
    return await stockRepository.findStocksBelowThreshold();
  }
}

export default new WarehouseStockService();