import Joi from 'joi';
import { ValidationError } from '../middleware/errorHandler.js';

// Validation schemas
export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    full_name: Joi.string().min(2),
    avatar_url: Joi.string().uri(),
    role: Joi.string().valid('admin', 'user', 'aff'),
    tier_vip: Joi.string().valid('silver', 'gold', 'diamond'),
    is_active: Joi.boolean()
  }).min(1),

  upgradeTier: Joi.object({
    tier: Joi.string().valid('silver', 'gold', 'diamond').required()
  }),

  changeRole: Joi.object({
    role: Joi.string().valid('admin', 'user', 'aff').required()
  })
};

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      throw new ValidationError('Validation failed', details);
    }

    req.body = value;
    next();
  };
};
