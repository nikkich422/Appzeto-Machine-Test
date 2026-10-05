import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { Comment } from '../models/Comment.js';
import { AuditLog } from '../models/AuditLog.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { createAuditLog } from '../services/audit.service.js';
import { createNotification, checkMentionsAndNotify } from '../services/notification.service.js';
import { broadcastProjectEvent } from '../socket.js';

export const createTask = async (req, res) => {
  const {
    title,
    description,
    status = 'TODO',
    priority = 'MEDIUM',
    dueDate,
    labels,
    projectId,
    organizationId,
    assigneeId,
  } = req.body;

  const currentUserId = req.user.id;

  if (!title || !projectId) {
    return res.status(400).json({ error: 'Title and projectId are required.' });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const membership = await OrganizationMember.findOne({
      organizationId: project.organizationId,
      userId: currentUserId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access forbidden. You are not a member of this project organization.' });
    }

    if (membership.role === 'VIEWER') {
      return res.status(403).json({ error: 'Permission denied. Viewers cannot create tasks.' });
    }

    const orgId = organizationId || project.organizationId.toString();

    const highestTask = await Task.findOne({ projectId, status })
      .sort({ order: -1 })
      .select('order');
    const order = (highestTask?.order ?? -1) + 1;

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || null,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      labels: labels || null,
      order,
      projectId,
      organizationId: orgId,
      creatorId: currentUserId,
      assigneeId: assigneeId || null,
    });

    const populated = await Task.findById(task._id)
      .populate('assigneeId', 'id name email avatar')
      .populate('creatorId', 'id name email avatar');

    const formattedTask = populated.toJSON();
    formattedTask.assignee = populated.assigneeId
      ? {
          id: populated.assigneeId._id.toString(),
          name: populated.assigneeId.name,
          email: populated.assigneeId.email,
          avatar: populated.assigneeId.avatar,
        }
      : null;
    formattedTask.creator = populated.creatorId
      ? {
          id: populated.creatorId._id.toString(),
          name: populated.creatorId.name,
          email: populated.creatorId.email,
          avatar: populated.creatorId.avatar,
        }
      : null;

    await createAuditLog({
      userId: currentUserId,
      organizationId: orgId,
      action: 'TASK_CREATE',
      entity: 'Task',
      entityId: task.id,
      newValue: { title: task.title, status: task.status, priority: task.priority },
    });

    if (assigneeId && assigneeId !== currentUserId) {
      await createNotification({
        userId: assigneeId,
        organizationId: orgId,
        title: 'New Task Assigned',
        message: `You were assigned task "${task.title}".`,
        type: 'TASK_ASSIGNED',
        link: `/tasks/${task.id}`,
      });
    }

    broadcastProjectEvent(projectId, 'task_created', formattedTask);

    return res.status(201).json(formattedTask);
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Failed to create task.' });
  }
};

