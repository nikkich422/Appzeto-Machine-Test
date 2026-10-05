import { Organization } from '../models/Organization.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { createAuditLog } from '../services/audit.service.js';
import { createNotification } from '../services/notification.service.js';

export const createOrganization = async (req, res) => {
  const { name, slug } = req.body;
  const userId = req.user.id;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Organization name is required.' });
  }

  try {
    const org = await Organization.create({
      name: name.trim(),
      slug: slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    });

    await OrganizationMember.create({
      organizationId: org._id,
      userId,
      role: 'OWNER',
    });

    await createAuditLog({
      userId,
      organizationId: org.id,
      action: 'ORGANIZATION_CREATE',
      entity: 'Organization',
      entityId: org.id,
      newValue: { name: org.name, slug: org.slug },
    });

    return res.status(201).json(org.toJSON());
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Organization slug or name already exists.' });
    }
    console.error('Create organization error:', error);
    return res.status(500).json({ error: 'Failed to create organization.' });
  }
};

export const getOrganizations = async (req, res) => {
  const userId = req.user.id;

  try {
    const memberships = await OrganizationMember.find({ userId })
      .populate('organizationId')
      .sort({ createdAt: -1 });

    const organizations = await Promise.all(
      memberships.map(async (m) => {
        const org = m.organizationId;
        if (!org) return null;

        const [memberCount, projectCount] = await Promise.all([
          OrganizationMember.countDocuments({ organizationId: org._id }),
          Project.countDocuments({ organizationId: org._id }),
        ]);

        return {
          id: org._id.toString(),
          name: org.name,
          slug: org.slug,
          userRole: m.role,
          joinedAt: m.createdAt,
          createdAt: org.createdAt,
          _count: {
            members: memberCount,
            projects: projectCount,
          },
        };
      })
    );

    return res.json(organizations.filter(Boolean));
  } catch (error) {
    console.error('Get organizations error:', error);
    return res.status(500).json({ error: 'Failed to fetch organizations.' });
  }
};

export const getOrganizationById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const member = await OrganizationMember.findOne({
      organizationId: id,
      userId,
    });

    if (!member) {
      return res.status(403).json({ error: 'Access forbidden. You are not a member of this organization.' });
    }

    const [organization, members, projects] = await Promise.all([
      Organization.findById(id),
      OrganizationMember.find({ organizationId: id })
        .populate('userId', 'id name email avatar')
        .sort({ role: 1 }),
      Project.find({ organizationId: id }).sort({ createdAt: -1 }),
    ]);

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const formattedMembers = members.map((m) => ({
      id: m._id.toString(),
      organizationId: m.organizationId.toString(),
      userId: m.userId?._id?.toString() || m.userId?.toString(),
      role: m.role,
      user: m.userId
        ? {
            id: m.userId._id.toString(),
            name: m.userId.name,
            email: m.userId.email,
            avatar: m.userId.avatar,
          }
        : null,
      createdAt: m.createdAt,
    }));

    return res.json({
      id: organization._id.toString(),
      name: organization.name,
      slug: organization.slug,
      currentUserRole: member.role,
      members: formattedMembers,
      projects: projects.map((p) => p.toJSON()),
    });
  } catch (error) {
    console.error('Get organization by id error:', error);
    return res.status(500).json({ error: 'Failed to fetch organization details.' });
  }
};

export const addMember = async (req, res) => {
  const { id } = req.params;
  const { email, userId: targetUserId, role = 'MEMBER' } = req.body;
  const currentUserId = req.user.id;

  try {
    const currentMembership = await OrganizationMember.findOne({
      organizationId: id,
      userId: currentUserId,
    });

    if (!currentMembership || (currentMembership.role !== 'OWNER' && currentMembership.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Permission denied. Only ADMIN or OWNER can add members.' });
    }

    if (role === 'OWNER' && currentMembership.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only an OWNER can assign OWNER role.' });
    }

    let userToAdd;
    if (targetUserId) {
      userToAdd = await User.findById(targetUserId);
    } else if (email) {
      userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!userToAdd) {
      return res.status(404).json({ error: 'User to add was not found.' });
    }

    const existing = await OrganizationMember.findOne({
      organizationId: id,
      userId: userToAdd._id,
    });

    if (existing) {
      return res.status(400).json({ error: 'User is already a member of this organization.' });
    }

    const membership = await OrganizationMember.create({
      organizationId: id,
      userId: userToAdd._id,
      role,
    });

    const org = await Organization.findById(id);

    await createAuditLog({
      userId: currentUserId,
      organizationId: id,
      action: 'MEMBER_ADD',
      entity: 'Member',
      entityId: membership.id,
      newValue: { userId: userToAdd.id, email: userToAdd.email, role },
    });

    await createNotification({
      userId: userToAdd.id,
      organizationId: id,
      title: 'Added to Organization',
      message: `You were added to organization "${org?.name || 'Workspace'}" with role ${role}.`,
      type: 'ORG_ADDED',
      link: `/organizations/${id}`,
    });

    return res.status(201).json(membership.toJSON());
  } catch (error) {
    console.error('Add member error:', error);
    return res.status(500).json({ error: 'Failed to add member to organization.' });
  }
};

export const removeMember = async (req, res) => {
  const { id, userId: targetUserId } = req.params;
  const currentUserId = req.user.id;

  try {
    const currentMembership = await OrganizationMember.findOne({
      organizationId: id,
      userId: currentUserId,
    });

    if (!currentMembership || (currentMembership.role !== 'OWNER' && currentMembership.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Permission denied. Only ADMIN or OWNER can remove members.' });
    }

    const targetMembership = await OrganizationMember.findOne({
      organizationId: id,
      userId: targetUserId,
    }).populate('userId', 'email');

    if (!targetMembership) {
      return res.status(404).json({ error: 'Member not found in this organization.' });
    }

    if (currentMembership.role === 'ADMIN' && (targetMembership.role === 'OWNER' || targetMembership.role === 'ADMIN')) {
      return res.status(403).json({ error: 'Admins cannot remove Owners or other Admins.' });
    }

    await OrganizationMember.deleteOne({
      organizationId: id,
      userId: targetUserId,
    });

    await createAuditLog({
      userId: currentUserId,
      organizationId: id,
      action: 'MEMBER_REMOVE',
      entity: 'Member',
      entityId: targetUserId,
      oldValue: { email: targetMembership.userId?.email, role: targetMembership.role },
    });

    return res.json({ message: 'Member removed successfully.' });
  } catch (error) {
    console.error('Remove member error:', error);
    return res.status(500).json({ error: 'Failed to remove member.' });
  }
};
