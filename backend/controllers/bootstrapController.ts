import type { Request, Response } from 'express';
import User from '../models/User';

export const bootstrapAdmin = async (req: Request, res: Response) => {
  const bootstrapToken = process.env.BOOTSTRAP_TOKEN;
  const requestTokenHeader = req.headers['x-bootstrap-token'];
  const requestToken = Array.isArray(requestTokenHeader) ? requestTokenHeader[0] : requestTokenHeader;

  if (!bootstrapToken) {
    return res.status(400).json({ message: 'Bootstrap token not configured' });
  }

  if (!requestToken || requestToken !== bootstrapToken) {
    return res.status(401).json({ message: 'Invalid bootstrap token' });
  }

  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    return res.status(409).json({ message: 'Admin already exists' });
  }

  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    role: 'admin',
  });

  return res.status(201).json({
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  });
};
