import type { Lead, LeadStatus } from '../types';

interface Props {
  leads: Lead[];
  loading: boolean;
  canDelete: boolean;
  hasFilters: boolean;
  page: number;
  meta: { total: number; pages: number };
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
}

export default function LeadsTable({
  leads,
  loading,
  canDelete,
  hasFilters,
  page,
  meta,
  onEdit,
  onDelete,
  onStatusChange,
  onPageChange,
  onClearFilters,
}: Props) {
  if (loading) {
    return (
      <div className="table">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="table-row" key={`skeleton-${i}`}>
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="empty-state">
        <p className="subtle">No leads yet. Create your first lead to kickstart the pipeline.</p>
        {hasFilters && (
          <button className="btn ghost" onClick={onClearFilters}>
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="table">
        <div className="table-row table-head">
          <span>Name</span>
          <span>Email</span>
          <span>Company</span>
          <span>Status</span>
          <span>Source</span>
          <span>Actions</span>
        </div>
        {leads.map((lead) => (
          <div className="table-row" key={lead._id}>
            <span>{lead.firstName} {lead.lastName}</span>
            <span>{lead.email}</span>
            <span>{lead.company || '-'}</span>
            <span>
              <select
                className="status-select"
                value={lead.status}
                onChange={(e) => onStatusChange(lead._id, e.target.value as LeadStatus)}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
                <option value="pending">Pending</option>
              </select>
            </span>
            <span>{lead.source}</span>
            <span>
              <button className="btn tiny ghost" onClick={() => onEdit(lead)}>Edit</button>
              {canDelete ? (
                <button className="btn tiny danger" onClick={() => onDelete(lead._id)}>Delete</button>
              ) : (
                <span className="subtle">-</span>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button className="btn ghost" onClick={() => onPageChange(Math.max(page - 1, 1))} disabled={page === 1}>
          Prev
        </button>
        <span className="subtle">Page {page} of {meta.pages}</span>
        <button className="btn ghost" onClick={() => onPageChange(Math.min(page + 1, meta.pages))} disabled={page >= meta.pages}>
          Next
        </button>
      </div>
    </>
  );
}