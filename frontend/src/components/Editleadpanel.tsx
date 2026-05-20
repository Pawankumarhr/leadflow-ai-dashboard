import type { FormEvent } from 'react';
import type { Lead, LeadForm, ActivityType, FormFieldEvent } from '../types';

interface Props {
  editingLead: Lead;
  editForm: LeadForm;
  loading: boolean;
  noteText: string;
  activityFilter: { type: ActivityType; search: string };
  onEditChange: (e: FormFieldEvent) => void;
  onSubmitEdit: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onNoteTextChange: (text: string) => void;
  onAddNote: (leadId: string, text: string) => void;
  onDeleteNote: (leadId: string, noteId: string) => void;
  onActivityFilterChange: (filter: { type: ActivityType; search: string }) => void;
}

export default function EditLeadPanel({
  editingLead,
  editForm,
  loading,
  noteText,
  activityFilter,
  onEditChange,
  onSubmitEdit,
  onCancel,
  onNoteTextChange,
  onAddNote,
  onDeleteNote,
  onActivityFilterChange,
}: Props) {
  const filterActivities = (activities: Lead['activities']) => {
    if (!activities) return [];
    return activities.filter((activity) => {
      if (activityFilter.type !== 'all' && activity.type !== activityFilter.type) return false;
      if (activityFilter.search) {
        return activity.message.toLowerCase().includes(activityFilter.search.toLowerCase());
      }
      return true;
    });
  };

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Edit Lead</h2>
          <p className="subtle">Update details for {editingLead.firstName} {editingLead.lastName}</p>
        </div>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>

      <form onSubmit={onSubmitEdit} className="form-grid">
        <input name="firstName" placeholder="First name" value={editForm.firstName} onChange={onEditChange} required />
        <input name="lastName" placeholder="Last name" value={editForm.lastName} onChange={onEditChange} required />
        <input name="email" placeholder="Email" value={editForm.email} onChange={onEditChange} required />
        <input name="phone" placeholder="Phone" value={editForm.phone} onChange={onEditChange} />
        <input name="company" placeholder="Company" value={editForm.company} onChange={onEditChange} />
        <select name="source" value={editForm.source} onChange={onEditChange}>
          <option value="website">Website</option>
          <option value="referral">Referral</option>
          <option value="social">Social</option>
          <option value="cold_call">Cold call</option>
          <option value="event">Event</option>
          <option value="linkedin">LinkedIn</option>
          <option value="instagram">Instagram</option>
          <option value="cold_email">Cold email</option>
        </select>
        <select name="status" value={editForm.status} onChange={onEditChange}>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
          <option value="pending">Pending</option>
        </select>
        <textarea name="notes" placeholder="Notes" value={editForm.notes} onChange={onEditChange} rows={3} />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <div className="notes">
        <h3>Notes</h3>
        <div className="notes-form">
          <input
            placeholder="Add a note"
            value={noteText}
            onChange={(e) => onNoteTextChange(e.target.value)}
          />
          <button
            className="btn ghost"
            onClick={() => {
              if (!noteText.trim()) return;
              onAddNote(editingLead._id, noteText.trim());
              onNoteTextChange('');
            }}
          >
            Add
          </button>
        </div>
        {editingLead.notesLog && editingLead.notesLog.length > 0 ? (
          <ul className="notes-list">
            {editingLead.notesLog.slice().reverse().map((note) => (
              <li key={note._id}>
                <span>{note.text}</span>
                <span className="subtle">{new Date(note.createdAt).toLocaleString()}</span>
                <button className="btn tiny danger" onClick={() => onDeleteNote(editingLead._id, note._id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="subtle">No notes yet.</p>
        )}
      </div>

      {editingLead.activities && editingLead.activities.length > 0 && (
        <div className="activity">
          <h3>Activity</h3>
          <div className="activity-filters">
            <select
              value={activityFilter.type}
              onChange={(e) =>
                onActivityFilterChange({ ...activityFilter, type: e.target.value as ActivityType })
              }
            >
              <option value="all">All types</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="status_changed">Status changed</option>
            </select>
            <input
              placeholder="Search activity"
              value={activityFilter.search}
              onChange={(e) =>
                onActivityFilterChange({ ...activityFilter, search: e.target.value })
              }
            />
          </div>
          <ul>
            {filterActivities(editingLead.activities)
              .slice()
              .reverse()
              .map((activity, index) => (
                <li key={`${activity.createdAt}-${index}`}>
                  <span className="activity-type">{activity.type.replace('_', ' ')}</span>
                  <span>{activity.message}</span>
                  <span className="subtle">{new Date(activity.createdAt).toLocaleString()}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </section>
  );
}