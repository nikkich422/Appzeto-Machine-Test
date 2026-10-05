import { AuditLog } from '../models/AuditLog.js';
import { OrganizationMember } from '../models/OrganizationMember.js';

export const getAuditLogs = async (req, res) => {
  const currentUserId = req.user.id;
  const {
    organizationId,
    entity,
    action,
    userId,
    startDate,
    endDate,
    page = '1',
    limit = '25',
  } = req.query;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId query parameter is required.' });
  }

  try {
    const membership = await OrganizationMember.findOne({
      organizationId,
      userId: currentUserId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access forbidden. You are not a member of this organization.' });
    }

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permission denied. Only ADMIN or OWNER can view audit logs.' });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const query = { organizationId };

    if (entity) query.entity = entity;
    if (action) query.action = action;
    if (userId) query.userId = userId;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .populate('userId', 'id name email avatar')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const formatted = logs.map((l) => {
      const obj = l.toJSON();
      obj.user = l.userId
        ? {
            id: l.userId._id.toString(),
            name: l.userId.name,
            email: l.userId.email,
            avatar: l.userId.avatar,
          }
        : null;
      return obj;
    });

    return res.json({
      data: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
};
