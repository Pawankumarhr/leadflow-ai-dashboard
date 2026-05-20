import Joi from 'joi';

export const createUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('admin', 'manager', 'sales').optional(),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const updateUserSchema = Joi.object({
  role: Joi.string().valid('admin', 'manager', 'sales'),
  isActive: Joi.boolean(),
}).min(1);

export const savePresetSchema = Joi.object({
  name: Joi.string().trim().min(2).max(40).required(),
  filters: Joi.object().required(),
});
