import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { createAuditLog } from '../services/audit.service.js';

export const createProject = async (req, res) => {
  const { name, description, organizationId } = req.body;
  const orgId = organizationId || req.tenant?.organizationId;
  const userId = req.user.id;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required.' });
  }

  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID is required.' });
  }

  try {
    const membership = await OrganizationMember.findOne({
      organizationId: orgId,
      userId,
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Permission denied. Only ADMIN or OWNER can create projects.' });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim() || null,
      organizationId: orgId,
    });

    await createAuditLog({
      userId,
      organizationId: orgId,
      action: 'PROJECT_CREATE',
      entity: 'Project',
      entityId: project.id,
      newValue: { name: project.name, description: project.description },
    });

    return res.status(201).json(project.toJSON());
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ error: 'Failed to create project.' });
  }
};

export const getProjects = async (req, res) => {
  const orgId = req.query.organizationId || req.tenant?.organizationId;

  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID is required.' });
  }

  try {
    const projects = await Project.find({ organizationId: orgId }).sort({ createdAt: -1 });

    const formatted = await Promise.all(
      projects.map(async (p) => {
        const taskCount = await Task.countDocuments({ projectId: p._id });
        return {
          ...p.toJSON(),
          _count: { tasks: taskCount },
        };
      })
    );

    return res.json(formatted);
  } catch (error) {
    console.error('Get projects error:', error);
    return res.status(500).json({ error: 'Failed to fetch projects.' });
  }
};

export const getProjectById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const membership = await OrganizationMember.findOne({
      organizationId: project.organizationId,
      userId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access forbidden. You are not a member of this project organization.' });
    }

    const tasks = await Task.find({ projectId: id })
      .populate('assigneeId', 'id name email avatar')
      .populate('creatorId', 'id name email avatar')
      .sort({ order: 1, createdAt: -1 });

    const formattedTasks = tasks.map((t) => {
      const obj = t.toJSON();
      obj.assignee = t.assigneeId
        ? {
            id: t.assigneeId._id.toString(),
            name: t.assigneeId.name,
            email: t.assigneeId.email,
            avatar: t.assigneeId.avatar,
          }
        : null;
      obj.creator = t.creatorId
        ? {
            id: t.creatorId._id.toString(),
            name: t.creatorId.name,
            email: t.creatorId.email,
            avatar: t.creatorId.avatar,
          }
        : null;
      return obj;
    });

    return res.json({
      ...project.toJSON(),
      userRole: membership.role,
      tasks: formattedTasks,
    });
  } catch (error) {
    console.error('Get project by id error:', error);
    return res.status(500).json({ error: 'Failed to fetch project.' });
  }
};
