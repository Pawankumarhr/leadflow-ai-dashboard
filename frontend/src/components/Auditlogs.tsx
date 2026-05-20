import type { AuditLog, Meta } from '../types';

interface Props {
  auditLogs: AuditLog[];
  auditMeta: Meta;
  auditPage: number;
  onPageChange: (page: number) => void;
}

export default function AuditLogs({ auditLogs, auditMeta, auditPage, onPageChange }: Props) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Audit Logs</h2>
          <p className="subtle">Recent admin actions</p>
        </div>
      </div>

      {auditLogs.length === 0 ? (
        <p className="subtle">No audit logs yet.</p>
      ) : (
        <div className="table audit-table">
          <div className="table-row table-head">
            <span>Action</span>
            <span>Target</span>
            <span>Meta</span>
            <span>Time</span>
          </div>
          {auditLogs.map((log) => (
            <div className="table-row" key={log._id}>
              <span>{log.action}</span>
              <span>{log.targetType}</span>
              <span>{log.meta?.email || log.meta?.role || '-'}</span>
              <span>{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      <div className="pagination">
        <button
          className="btn ghost"
          onClick={() => onPageChange(Math.max(auditPage - 1, 1))}
          disabled={auditPage === 1}
        >
          Prev
        </button>
        <span className="subtle">Page {auditPage} of {auditMeta.pages}</span>
        <button
          className="btn ghost"
          onClick={() => onPageChange(Math.min(auditPage + 1, auditMeta.pages))}
          disabled={auditPage >= auditMeta.pages}
        >
          Next
        </button>
      </div>
    </section>
  );
}