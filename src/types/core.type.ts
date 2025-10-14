import {Request} from "express";

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

export interface PaginationParams {
  page?: string | number;
  limit?: string | number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
}


export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
}