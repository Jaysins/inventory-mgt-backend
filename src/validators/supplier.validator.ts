import Joi from 'joi';

export const createSupplierSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .trim()
    .messages({
      'string.min': 'Supplier name must be at least 2 characters',
      'string.max': 'Supplier name must not exceed 255 characters',
      'any.required': 'Supplier name is required',
    }),

  contactInfo: Joi.string()
    .min(5)
    .required()
    .trim()
    .messages({
      'string.min': 'Contact information must be at least 5 characters',
      'any.required': 'Contact information is required',
    }),
});

export const updateSupplierSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .trim()
    .messages({
      'string.min': 'Supplier name must be at least 2 characters',
      'string.max': 'Supplier name must not exceed 255 characters',
    }),

  contactInfo: Joi.string()
    .min(5)
    .optional()
    .trim()
    .messages({
      'string.min': 'Contact information must be at least 5 characters',
    }),

  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be a boolean value',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const querySupplierSchema = Joi.object({
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
});