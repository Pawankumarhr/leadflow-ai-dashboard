import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';

const ACCESS_TTL = '15m';
const REFRESH_TTL_DAYS = 30;

const signAccessToken = (userId: unknown, role: string) => {
  return jwt.sign({ id: String(userId), role }, process.env.JWT_SECRET as string, {
    expiresIn: ACCESS_TTL,
  });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const issueTokens = async (user: any) => {
  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  user.refreshTokenHash = refreshTokenHash;
  user.refreshTokenExpiresAt = refreshTokenExpiresAt;
  await user.save();

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role,
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
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }) as any;
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
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const refreshTokenHash = hashToken(refreshToken);
    const user = await User.findOne({ refreshTokenHash });
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
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const refreshTokenHash = hashToken(refreshToken);
    const user = await User.findOne({ refreshTokenHash });
    if (!user) {
      return res.status(204).send();
    }

    (user as any).refreshTokenHash = null;
    (user as any).refreshTokenExpiresAt = null;
    await user.save();
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
