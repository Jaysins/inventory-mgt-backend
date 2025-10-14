import Joi from 'joi';

export const createWarehouseSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .trim()
    .messages({
      'string.min': 'Warehouse name must be at least 2 characters',
      'string.max': 'Warehouse name must not exceed 255 characters',
      'any.required': 'Warehouse name is required',
    }),

  location: Joi.string()
    .min(3)
    .max(500)
    .required()
    .trim()
    .messages({
      'string.min': 'Location must be at least 3 characters',
      'string.max': 'Location must not exceed 500 characters',
      'any.required': 'Location is required',
    }),

  capacity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.min': 'Capacity must be at least 1',
      'number.integer': 'Capacity must be an integer',
      'any.required': 'Capacity is required',
    }),
});

export const updateWarehouseSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .trim()
    .messages({
      'string.min': 'Warehouse name must be at least 2 characters',
      'string.max': 'Warehouse name must not exceed 255 characters',
    }),

  location: Joi.string()
    .min(3)
    .max(500)
    .optional()
    .trim()
    .messages({
      'string.min': 'Location must be at least 3 characters',
      'string.max': 'Location must not exceed 500 characters',
    }),

  capacity: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.min': 'Capacity must be at least 1',
      'number.integer': 'Capacity must be an integer',
    }),

  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be a boolean value',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const queryWarehouseSchema = Joi.object({
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

  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be a boolean value',
    }),

  location: Joi.string()
    .optional()
    .trim()
    .messages({
      'string.base': 'Location must be a string',
    }),

  name: Joi.string()
    .optional()
    .trim()
    .messages({
      'string.base': 'Name must be a string',
    }),
});