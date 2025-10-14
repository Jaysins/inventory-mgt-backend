export interface WarehouseFilters {
  isActive?: boolean;
  location?: string;
  name?: string;
}

export interface CreateWarehouseData {
  name: string;
  location: string;
  capacity: number;
}

export interface UpdateWarehouseData {
  name?: string;
  location?: string;
  capacity?: number;
  isActive?: boolean;
}
