import type { Request, Response } from 'express';
import Lead from '../models/Lead';
import { logAudit } from '../utils/audit';
import { toCsv } from '../utils/csv';

type FilterInput = {
  status?: string;
  source?: string;
  search?: string;
  preset?: string;
  startDate?: string;
  endDate?: string;
  user?: Request['user'];
};

const buildFilter = ({ status, source, search, preset, startDate, endDate, user }: FilterInput) => {
  const filter: Record<string, any> = {};

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

  if (user?.role === 'sales') {
    filter.$or = [
      { createdBy: user._id },
      { assignedTo: user._id },
    ];
  }

  return filter;
};

export const createLead = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, company, status, source, notes, assignedTo } = req.body;

    if (!firstName || !lastName || !email || !source) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const assignedOwner = req.user?.role === 'sales' && !assignedTo
      ? req.user._id
      : assignedTo;

    const lead = await Lead.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      company,
      status,
      source,
      notes,
      createdBy: req.user?._id,
      assignedTo: assignedOwner || null,
      activities: [
        {
          type: 'created',
          message: 'Lead created',
          createdBy: req.user?._id,
        },
      ],
    });

    return res.status(201).json(lead);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getLeads = async (req: Request, res: Response) => {
  try {
    const query = req.query as Record<string, string | undefined>;
    const {
      status,
      source,
      search,
      sort = 'desc',
      sortBy = 'createdAt',
      page = '1',
      limit = '10',
      preset,
      startDate,
      endDate,
    } = query;

    const filter = buildFilter({ status, source, search, preset, startDate, endDate, user: req.user });

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const sortOrder = sort === 'asc' ? 1 : -1;
    const allowedSortFields = ['createdAt', 'firstName', 'lastName', 'email', 'status', 'source'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

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

export const getLeadById = async (req: Request, res: Response) => {
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

export const updateLead = async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (req.user?.role === 'sales') {
      const ownsLead = String(lead.createdBy) === String(req.user._id)
        || String(lead.assignedTo) === String(req.user._id);
      if (!ownsLead) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    const changes: string[] = [];
    const body = req.body as Record<string, any>;
    Object.keys(body).forEach((key) => {
      if (body[key] !== undefined && body[key] !== (lead as any)[key]) {
        changes.push(key);
      }
    });

    const oldStatus = (lead as any).status;

    Object.assign(lead, body);
    if (changes.length > 0) {
      (lead as any).activities.push({
        type: 'updated',
        message: `Updated: ${changes.join(', ')}`,
        createdBy: req.user?._id || null,
      });
    }

    if (body.status && body.status !== oldStatus) {
      (lead as any).activities.push({
        type: 'status_changed',
        message: `Status changed to ${body.status}`,
        createdBy: req.user?._id || null,
      });
    }

    const updated = await lead.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const addNote = async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (req.user?.role === 'sales') {
      const ownsLead = String(lead.createdBy) === String(req.user._id)
        || String(lead.assignedTo) === String(req.user._id);
      if (!ownsLead) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    (lead as any).notesLog = (lead as any).notesLog || [];
    (lead as any).notesLog.push({
      text: req.body.text,
      createdBy: req.user?._id,
    });
    (lead as any).activities.push({
      type: 'updated',
      message: 'Note added',
      createdBy: req.user?._id,
    });

    const updated = await lead.save();
    return res.status(201).json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (req.user?.role === 'sales') {
      const ownsLead = String(lead.createdBy) === String(req.user._id)
        || String(lead.assignedTo) === String(req.user._id);
      if (!ownsLead) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    (lead as any).notesLog = ((lead as any).notesLog || []).filter(
      (note: any) => String(note._id) !== req.params.noteId
    );
    const updated = await lead.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    const deleted = await Lead.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    await logAudit({
      action: 'lead_deleted',
      actorId: req.user?._id,
      targetId: deleted._id,
      targetType: 'Lead',
      meta: { email: deleted.email },
    });
    return res.json({ message: 'Lead deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const exportLeads = async (req: Request, res: Response) => {
  try {
    const query = req.query as Record<string, string | undefined>;
    const {
      status,
      source,
      search,
      sort = 'desc',
      sortBy = 'createdAt',
      preset,
      startDate,
      endDate,
    } = query;

    const filter = buildFilter({ status, source, search, preset, startDate, endDate, user: req.user });
    const sortOrder = sort === 'asc' ? 1 : -1;
    const allowedSortFields = ['createdAt', 'firstName', 'lastName', 'email', 'status', 'source'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

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

    const rows = leads.map((lead: any) => ({
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
