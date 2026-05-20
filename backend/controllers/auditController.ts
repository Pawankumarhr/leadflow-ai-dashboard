import type { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';

export const listAuditLogs = async (req: Request, res: Response) => {
  try {
    const query = req.query as Record<string, string | undefined>;
    const { page = '1', limit = '20' } = query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
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
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
