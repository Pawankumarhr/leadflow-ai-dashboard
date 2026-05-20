"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAuditLogs = void 0;
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const listAuditLogs = async (req, res) => {
    try {
        const query = req.query;
        const { page = '1', limit = '20' } = query;
        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const total = await AuditLog_1.default.countDocuments();
        const logs = await AuditLog_1.default.find()
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .lean();
        return res.json({
            data: logs,
            meta: {
                total,
                page: pageNumber,
                limit: limitNumber,
                pages: Math.ceil(total / limitNumber),
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.listAuditLogs = listAuditLogs;
