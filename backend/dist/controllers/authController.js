"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(require("../models/User"));
const ACCESS_TTL = '15m';
const REFRESH_TTL_DAYS = 30;
const signAccessToken = (userId, role) => {
    return jsonwebtoken_1.default.sign({ id: String(userId), role }, process.env.JWT_SECRET, {
        expiresIn: ACCESS_TTL,
    });
};
const generateRefreshToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
const hashToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
const issueTokens = async (user) => {
    const accessToken = signAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
    user.refreshTokenHash = refreshTokenHash;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await user.save();
    return { accessToken, refreshToken };
};
const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const existing = await User_1.default.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: 'Email already in use' });
        }
        const user = await User_1.default.create({
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
        });
        const { accessToken, refreshToken } = await issueTokens(user);
        return res.status(201).json({
            token: accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }
        const user = await User_1.default.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: 'User disabled' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const { accessToken, refreshToken } = await issueTokens(user);
        return res.json({
            token: accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.login = login;
const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token required' });
        }
        const refreshTokenHash = hashToken(refreshToken);
        const user = await User_1.default.findOne({ refreshTokenHash });
        if (!user || !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: 'User disabled' });
        }
        const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user);
        return res.json({
            token: accessToken,
            refreshToken: newRefreshToken,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.refresh = refresh;
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token required' });
        }
        const refreshTokenHash = hashToken(refreshToken);
        const user = await User_1.default.findOne({ refreshTokenHash });
        if (!user) {
            return res.status(204).send();
        }
        user.refreshTokenHash = null;
        user.refreshTokenExpiresAt = null;
        await user.save();
        return res.status(204).send();
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.logout = logout;
