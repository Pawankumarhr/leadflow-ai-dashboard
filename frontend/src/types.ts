import type { ChangeEvent } from 'react';

export type AuthMode = 'login' | 'register';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'pending';
export type LeadSource =
  | 'website'
  | 'referral'
  | 'social'
  | 'cold_call'
  | 'event'
  | 'linkedin'
  | 'instagram'
  | 'cold_email';
export type SortOrder = 'asc' | 'desc';
export type SortBy = 'createdAt' | 'firstName' | 'lastName' | 'email' | 'status' | 'source';
export type PresetKey = '' | 'new' | 'qualified' | 'lost';
export type FormFieldEvent = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
export type ActivityType = 'all' | 'created' | 'updated' | 'status_changed';
export type UserRole = 'admin' | 'manager' | 'sales';

export interface AuthForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LeadForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  source: LeadSource;
  status: LeadStatus;
  notes: string;
}

export interface Filters {
  status: '' | LeadStatus;
  source: '' | LeadSource;
  search: string;
  sort: SortOrder;
  sortBy: SortBy;
  preset: PresetKey;
  startDate: string;
  endDate: string;
}

export interface Meta {
  total: number;
  pages: number;
}

export interface LeadNote {
  _id: string;
  text: string;
  createdAt: string;
}

export interface LeadActivity {
  type: string;
  message: string;
  createdAt: string;
}

export interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  notesLog?: LeadNote[];
  activities?: LeadActivity[];
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface Preset {
  name: string;
  filters: Partial<Filters>;
}

export interface AuditLog {
  _id: string;
  action: string;
  targetType: string;
  meta?: {
    email?: string;
    role?: string;
  };
  createdAt: string;
}

export interface AuthErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export interface LeadErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source?: string;
}

export interface UserErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}
