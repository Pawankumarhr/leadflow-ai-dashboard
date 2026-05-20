import type { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        role: 'admin' | 'manager' | 'sales';
        isActive: boolean;
      };
    }
  }
}

export {};
