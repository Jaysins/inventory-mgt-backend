import { Response } from 'express';
import { ErrorResponse, PaginatedResponse, SuccessResponse } from '../types/core.type';


export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): Response<SuccessResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  errors: any = null
): Response<ErrorResponse> {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors })
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T,
  pagination: { page: number; limit: number; total: number },
  message: string = 'Success'
): Response<PaginatedResponse<T>> {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrevPage: pagination.page > 1
    }
  });
}
