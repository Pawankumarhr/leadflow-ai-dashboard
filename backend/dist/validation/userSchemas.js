"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePresetSchema = exports.updateUserSchema = exports.refreshSchema = exports.createUserSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createUserSchema = joi_1.default.object({
    firstName: joi_1.default.string().trim().min(2).max(50).required(),
    lastName: joi_1.default.string().trim().min(2).max(50).required(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).max(128).required(),
    role: joi_1.default.string().valid('admin', 'manager', 'sales').optional(),
});
exports.refreshSchema = joi_1.default.object({
    refreshToken: joi_1.default.string().required(),
});
exports.updateUserSchema = joi_1.default.object({
    role: joi_1.default.string().valid('admin', 'manager', 'sales'),
    isActive: joi_1.default.boolean(),
}).min(1);
exports.savePresetSchema = joi_1.default.object({
    name: joi_1.default.string().trim().min(2).max(40).required(),
    filters: joi_1.default.object().required(),
});
