import Joi from 'joi';

export const dashboardStatsSchema = Joi.object({
  days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .optional()
    .default(30)
    .messages({
      'number.min': 'Days must be at least 1',
      'number.max': 'Days cannot exceed 365'
    })
});


export const chartDataSchema = Joi.object({
  days: Joi.number()
    .integer()
    .min(1)
    .max(90)
    .optional()
    .default(7)
    .messages({
      'number.min': 'Days must be at least 1',
      'number.max': 'Days cannot exceed 90'
    })
});
