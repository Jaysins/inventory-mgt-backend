import Joi from 'joi';

export const addStockSchema = Joi.object({
  productId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid product ID format',
      'any.required': 'Product ID is required',
    }),

  warehouseId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid warehouse ID format',
      'any.required': 'Warehouse ID is required',
    }),

  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.min': 'Quantity must be at least 1',
      'number.integer': 'Quantity must be an integer',
      'any.required': 'Quantity is required',
    }),
});

export const removeStockSchema = Joi.object({
  productId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid product ID format',
      'any.required': 'Product ID is required',
    }),

  warehouseId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid warehouse ID format',
      'any.required': 'Warehouse ID is required',
    }),

  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.min': 'Quantity must be at least 1',
      'number.integer': 'Quantity must be an integer',
      'any.required': 'Quantity is required',
    }),
});

export const transferStockSchema = Joi.object({
  productId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid product ID format',
      'any.required': 'Product ID is required',
    }),

  fromWarehouseId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid source warehouse ID format',
      'any.required': 'Source warehouse ID is required',
    }),

  toWarehouseId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid destination warehouse ID format',
      'any.required': 'Destination warehouse ID is required',
    }),

  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.min': 'Quantity must be at least 1',
      'number.integer': 'Quantity must be an integer',
      'any.required': 'Quantity is required',
    }),
});