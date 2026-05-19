const Lead = require('../models/Lead');

const listAnalytics = async (req, res) => {
  try {
    const total = await Lead.countDocuments();
    const converted = await Lead.countDocuments({ status: 'converted' });
    const lost = await Lead.countDocuments({ status: 'lost' });
    const pending = await Lead.countDocuments({ status: 'pending' });
    const active = await Lead.countDocuments({
      status: { $in: ['new', 'contacted', 'qualified', 'pending'] },
    });

    const byStatus = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
      { $sort: { status: 1 } },
    ]);

    const bySource = await Lead.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $project: { _id: 0, source: '$_id', count: 1 } },
      { $sort: { source: 1 } },
    ]);

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

module.exports = {
  listAnalytics,
};
