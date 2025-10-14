export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already exists',
  USER_NOT_FOUND: 'User not found',
  INVALID_TOKEN: 'Invalid or expired token',
  UNAUTHORIZED: 'Unauthorized access',
  VALIDATION_FAILED: 'Validation failed',
  INVALID_CURRENCY: 'Invalid currency code',
  UNSUPPORTED_CURRENCY: 'Currency not supported',
  CONVERSION_FAILED: 'Failed to create conversion',
  RATE_FETCH_FAILED: 'Failed to fetch exchange rate',
  INTERNAL_ERROR: 'Internal server error'
} as const;

export const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  CONVERSION_CREATED: 'Conversion created successfully',
  DATA_FETCHED: 'Data fetched successfully'
} as const;

export const CACHE_KEYS = {
  EXCHANGE_RATE: (from: string, to: string) => `rate:${from}:${to}`,
  USER: (id: string) => `user:${id}`,
  CONVERSION: (id: string) => `conversion:${id}`
} as const;

export const CACHE_TTL = {
  EXCHANGE_RATE: 3600,
  USER: 1800,
  CONVERSION: 900
} as const;
