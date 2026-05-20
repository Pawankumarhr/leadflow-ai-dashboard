"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const logAudit = async ({ action, actorId, targetId, targetType, meta }) => {
    try {
        await AuditLog_1.default.create({
            action,
            actorId,
            targetId,
            targetType,
            meta,
        });
    }
    catch (error) {
        // Keep audit logging non-blocking
    }
};
exports.logAudit = logAudit;
