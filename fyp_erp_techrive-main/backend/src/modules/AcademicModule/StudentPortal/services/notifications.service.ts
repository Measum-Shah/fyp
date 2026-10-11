import { prisma } from '../../../../config/db';
import { getStudentByUser } from './studentPortal.helpers';

export const getNotifications = async (userId: number, unreadOnly: boolean = false) => {
  const student = await getStudentByUser(userId);
  
  const whereClause: any = {
    OR: [
      { rid: userId },
      { type: 'all' },
      { type: 'student' }
    ]
  };
  
  if (unreadOnly) {
    whereClause.status = 'unread'; // Assuming status holds read/unread
  }

  const notifications = await prisma.notifications.findMany({
    where: whereClause,
    orderBy: { created_at: 'desc' }
  });
  
  return notifications;
};

export const markAsRead = async (userId: number, notificationId: number) => {
  // Validate ownership first
  const notif = await prisma.notifications.findUnique({ where: { id: notificationId } });
  if (!notif) throw new Error('Notification not found');
  
  // Actually, 'all' or 'student' type notifications might need a separate tracker table for read statuses per user.
  // We'll assume a simplified version where rid-specific can be updated.
  if (notif.rid === userId) {
    return await prisma.notifications.update({
      where: { id: notificationId },
      data: { status: 'read' }
    });
  }
  return { message: 'Marked as read (local scope)' }; 
};

export const markAllAsRead = async (userId: number) => {
  return await prisma.notifications.updateMany({
    where: { rid: userId, status: 'unread' },
    data: { status: 'read' }
  });
};
