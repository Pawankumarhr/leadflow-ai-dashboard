"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteSchema = exports.updateLeadSchema = exports.createLeadSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createLeadSchema = joi_1.default.object({
    firstName: joi_1.default.string().trim().min(2).max(80).required(),
    lastName: joi_1.default.string().trim().min(2).max(80).required(),
    email: joi_1.default.string().email().required(),
    phone: joi_1.default.string().pattern(/^[0-9+()\-\s]{7,20}$/).allow('', null),
    company: joi_1.default.string().allow('', null),
    status: joi_1.default.string().valid('new', 'contacted', 'qualified', 'converted', 'lost', 'pending').optional(),
    source: joi_1.default.string().valid('website', 'referral', 'social', 'cold_call', 'event', 'linkedin', 'instagram', 'cold_email').required(),
    notes: joi_1.default.string().allow('', null),
    assignedTo: joi_1.default.string().allow('', null),
});
exports.updateLeadSchema = joi_1.default.object({
    firstName: joi_1.default.string().trim().min(2).max(80),
    lastName: joi_1.default.string().trim().min(2).max(80),
    email: joi_1.default.string().email(),
    phone: joi_1.default.string().pattern(/^[0-9+()\-\s]{7,20}$/).allow('', null),
    company: joi_1.default.string().allow('', null),
    status: joi_1.default.string().valid('new', 'contacted', 'qualified', 'converted', 'lost', 'pending'),
    source: joi_1.default.string().valid('website', 'referral', 'social', 'cold_call', 'event', 'linkedin', 'instagram', 'cold_email'),
    notes: joi_1.default.string().allow('', null),
    assignedTo: joi_1.default.string().allow('', null),
}).min(1);
exports.noteSchema = joi_1.default.object({
    text: joi_1.default.string().trim().min(2).max(500).required(),
});
