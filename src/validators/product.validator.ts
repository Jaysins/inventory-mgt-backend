import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .trim()
    .messages({
      'string.min': 'Product name must be at least 2 characters',
      'string.max': 'Product name must not exceed 255 characters',
      'any.required': 'Product name is required',
    }),

  description: Joi.string()
    .optional()
    .trim()
    .allow('')
    .messages({
      'string.base': 'Description must be a string',
    }),

  reorderThreshold: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.min': 'Reorder threshold must be 0 or greater',
      'number.integer': 'Reorder threshold must be an integer',
      'any.required': 'Reorder threshold is required',
    }),

  defaultSupplierId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid supplier ID format',
      'any.required': 'Default supplier ID is required',
    }),
});

export const updateProductSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .trim()
    .messages({
      'string.min': 'Product name must be at least 2 characters',
      'string.max': 'Product name must not exceed 255 characters',
    }),

  description: Joi.string()
    .optional()
    .trim()
    .allow('')
    .messages({
      'string.base': 'Description must be a string',
    }),

  reorderThreshold: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Reorder threshold must be 0 or greater',
      'number.integer': 'Reorder threshold must be an integer',
    }),

  defaultSupplierId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Invalid supplier ID format',
    }),

  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be a boolean value',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const queryProductSchema = Joi.object({
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

  name: Joi.string()
    .optional()
    .trim()
    .messages({
      'string.base': 'Name must be a string',
    }),

  defaultSupplierId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Invalid supplier ID format',
    }),

  includeStock: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'includeStock must be a boolean value',
    }),
});