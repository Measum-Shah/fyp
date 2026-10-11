import { prisma } from "../../../config/db";

export class NotificationService {
  /**
   * Fetch notifications for a specific user (receiver)
   */
  static async getNotificationsForUser(userId: number, limit = 20) {
    const notifications = await prisma.notifications.findMany({
      where: { rid: userId },
      orderBy: { created_at: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notifications.count({
      where: { rid: userId, status: "unread" },
    });

    return { notifications, unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(id: number, userId: number) {
    const notification = await prisma.notifications.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.rid !== userId) {
      throw new Error("Unauthorized to update this notification");
    }

    return await prisma.notifications.update({
      where: { id },
      data: { status: "read", updated_at: new Date() },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: number) {
    const result = await prisma.notifications.updateMany({
      where: { rid: userId, status: "unread" },
      data: { status: "read", updated_at: new Date() },
    });
    return result;
  }
}
