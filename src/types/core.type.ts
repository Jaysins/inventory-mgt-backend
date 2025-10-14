export interface PaginationOptions {
  page: number;
  limit: number;
}


export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: any;
}

export interface PaginatedResponse<T = any> {
  success: true;
  message: string;
  data: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}


export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}

export interface DashboardStats {
  totalByCurrency: Array<{
    currencyPair: string;
    totalAmount: number;
    totalConverted: number;
    count: number;
  }>;
  recentTransactions: any[];
  summary: {
    totalConversions: number;
    totalAmount: number;
    uniqueCurrencyPairs: number;
  };
}