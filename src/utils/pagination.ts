interface PaginationParams {
  page?: string | number;
  limit?: string | number;
}

interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
}

export function getPaginationParams(params: PaginationParams): PaginationResult {
  const page = Math.max(1, parseInt(String(params.page || 1), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(params.limit || 10), 10)));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function getPaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1
  };
}
