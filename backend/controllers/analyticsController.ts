import type { Request, Response } from 'express';
import Lead from '../models/Lead';

export const listAnalytics = async (_req: Request, res: Response) => {
  try {
    const total = await Lead.countDocuments();
    const converted = await Lead.countDocuments({ status: 'converted' });
    const lost = await Lead.countDocuments({ status: 'lost' });
    const pending = await Lead.countDocuments({ status: 'pending' });
    const active = await Lead.countDocuments({
      status: { $in: ['new', 'contacted', 'qualified', 'pending'] },
    });

    const byStatusRaw = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]);

    const bySourceRaw = await Lead.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $project: { _id: 0, source: '$_id', count: 1 } },
    ]);

    // Define ordering, labels and colors so frontend can render consistent legends
    const statusOrder = [
      { key: 'new', label: 'New', color: '#06b6d4' },
      { key: 'contacted', label: 'Contacted', color: '#f59e0b' },
      { key: 'qualified', label: 'Qualified', color: '#84cc16' },
      { key: 'converted', label: 'Converted', color: '#10b981' },
      { key: 'lost', label: 'Lost', color: '#ef4444' },
      { key: 'pending', label: 'Pending', color: '#7c3aed' },
    ];

    const sourceOrder = [
      { key: 'website', label: 'Website', color: '#22d3ee' },
      { key: 'referral', label: 'Referral', color: '#2563eb' },
      { key: 'social', label: 'Social', color: '#14b8a6' },
      { key: 'cold_call', label: 'Cold Call', color: '#60a5fa' },
      { key: 'event', label: 'Event', color: '#818cf8' },
      { key: 'linkedin', label: 'LinkedIn', color: '#a855f7' },
      { key: 'instagram', label: 'Instagram', color: '#f472b6' },
      { key: 'cold_email', label: 'Cold Email', color: '#f59e0b' },
    ];

    const byStatus = statusOrder.map((s) => ({ status: s.key, count: (byStatusRaw.find((r) => r.status === s.key)?.count) || 0, label: s.label, color: s.color }));
    const bySource = sourceOrder.map((s) => ({ source: s.key, count: (bySourceRaw.find((r) => r.source === s.key)?.count) || 0, label: s.label, color: s.color }));

    const conversionsByMonth = await Lead.aggregate([
      { $match: { status: 'converted' } },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' },
                ],
              },
            ],
          },
          count: 1,
        },
      },
      { $sort: { month: 1 } },
    ]);

    return res.json({
      totals: {
        total,
        active,
        converted,
        lost,
        pending,
      },
      byStatus,
      bySource,
      conversionsByMonth,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
