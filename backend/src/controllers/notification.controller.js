import { Notification } from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  const currentUserId = req.user.id;
  const { unreadOnly, limit = '30', page = '1' } = req.query;

  try {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const query = { userId: currentUserId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: currentUserId, isRead: false }),
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    return res.json({
      data: notifications.map((n) => n.toJSON()),
      unreadCount,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
};

export const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;

  try {
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    if (notification.userId.toString() !== currentUserId) {
      return res.status(403).json({ error: 'Access forbidden. This notification belongs to another user.' });
    }

    notification.isRead = true;
    await notification.save();

    return res.json(notification.toJSON());
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  const currentUserId = req.user.id;

  try {
    await Notification.updateMany({ userId: currentUserId, isRead: false }, { isRead: true });

    return res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
};
