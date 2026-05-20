import type { FormEvent } from 'react';
import type { LeadForm, LeadErrors, FormFieldEvent } from '../types';

interface Props {
  leadForm: LeadForm;
  leadErrors: LeadErrors;
  loading: boolean;
  onChange: (e: FormFieldEvent) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export default function CreateLeadForm({ leadForm, leadErrors, loading, onChange, onSubmit }: Props) {
  return (
    <section className="card">
      <h2>Create Lead</h2>
      <form onSubmit={onSubmit} className="form-grid">
        <input name="firstName" placeholder="First name" value={leadForm.firstName} onChange={onChange} className={leadErrors.firstName ? 'input-error' : ''} required />
        {leadErrors.firstName && <span className="field-error">{leadErrors.firstName}</span>}
        <input name="lastName" placeholder="Last name" value={leadForm.lastName} onChange={onChange} className={leadErrors.lastName ? 'input-error' : ''} required />
        {leadErrors.lastName && <span className="field-error">{leadErrors.lastName}</span>}
        <input name="email" placeholder="Email" value={leadForm.email} onChange={onChange} className={leadErrors.email ? 'input-error' : ''} required />
        {leadErrors.email && <span className="field-error">{leadErrors.email}</span>}
        <input name="phone" placeholder="Phone" value={leadForm.phone} onChange={onChange} />
        {leadErrors.phone && <span className="field-error">{leadErrors.phone}</span>}
        <input name="company" placeholder="Company" value={leadForm.company} onChange={onChange} />
        <select name="source" value={leadForm.source} onChange={onChange}>
          <option value="website">Website</option>
          <option value="referral">Referral</option>
          <option value="social">Social</option>
          <option value="cold_call">Cold call</option>
          <option value="event">Event</option>
          <option value="linkedin">LinkedIn</option>
          <option value="instagram">Instagram</option>
          <option value="cold_email">Cold email</option>
        </select>
        {leadErrors.source && <span className="field-error">{leadErrors.source}</span>}
        <select name="status" value={leadForm.status} onChange={onChange}>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
          <option value="pending">Pending</option>
        </select>
        <textarea name="notes" placeholder="Notes" value={leadForm.notes} onChange={onChange} rows={3} />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Add lead'}
        </button>
      </form>
    </section>
  );
}