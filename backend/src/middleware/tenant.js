import { OrganizationMember } from '../models/OrganizationMember.js';
import { ROLE_HIERARCHY } from '../constants/index.js';

export const resolveTenant = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. User not authenticated.' });
  }

  let orgId = req.headers['x-organization-id'] ||
              req.params.organizationId ||
              req.query.organizationId ||
              req.body.organizationId;

  if (!orgId && req.baseUrl.includes('organizations') && req.params.id) {
    orgId = req.params.id;
  }

  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID is required (header x-organization-id, query, or body).' });
  }

  try {
    const member = await OrganizationMember.findOne({
      organizationId: orgId,
      userId: req.user.id,
    });

    if (!member) {
      return res.status(403).json({ error: 'Access forbidden. You are not a member of this organization.' });
    }

    req.tenant = {
      organizationId: orgId,
      role: member.role,
    };

    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    return res.status(500).json({ error: 'Failed to verify organization membership.' });
  }
};

export const requireRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(400).json({ error: 'Tenant context is missing.' });
    }

    const userLevel = ROLE_HIERARCHY[req.tenant.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: `Permission denied. Requires at least ${minimumRole} role. Your role: ${req.tenant.role}.`,
      });
    }

    next();
  };
};
