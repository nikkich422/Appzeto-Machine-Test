import { AuditLog } from '../models/AuditLog.js';

export const createAuditLog = async ({
  userId,
  organizationId,
  action,
  entity,
  entityId,
  oldValue,
  newValue,
}) => {
  try {
    const log = await AuditLog.create({
      userId: userId || null,
      organizationId,
      action,
      entity,
      entityId,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      timestamp: new Date(),
    });
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
};
