import { WarehouseStock } from "@prisma/client";

export interface AddStockData {
  productId: string;
  warehouseId: string;
  quantity: number;
}

export interface RemoveStockData {
  productId: string;
  warehouseId: string;
  quantity: number;
}

export interface TransferStockData {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
}
export type StockData = WarehouseStock & {
  warehouse: {
    id: string;
    name: string;
    location: string;
  };
};