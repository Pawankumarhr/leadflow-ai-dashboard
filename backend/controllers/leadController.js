const Lead = require('../models/Lead');
const { logAudit } = require('../utils/audit');
const { toCsv } = require('../utils/csv');

const buildFilter = ({ status, source, search, preset, startDate, endDate }) => {
  const filter = {};

  if (status) filter.status = status;
  if (source) filter.source = source;

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
    ];
  }

  if (preset === 'new') filter.status = 'new';
  if (preset === 'qualified') filter.status = 'qualified';
  if (preset === 'lost') filter.status = 'lost';

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  return filter;
};

const createLead = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, company, status, source, notes, assignedTo } = req.body;

    if (!firstName || !lastName || !email || !source) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const lead = await Lead.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      company,
      status,
      source,
      notes,
      createdBy: req.user._id,
      assignedTo: assignedTo || null,
      activities: [
        {
          type: 'created',
          message: 'Lead created',
          createdBy: req.user._id,
        },
      ],
    });

    return res.status(201).json(lead);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const getLeads = async (req, res) => {
  try {
    const { status, source, search, sort = 'desc', sortBy = 'createdAt', page = 1, limit = 10, preset, startDate, endDate } = req.query;

    const filter = buildFilter({ status, source, search, preset, startDate, endDate });

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const sortOrder = sort === 'asc' ? 1 : -1;
    const sortField = ['createdAt', 'firstName', 'lastName', 'email', 'status', 'source'].includes(sortBy)
      ? sortBy
      : 'createdAt';

    const total = await Lead.countDocuments(filter);
    const leads = await Lead.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    return res.json({
      data: leads,
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

const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    return res.json(lead);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const changes = [];
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined && req.body[key] !== lead[key]) {
        changes.push(key);
      }
    });

    const oldStatus = lead.status;

    Object.assign(lead, req.body);
    if (changes.length > 0) {
      lead.activities.push({
        type: 'updated',
        message: `Updated: ${changes.join(', ')}`,
        createdBy: req.user?._id || null,
      });
    }

    if (req.body.status && req.body.status !== oldStatus) {
      lead.activities.push({
        type: 'status_changed',
        message: `Status changed to ${req.body.status}`,
        createdBy: req.user?._id || null,
      });
    }

    const updated = await lead.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteLead = async (req, res) => {
  try {
    const deleted = await Lead.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    await logAudit({
      action: 'lead_deleted',
      actorId: req.user._id,
      targetId: deleted._id,
      targetType: 'Lead',
      meta: { email: deleted.email },
    });
    return res.json({ message: 'Lead deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const exportLeads = async (req, res) => {
  try {
    const { status, source, search, sort = 'desc', sortBy = 'createdAt', preset, startDate, endDate } = req.query;
    const filter = buildFilter({ status, source, search, preset, startDate, endDate });
    const sortOrder = sort === 'asc' ? 1 : -1;
    const sortField = ['createdAt', 'firstName', 'lastName', 'email', 'status', 'source'].includes(sortBy)
      ? sortBy
      : 'createdAt';

    const leads = await Lead.find(filter)
      .sort({ [sortField]: sortOrder })
      .lean();

    const headers = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'company',
      'status',
      'source',
      'notes',
      'createdBy',
      'assignedTo',
      'createdAt',
      'updatedAt',
    ];

    const rows = leads.map((lead) => ({
      ...lead,
      createdBy: lead.createdBy ? String(lead.createdBy) : '',
      assignedTo: lead.assignedTo ? String(lead.assignedTo) : '',
    }));

    const csv = toCsv(rows, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  exportLeads,
};
