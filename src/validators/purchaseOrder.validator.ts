import Joi from 'joi';

export const createPurchaseOrderSchema = Joi.object({
  productId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid product ID format',
      'any.required': 'Product ID is required',
    }),

  supplierId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid supplier ID format',
      'any.required': 'Supplier ID is required',
    }),

  warehouseId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid warehouse ID format',
      'any.required': 'Warehouse ID is required',
    }),

  quantityOrdered: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.min': 'Quantity ordered must be at least 1',
      'number.integer': 'Quantity ordered must be an integer',
      'any.required': 'Quantity ordered is required',
    }),

  notes: Joi.string()
    .optional()
    .trim()
    .allow('')
    .messages({
      'string.base': 'Notes must be a string',
    }),

  leadTimeDays: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .optional()
    .default(3)
    .messages({
      'number.min': 'Lead time must be at least 1 day',
      'number.max': 'Lead time must not exceed 365 days',
      'number.integer': 'Lead time must be an integer',
    }),
});

export const updatePurchaseOrderSchema = Joi.object({
  quantityOrdered: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.min': 'Quantity ordered must be at least 1',
      'number.integer': 'Quantity ordered must be an integer',
    }),

  expectedArrivalDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Expected arrival date must be a valid ISO date',
    }),

  notes: Joi.string()
    .optional()
    .trim()
    .allow('')
    .messages({
      'string.base': 'Notes must be a string',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const queryPurchaseOrderSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),

  status: Joi.string()
    .valid('PENDING', 'RECEIVED', 'CANCELLED')
    .optional()
    .messages({
      'any.only': 'Status must be one of: PENDING, RECEIVED, CANCELLED',
    }),

  productId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Invalid product ID format',
    }),

  warehouseId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Invalid warehouse ID format',
    }),

  supplierId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Invalid supplier ID format',
    }),

  orderDateFrom: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Order date from must be a valid ISO date',
    }),

  orderDateTo: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Order date to must be a valid ISO date',
    }),
});