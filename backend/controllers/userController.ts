import type { Request, Response } from 'express';
import User from '../models/User';
import { logAudit } from '../utils/audit';

export const listUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password -refreshTokenHash').sort({ createdAt: -1 });
    return res.json({ data: users });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role: role || 'sales',
    });

    await logAudit({
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
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    await logAudit({
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
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await logAudit({
      action: 'user_deleted',
      actorId: req.user?._id,
      targetId: user._id,
      targetType: 'User',
      meta: { email: user.email },
    });

    return res.json({ message: 'User deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const listPresets = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('filterPresets');
    return res.json({ data: user?.filterPresets || [] });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const savePreset = async (req: Request, res: Response) => {
  try {
    const { name, filters } = req.body;
    const user = await User.findById(req.user?._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.filterPresets = (user.filterPresets || []).filter((preset: any) => preset.name !== name);
    user.filterPresets.push({ name, filters, createdAt: new Date() });
    await user.save();

    return res.status(201).json({ message: 'Preset saved' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deletePreset = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.filterPresets = (user.filterPresets || []).filter(
      (preset: any) => preset.name !== req.params.name
    );
    await user.save();

    return res.json({ message: 'Preset deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
