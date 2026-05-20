import Joi from 'joi';

export const createLeadSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(80).required(),
  lastName: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9+()\-\s]{7,20}$/).allow('', null),
  company: Joi.string().allow('', null),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'converted', 'lost', 'pending').optional(),
  source: Joi.string().valid('website', 'referral', 'social', 'cold_call', 'event', 'linkedin', 'instagram', 'cold_email').required(),
  notes: Joi.string().allow('', null),
  assignedTo: Joi.string().allow('', null),
});

export const updateLeadSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(80),
  lastName: Joi.string().trim().min(2).max(80),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[0-9+()\-\s]{7,20}$/).allow('', null),
  company: Joi.string().allow('', null),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'converted', 'lost', 'pending'),
  source: Joi.string().valid('website', 'referral', 'social', 'cold_call', 'event', 'linkedin', 'instagram', 'cold_email'),
  notes: Joi.string().allow('', null),
  assignedTo: Joi.string().allow('', null),
}).min(1);

export const noteSchema = Joi.object({
  text: Joi.string().trim().min(2).max(500).required(),
});
