import { prisma } from "../../../../config/db";

export class TeacherCommunicationService {
  static async getNotices(staffId: number) {
    // For simplicity, returning all active notices.
    // In a real scenario, you'd filter by board/program related to the teacher's courses
    const notices = await (prisma as any).notices.findMany({
      where: { status: 1 },
      orderBy: { created_at: 'desc' }
    });
    return notices;
  }

  static async createNotice(staffId: number, data: any) {
    const notice = await (prisma as any).notices.create({
      data: {
        title: data.title,
        message: data.body,
        branch_id: 1, // Defaulting to 1 if not provided
        board_id: 1,  // Defaulting to 1 if not provided
        created_by: staffId,
        created_at: new Date()
      }
    });
    return notice;
  }

  static async sendParentMessage(staffId: number, data: { email: string, message: string }) {
    // Mocking email sending / storing notification
    // If there is an email field on parent, we could find the parent and store a notification.
    const notification = await (prisma as any).notifications.create({
      data: {
        sid: staffId,
        rid: 0, // Receiver ID, 0 for unknown if we just use email
        title: "Message from Teacher",
        reason: data.message,
        justification: `Sent to: ${data.email}`,
        type: "ParentMessage",
        status: "Sent",
        created_at: new Date()
      }
    });
    return notification;
  }
}
