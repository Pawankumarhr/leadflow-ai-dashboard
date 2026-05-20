"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportLeads = exports.deleteLead = exports.deleteNote = exports.addNote = exports.updateLead = exports.getLeadById = exports.getLeads = exports.createLead = void 0;
const Lead_1 = __importDefault(require("../models/Lead"));
const audit_1 = require("../utils/audit");
const csv_1 = require("../utils/csv");
const buildFilter = ({ status, source, search, preset, startDate, endDate, user }) => {
    const filter = {};
    if (status)
        filter.status = status;
    if (source)
        filter.source = source;
    if (search) {
        const regex = new RegExp(search, 'i');
        filter.$or = [
            { firstName: regex },
            { lastName: regex },
            { email: regex },
        ];
    }
    if (preset === 'new')
        filter.status = 'new';
    if (preset === 'qualified')
        filter.status = 'qualified';
    if (preset === 'lost')
        filter.status = 'lost';
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = new Date(startDate);
        if (endDate)
            filter.createdAt.$lte = new Date(endDate);
    }
    if (user?.role === 'sales') {
        filter.$or = [
            { createdBy: user._id },
            { assignedTo: user._id },
        ];
    }
    return filter;
};
const createLead = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, company, status, source, notes, assignedTo } = req.body;
        if (!firstName || !lastName || !email || !source) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const assignedOwner = req.user?.role === 'sales' && !assignedTo
            ? req.user._id
            : assignedTo;
        const lead = await Lead_1.default.create({
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
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.createLead = createLead;
const getLeads = async (req, res) => {
    try {
        const query = req.query;
        const { status, source, search, sort = 'desc', sortBy = 'createdAt', page = '1', limit = '10', preset, startDate, endDate, } = query;
        const filter = buildFilter({ status, source, search, preset, startDate, endDate, user: req.user });
        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
        const sortOrder = sort === 'asc' ? 1 : -1;
        const allowedSortFields = ['createdAt', 'firstName', 'lastName', 'email', 'status', 'source'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const total = await Lead_1.default.countDocuments(filter);
        const leads = await Lead_1.default.find(filter)
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
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getLeads = getLeads;
const getLeadById = async (req, res) => {
    try {
        const lead = await Lead_1.default.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }
        return res.json(lead);
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getLeadById = getLeadById;
const updateLead = async (req, res) => {
    try {
        const lead = await Lead_1.default.findById(req.params.id);
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
        const changes = [];
        const body = req.body;
        Object.keys(body).forEach((key) => {
            if (body[key] !== undefined && body[key] !== lead[key]) {
                changes.push(key);
            }
        });
        const oldStatus = lead.status;
        Object.assign(lead, body);
        if (changes.length > 0) {
            lead.activities.push({
                type: 'updated',
                message: `Updated: ${changes.join(', ')}`,
                createdBy: req.user?._id || null,
            });
        }
        if (body.status && body.status !== oldStatus) {
            lead.activities.push({
                type: 'status_changed',
                message: `Status changed to ${body.status}`,
                createdBy: req.user?._id || null,
            });
        }
        const updated = await lead.save();
        return res.json(updated);
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.updateLead = updateLead;
const addNote = async (req, res) => {
    try {
        const lead = await Lead_1.default.findById(req.params.id);
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
        lead.notesLog = lead.notesLog || [];
        lead.notesLog.push({
            text: req.body.text,
            createdBy: req.user?._id,
        });
        lead.activities.push({
            type: 'updated',
            message: 'Note added',
            createdBy: req.user?._id,
        });
        const updated = await lead.save();
        return res.status(201).json(updated);
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.addNote = addNote;
const deleteNote = async (req, res) => {
    try {
        const lead = await Lead_1.default.findById(req.params.id);
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
        lead.notesLog = (lead.notesLog || []).filter((note) => String(note._id) !== req.params.noteId);
        const updated = await lead.save();
        return res.json(updated);
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteNote = deleteNote;
const deleteLead = async (req, res) => {
    try {
        const deleted = await Lead_1.default.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Lead not found' });
        }
        await (0, audit_1.logAudit)({
            action: 'lead_deleted',
            actorId: req.user?._id,
            targetId: deleted._id,
            targetType: 'Lead',
            meta: { email: deleted.email },
        });
        return res.json({ message: 'Lead deleted' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteLead = deleteLead;
const exportLeads = async (req, res) => {
    try {
        const query = req.query;
        const { status, source, search, sort = 'desc', sortBy = 'createdAt', preset, startDate, endDate, } = query;
        const filter = buildFilter({ status, source, search, preset, startDate, endDate, user: req.user });
        const sortOrder = sort === 'asc' ? 1 : -1;
        const allowedSortFields = ['createdAt', 'firstName', 'lastName', 'email', 'status', 'source'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const leads = await Lead_1.default.find(filter)
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
        const csv = (0, csv_1.toCsv)(rows, headers);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
        return res.status(200).send(csv);
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.exportLeads = exportLeads;
