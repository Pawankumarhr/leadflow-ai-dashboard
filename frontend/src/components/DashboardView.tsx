import type { ChangeEvent, FormEvent } from 'react';
import type {
  ActivityType,
  AuditLog,
  Filters,
  FormFieldEvent,
  Lead,
  LeadErrors,
  LeadForm,
  LeadStatus,
  Meta,
  Preset,
  PresetKey,
  User,
  UserErrors,
  UserRole,
} from '../types';

import CreateLeadForm from './Createleadform';
import LeadFilters from './LeadFilters';
import LeadsTable from './LeadTables';
import EditLeadPanel from './Editleadpanel';
import TeamUsers from './Teamusers';
import AuditLogs from './Auditlogs';

type ActivityFilter = {
  type: ActivityType;
  search: string;
};

type DashboardViewProps = {
  leadForm: LeadForm;
  leadErrors: LeadErrors;
  loading: boolean;
  onLeadChange: (e: FormFieldEvent) => void;
  onSubmitLead: (e: FormEvent<HTMLFormElement>) => void;

  filters: Filters;
  presets: Preset[];
  presetName: string;
  exporting: boolean;
  meta: Meta;
  onFilterChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onPresetNameChange: (value: string) => void;
  onSavePreset: () => void;
  onApplyPreset: (preset: Preset) => void;
  onDeletePreset: (name: string) => void;
  onExport: () => void;
  onQuickPreset: (preset: PresetKey) => void;

  leads: Lead[];
  canDelete: boolean;
  hasFilters: boolean;
  page: number;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;

  editingLead: Lead | null;
  editForm: LeadForm;
  noteText: string;
  activityFilter: ActivityFilter;
  onEditChange: (e: FormFieldEvent) => void;
  onSubmitEdit: (e: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onNoteTextChange: (value: string) => void;
  onAddNote: (leadId: string, text: string) => void;
  onDeleteNote: (leadId: string, noteId: string) => void;
  onActivityFilterChange: (filter: ActivityFilter) => void;

  isAdmin: boolean;
  users: User[];
  userForm: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
  };
  userErrors: UserErrors;
  onUserChange: (e: FormFieldEvent) => void;
  onSubmitUser: (e: FormEvent<HTMLFormElement>) => void;
  onToggleUser: (userId: string, isActive: boolean) => void;
  onDeleteUser: (userId: string) => void;

  auditLogs: AuditLog[];
  auditMeta: Meta;
  auditPage: number;
  onAuditPageChange: (page: number) => void;
};

function DashboardView({
  leadForm,
  leadErrors,
  loading,
  onLeadChange,
  onSubmitLead,
  filters,
  presets,
  presetName,
  exporting,
  meta,
  onFilterChange,
  onPresetNameChange,
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
  onExport,
  onQuickPreset,
  leads,
  canDelete,
  hasFilters,
  page,
  onEdit,
  onDelete,
  onStatusChange,
  onPageChange,
  onClearFilters,
  editingLead,
  editForm,
  noteText,
  activityFilter,
  onEditChange,
  onSubmitEdit,
  onCancelEdit,
  onNoteTextChange,
  onAddNote,
  onDeleteNote,
  onActivityFilterChange,
  isAdmin,
  users,
  userForm,
  userErrors,
  onUserChange,
  onSubmitUser,
  onToggleUser,
  onDeleteUser,
  auditLogs,
  auditMeta,
  auditPage,
  onAuditPageChange,
}: DashboardViewProps) {
  return (
    <main className="dashboard">
      <CreateLeadForm
        leadForm={leadForm}
        leadErrors={leadErrors}
        loading={loading}
        onChange={onLeadChange}
        onSubmit={onSubmitLead}
      />

      <section className="card">
        <LeadFilters
          filters={filters}
          presets={presets}
          presetName={presetName}
          exporting={exporting}
          meta={meta}
          onFilterChange={onFilterChange}
          onPresetNameChange={onPresetNameChange}
          onSavePreset={onSavePreset}
          onApplyPreset={onApplyPreset}
          onDeletePreset={onDeletePreset}
          onExport={onExport}
          onQuickPreset={onQuickPreset}
        />
        <LeadsTable
          leads={leads}
          loading={loading}
          canDelete={canDelete}
          hasFilters={hasFilters}
          page={page}
          meta={meta}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onPageChange={onPageChange}
          onClearFilters={onClearFilters}
        />
      </section>

      {editingLead && (
        <EditLeadPanel
          editingLead={editingLead}
          editForm={editForm}
          loading={loading}
          noteText={noteText}
          activityFilter={activityFilter}
          onEditChange={onEditChange}
          onSubmitEdit={onSubmitEdit}
          onCancel={onCancelEdit}
          onNoteTextChange={onNoteTextChange}
          onAddNote={onAddNote}
          onDeleteNote={onDeleteNote}
          onActivityFilterChange={onActivityFilterChange}
        />
      )}

      {isAdmin && (
        <TeamUsers
          users={users}
          userForm={userForm}
          userErrors={userErrors}
          loading={loading}
          onUserChange={onUserChange}
          onSubmitUser={onSubmitUser}
          onToggleUser={onToggleUser}
          onDeleteUser={onDeleteUser}
        />
      )}

      {isAdmin && (
        <AuditLogs
          auditLogs={auditLogs}
          auditMeta={auditMeta}
          auditPage={auditPage}
          onPageChange={onAuditPageChange}
        />
      )}
    </main>
  );
}

export default DashboardView;
