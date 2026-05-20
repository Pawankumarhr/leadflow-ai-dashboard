import AuditLog from '../models/AuditLog';

type AuditEntry = {
  action: string;
  actorId: unknown;
  targetId: unknown;
  targetType: string;
  meta?: Record<string, unknown>;
};

export const logAudit = async ({ action, actorId, targetId, targetType, meta }: AuditEntry) => {
  try {
    await AuditLog.create({
      action,
      actorId,
      targetId,
      targetType,
      meta,
    });
  } catch (error) {
    // Keep audit logging non-blocking
  }
};
