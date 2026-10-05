import { Notification } from '../models/Notification.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { sendRealtimeNotification } from '../socket.js';

export const createNotification = async (params) => {
  try {
    const notification = await Notification.create({
      userId: params.userId,
      organizationId: params.organizationId || null,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link,
    });

    const jsonNotif = notification.toJSON();
    sendRealtimeNotification(params.userId, jsonNotif);
    return jsonNotif;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

export const checkMentionsAndNotify = async (
  content,
  organizationId,
  authorId,
  taskId,
  taskTitle
) => {
  try {
    const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
    const matches = content.match(mentionRegex);

    if (!matches || matches.length === 0) return;

    const members = await OrganizationMember.find({ organizationId }).populate('userId');
    const mentionedUserIds = new Set();

    for (const match of matches) {
      const handle = match.substring(1).toLowerCase();
      const matchedMember = members.find((m) => {
        const u = m.userId;
        if (!u || u._id.toString() === authorId) return false;
        return (
          u.name.toLowerCase().replace(/\s+/g, '') === handle ||
          u.name.toLowerCase().includes(handle) ||
          u.email.toLowerCase().startsWith(handle)
        );
      });

      if (matchedMember) {
        mentionedUserIds.add(matchedMember.userId._id.toString());
      }
    }

    for (const userId of mentionedUserIds) {
      await createNotification({
        userId,
        organizationId,
        title: 'You were mentioned in a comment',
        message: `You were mentioned in a comment on task "${taskTitle}".`,
        type: 'MENTION',
        link: `/tasks/${taskId}`,
      });
    }
  } catch (error) {
    console.error('Failed to check mentions and notify:', error);
  }
};
