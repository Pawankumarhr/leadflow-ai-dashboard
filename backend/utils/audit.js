const AuditLog = require('../models/AuditLog');

const logAudit = async ({ action, actorId, targetId, targetType, meta }) => {
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

module.exports = {
  logAudit,
};
