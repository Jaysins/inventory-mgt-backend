export interface ProductFilters {
  isActive?: boolean;
  name?: string;
  defaultSupplierId?: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  reorderThreshold: number;
  defaultSupplierId: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  reorderThreshold?: number;
  defaultSupplierId?: string;
  isActive?: boolean;
}