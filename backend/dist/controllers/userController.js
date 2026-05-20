"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePreset = exports.savePreset = exports.listPresets = exports.deleteUser = exports.updateUser = exports.createUser = exports.listUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const audit_1 = require("../utils/audit");
const listUsers = async (_req, res) => {
    try {
        const users = await User_1.default.find().select('-password -refreshTokenHash').sort({ createdAt: -1 });
        return res.json({ data: users });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.listUsers = listUsers;
const createUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;
        const existing = await User_1.default.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: 'Email already in use' });
        }
        const user = await User_1.default.create({
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
            role: role || 'sales',
        });
        await (0, audit_1.logAudit)({
            action: 'user_created',
            actorId: req.user?._id,
            targetId: user._id,
            targetType: 'User',
            meta: { email: user.email, role: user.role },
        });
        return res.status(201).json({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { role, isActive } = req.body;
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (role)
            user.role = role;
        if (typeof isActive === 'boolean')
            user.isActive = isActive;
        await user.save();
        await (0, audit_1.logAudit)({
            action: 'user_updated',
            actorId: req.user?._id,
            targetId: user._id,
            targetType: 'User',
            meta: { role: user.role, isActive: user.isActive },
        });
        return res.json({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const user = await User_1.default.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await (0, audit_1.logAudit)({
            action: 'user_deleted',
            actorId: req.user?._id,
            targetId: user._id,
            targetType: 'User',
            meta: { email: user.email },
        });
        return res.json({ message: 'User deleted' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteUser = deleteUser;
const listPresets = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user?._id).select('filterPresets');
        return res.json({ data: user?.filterPresets || [] });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.listPresets = listPresets;
const savePreset = async (req, res) => {
    try {
        const { name, filters } = req.body;
        const user = await User_1.default.findById(req.user?._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.filterPresets = (user.filterPresets || []).filter((preset) => preset.name !== name);
        user.filterPresets.push({ name, filters, createdAt: new Date() });
        await user.save();
        return res.status(201).json({ message: 'Preset saved' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.savePreset = savePreset;
const deletePreset = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user?._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.filterPresets = (user.filterPresets || []).filter((preset) => preset.name !== req.params.name);
        await user.save();
        return res.json({ message: 'Preset deleted' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.deletePreset = deletePreset;
