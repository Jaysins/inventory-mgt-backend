import { OrderStatus } from '@prisma/client';

export interface PurchaseOrderFilters {
  status?: OrderStatus;
  productId?: string;
  warehouseId?: string;
  supplierId?: string;
  orderDateFrom?: Date;
  orderDateTo?: Date;
}


export interface CreatePurchaseOrderData {
  productId: string;
  supplierId: string;
  warehouseId: string;
  quantityOrdered: number;
  notes?: string;
  orderDate?: Date;
  expectedArrivalDate?: Date;
  leadTimeDays?: number;
}

export interface UpdatePurchaseOrderData {
  quantityOrdered?: number;
  expectedArrivalDate?: Date;
  notes?: string;
}
