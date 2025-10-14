export interface SupplierFilters {
  isActive?: boolean;
  name?: string;
}

export interface CreateSupplierData {
  name: string;
  contactInfo: string;
}

export interface UpdateSupplierData {
  name?: string;
  contactInfo?: string;
  isActive?: boolean;
}