const Joi = require('joi');

const createLeadSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(80).required(),
  lastName: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9+()\-\s]{7,20}$/).allow('', null),
  company: Joi.string().allow('', null),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'converted', 'lost').optional(),
  source: Joi.string().valid('website', 'referral', 'social', 'cold_call', 'event').required(),
  notes: Joi.string().allow('', null),
  assignedTo: Joi.string().allow('', null),
});

const updateLeadSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(80),
  lastName: Joi.string().trim().min(2).max(80),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[0-9+()\-\s]{7,20}$/).allow('', null),
  company: Joi.string().allow('', null),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'converted', 'lost'),
  source: Joi.string().valid('website', 'referral', 'social', 'cold_call', 'event'),
  notes: Joi.string().allow('', null),
  assignedTo: Joi.string().allow('', null),
}).min(1);

module.exports = {
  createLeadSchema,
  updateLeadSchema,
};
