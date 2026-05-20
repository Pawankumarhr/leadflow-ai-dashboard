"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const leadSchema = new mongoose_1.default.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    company: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'qualified', 'converted', 'lost', 'pending'],
        default: 'new',
    },
    source: {
        type: String,
        enum: ['website', 'referral', 'social', 'cold_call', 'event', 'linkedin', 'instagram', 'cold_email'],
        required: true,
    },
    notes: {
        type: String,
        trim: true,
    },
    notesLog: [
        {
            text: {
                type: String,
                required: true,
            },
            createdBy: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: 'User',
                default: null,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignedTo: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    activities: [
        {
            type: {
                type: String,
                enum: ['created', 'updated', 'status_changed'],
                required: true,
            },
            message: {
                type: String,
                required: true,
            },
            createdBy: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: 'User',
                default: null,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
}, { timestamps: true });
// Create indexes for filtering and sorting
leadSchema.index({ email: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1, source: 1 });
const Lead = mongoose_1.default.model('Lead', leadSchema);
exports.default = Lead;