export const getTasks = async (req, res) => {
  const currentUserId = req.user.id;
  const {
    organizationId,
    projectId,
    status,
    priority,
    assigneeId,
    labels,
    dueDateBefore,
    dueDateAfter,
    search,
    page = '1',
    limit = '20',
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

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = { organizationId };

    if (projectId) query.projectId = projectId;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assigneeId) query.assigneeId = assigneeId;

    if (dueDateBefore || dueDateAfter) {
      query.dueDate = {};
      if (dueDateBefore) query.dueDate.$lte = new Date(dueDateBefore);
      if (dueDateAfter) query.dueDate.$gte = new Date(dueDateAfter);
    }

    if (labels) {
      query.labels = { $regex: labels, $options: 'i' };
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const [total, tasks] = await Promise.all([
      Task.countDocuments(query),
      Task.find(query)
        .populate('assigneeId', 'id name email avatar')
        .populate('creatorId', 'id name email avatar')
        .populate('projectId', 'id name')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const formattedTasks = await Promise.all(
      tasks.map(async (t) => {
        const commentCount = await Comment.countDocuments({ taskId: t._id });
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
        obj.project = t.projectId
          ? {
              id: t.projectId._id.toString(),
              name: t.projectId.name,
            }
          : null;
        obj._count = { comments: commentCount, attachments: 0 };
        return obj;
      })
    );

    return res.json({
      data: formattedTasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
};

export const getTaskById = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;

  try {
    const task = await Task.findById(id)
      .populate('assigneeId', 'id name email avatar')
      .populate('creatorId', 'id name email avatar')
      .populate('projectId', 'id name');

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const membership = await OrganizationMember.findOne({
      organizationId: task.organizationId,
      userId: currentUserId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access forbidden. You are not a member of this organization.' });
    }

    const [comments, auditLogs] = await Promise.all([
      Comment.find({ taskId: id })
        .populate('userId', 'id name email avatar')
        .sort({ createdAt: 1 }),
      AuditLog.find({ entity: 'Task', entityId: id })
        .populate('userId', 'id name email avatar')
        .sort({ timestamp: -1 })
        .limit(20),
    ]);

    const formattedTask = task.toJSON();
    formattedTask.assignee = task.assigneeId
      ? {
          id: task.assigneeId._id.toString(),
          name: task.assigneeId.name,
          email: task.assigneeId.email,
          avatar: task.assigneeId.avatar,
        }
      : null;
    formattedTask.creator = task.creatorId
      ? {
          id: task.creatorId._id.toString(),
          name: task.creatorId.name,
          email: task.creatorId.email,
          avatar: task.creatorId.avatar,
        }
      : null;
    formattedTask.project = task.projectId
      ? {
          id: task.projectId._id.toString(),
          name: task.projectId.name,
        }
      : null;

    formattedTask.comments = comments.map((c) => ({
      id: c._id.toString(),
      content: c.content,
      createdAt: c.createdAt,
      user: c.userId
        ? {
            id: c.userId._id.toString(),
            name: c.userId.name,
            email: c.userId.email,
            avatar: c.userId.avatar,
          }
        : null,
    }));

    formattedTask.auditLogs = auditLogs.map((l) => ({
      id: l._id.toString(),
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      oldValue: l.oldValue,
      newValue: l.newValue,
      timestamp: l.timestamp,
      user: l.userId
        ? {
            id: l.userId._id.toString(),
            name: l.userId.name,
            email: l.userId.email,
          }
        : null,
    }));

    formattedTask.currentUserRole = membership.role;

    return res.json(formattedTask);
  } catch (error) {
    console.error('Get task by id error:', error);
    return res.status(500).json({ error: 'Failed to fetch task.' });
  }
};

export const updateTask = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const updates = req.body;

  try {
    const existing = await Task.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const membership = await OrganizationMember.findOne({
      organizationId: existing.organizationId,
      userId: currentUserId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access forbidden. You are not a member of this organization.' });
    }

    if (membership.role === 'VIEWER') {
      return res.status(403).json({ error: 'Permission denied. Viewers cannot edit tasks.' });
    }

    if (membership.role === 'MEMBER') {
      const isAssignee = existing.assigneeId?.toString() === currentUserId;
      const isCreator = existing.creatorId.toString() === currentUserId;
      if (!isAssignee && !isCreator) {
        return res.status(403).json({ error: 'Permission denied. Members can only edit tasks assigned to or created by them.' });
      }
    }

    const dataToUpdate = {};
    if (updates.title !== undefined) dataToUpdate.title = updates.title;
    if (updates.description !== undefined) dataToUpdate.description = updates.description;
    if (updates.status !== undefined) dataToUpdate.status = updates.status;
    if (updates.priority !== undefined) dataToUpdate.priority = updates.priority;
    if (updates.order !== undefined) dataToUpdate.order = updates.order;
    if (updates.dueDate !== undefined) dataToUpdate.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    if (updates.labels !== undefined) dataToUpdate.labels = updates.labels;
    if (updates.assigneeId !== undefined) dataToUpdate.assigneeId = updates.assigneeId || null;

    const updated = await Task.findByIdAndUpdate(id, dataToUpdate, { new: true })
      .populate('assigneeId', 'id name email avatar')
      .populate('creatorId', 'id name email avatar');

    const formattedTask = updated.toJSON();
    formattedTask.assignee = updated.assigneeId
      ? {
          id: updated.assigneeId._id.toString(),
          name: updated.assigneeId.name,
          email: updated.assigneeId.email,
          avatar: updated.assigneeId.avatar,
        }
      : null;
    formattedTask.creator = updated.creatorId
      ? {
          id: updated.creatorId._id.toString(),
          name: updated.creatorId.name,
          email: updated.creatorId.email,
          avatar: updated.creatorId.avatar,
        }
      : null;

    if (updates.status && updates.status !== existing.status) {
      await createAuditLog({
        userId: currentUserId,
        organizationId: existing.organizationId.toString(),
        action: 'STATUS_CHANGE',
        entity: 'Task',
        entityId: id,
        oldValue: { status: existing.status },
        newValue: { status: updates.status },
      });

      if (existing.assigneeId && existing.assigneeId.toString() !== currentUserId) {
        await createNotification({
          userId: existing.assigneeId.toString(),
          organizationId: existing.organizationId.toString(),
          title: 'Task Status Changed',
          message: `Task "${existing.title}" moved to ${updates.status}.`,
          type: 'STATUS_CHANGED',
          link: `/tasks/${id}`,
        });
      }
    }

    if (updates.assigneeId !== undefined && updates.assigneeId !== (existing.assigneeId?.toString() || null)) {
      await createAuditLog({
        userId: currentUserId,
        organizationId: existing.organizationId.toString(),
        action: 'ASSIGN_CHANGE',
        entity: 'Task',
        entityId: id,
        oldValue: { assigneeId: existing.assigneeId?.toString() || null },
        newValue: { assigneeId: updates.assigneeId },
      });

      if (updates.assigneeId && updates.assigneeId !== currentUserId) {
        await createNotification({
          userId: updates.assigneeId,
          organizationId: existing.organizationId.toString(),
          title: 'Task Assigned To You',
          message: `You were assigned task "${existing.title}".`,
          type: 'TASK_ASSIGNED',
          link: `/tasks/${id}`,
        });
      }
    }

    if (updates.priority && updates.priority !== existing.priority) {
      await createAuditLog({
        userId: currentUserId,
        organizationId: existing.organizationId.toString(),
        action: 'PRIORITY_CHANGE',
        entity: 'Task',
        entityId: id,
        oldValue: { priority: existing.priority },
        newValue: { priority: updates.priority },
      });
    }

    broadcastProjectEvent(existing.projectId.toString(), 'task_updated', formattedTask);

    return res.json(formattedTask);
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ error: 'Failed to update task.' });
  }
};

export const deleteTask = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;

  try {
    const existing = await Task.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const membership = await OrganizationMember.findOne({
      organizationId: existing.organizationId,
      userId: currentUserId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access forbidden. You are not a member of this organization.' });
    }

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permission denied. Only ADMIN or OWNER can delete tasks.' });
    }

    await Task.deleteOne({ _id: id });
    await Comment.deleteMany({ taskId: id });

    await createAuditLog({
      userId: currentUserId,
      organizationId: existing.organizationId.toString(),
      action: 'TASK_DELETE',
      entity: 'Task',
      entityId: id,
      oldValue: { title: existing.title, status: existing.status },
    });

    broadcastProjectEvent(existing.projectId.toString(), 'task_deleted', {
      id,
      projectId: existing.projectId.toString(),
    });

    return res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ error: 'Failed to delete task.' });
  }
};

export const addTaskComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const currentUserId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content is required.' });
  }

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const membership = await OrganizationMember.findOne({
      organizationId: task.organizationId,
      userId: currentUserId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access forbidden. You are not a member of this organization.' });
    }

    if (membership.role === 'VIEWER') {
      return res.status(403).json({ error: 'Permission denied. Viewers cannot comment.' });
    }

    const comment = await Comment.create({
      content: content.trim(),
      taskId: id,
      userId: currentUserId,
    });

    const populatedComment = await Comment.findById(comment._id).populate('userId', 'id name email avatar');

    const formattedComment = {
      id: populatedComment._id.toString(),
      content: populatedComment.content,
      createdAt: populatedComment.createdAt,
      user: {
        id: populatedComment.userId._id.toString(),
        name: populatedComment.userId.name,
        email: populatedComment.userId.email,
        avatar: populatedComment.userId.avatar,
      },
    };

    await checkMentionsAndNotify(
      content,
      task.organizationId.toString(),
      currentUserId,
      task.id,
      task.title
    );

    broadcastProjectEvent(task.projectId.toString(), 'comment_created', { taskId: id, comment: formattedComment });

    return res.status(201).json(formattedComment);
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({ error: 'Failed to add comment.' });
  }
};
