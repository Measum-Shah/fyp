import { prisma } from "../../../config/db";
import { postJournalEntry } from "../../accountsModule/services/posting.service";

const FineStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
  WAIVED: 'WAIVED'
} as const;
type FineStatus = (typeof FineStatus)[keyof typeof FineStatus];

export class FineService {
  async getCategories() {
    return prisma.fineCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  async getAllCategoriesAdmin() {
    return prisma.fineCategory.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async createCategory(data: { name: string; description?: string }) {
    return prisma.fineCategory.create({
      data
    });
  }

  async updateCategory(id: number, data: { name?: string; description?: string; isActive?: boolean }) {
    return prisma.fineCategory.update({
      where: { id },
      data
    });
  }

  async getFines(query: any) {
    const { studentId, categoryId, status, search } = query;
    const where: any = {};
    if (studentId) where.studentId = Number(studentId);
    if (categoryId) where.categoryId = Number(categoryId);
    if (status) where.status = status;
    
    // Manual search implementation
    const fines = await prisma.fine.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!fines.length) return [];

    const studentIds = Array.from(new Set(fines.map(f => f.studentId)));
    const students = await prisma.students.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, first_name: true, last_name: true, reg_no: true }
    });
    
    const studentMap = new Map(students.map(s => [s.id, s]));

    let result = fines.map(f => ({
      ...f,
      student: studentMap.get(f.studentId) || null
    }));

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(f => 
        f.referenceNumber.toLowerCase().includes(lowerSearch) ||
        (f.student && (`${f.student.first_name} ${f.student.last_name}`.toLowerCase().includes(lowerSearch) || 
                       (f.student.reg_no && f.student.reg_no.toLowerCase().includes(lowerSearch))))
      );
    }

    return result;
  }

  async getFineById(id: number) {
    const fine = await prisma.fine.findUnique({
      where: { id },
      include: {
        category: true,
        payments: true,
        history: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!fine) throw new Error("Fine not found");

    const student = await prisma.students.findUnique({
      where: { id: fine.studentId },
      select: { id: true, first_name: true, last_name: true, reg_no: true }
    });

    const issuedBy = fine.issuedById ? await prisma.user.findUnique({
      where: { id: fine.issuedById },
      select: { id: true, name: true, email: true }
    }) : null;

    return { ...fine, student, issuedBy };
  }

  async createFine(data: {
    studentId: number;
    categoryId: number;
    amount: number;
    reason: string;
    violationDate: Date;
    dueDate: Date;
    remarks?: string;
    issuedById: bigint;
  }) {
    const latestFine = await prisma.fine.findFirst({
      orderBy: { id: 'desc' }
    });
    const nextId = (latestFine?.id || 0) + 1;
    const year = new Date().getFullYear();
    const referenceNumber = `FINE-${year}-${String(nextId).padStart(5, '0')}`;

    const fine = await prisma.fine.create({
      data: {
        referenceNumber,
        studentId: data.studentId,
        categoryId: data.categoryId,
        amount: data.amount,
        remainingAmount: data.amount,
        reason: data.reason,
        violationDate: data.violationDate,
        dueDate: data.dueDate,
        remarks: data.remarks,
        issuedById: data.issuedById,
        status: FineStatus.PENDING
      }
    });

    await prisma.fineHistory.create({
      data: {
        fineId: fine.id,
        action: 'CREATED',
        details: `Fine created with amount ${data.amount}`,
        performedBy: data.issuedById
      }
    });

    // Notify student
    await this.notifyStudent(data.studentId, 'New Fine Issued', `A new fine (${referenceNumber}) has been issued. Amount: Rs. ${data.amount}.`);

    return fine;
  }

  async updateFineStatus(id: number, status: FineStatus, performedBy: bigint, details?: string) {
    const fine = await prisma.fine.findUnique({ where: { id } });
    if (!fine) throw new Error("Fine not found");

    const updated = await prisma.fine.update({
      where: { id },
      data: { status }
    });

    await prisma.fineHistory.create({
      data: {
        fineId: id,
        action: 'STATUS_CHANGED',
        details: `Status changed to ${status}. ${details || ''}`,
        performedBy
      }
    });
    
    await this.notifyStudent(fine.studentId, 'Fine Status Updated', `Your fine (${fine.referenceNumber}) status is now ${status}.`);

    return updated;
  }

  async recordPayment(fineId: number, data: { amount: number; paymentMethod?: string; reference?: string; recordedById: bigint }) {
    const fine = await prisma.fine.findUnique({ where: { id: fineId } });
    if (!fine) throw new Error("Fine not found");

    if (fine.remainingAmount < data.amount) {
      throw new Error("Payment amount exceeds remaining fine amount");
    }

    const newPaidAmount = fine.paidAmount + data.amount;
    const newRemainingAmount = fine.remainingAmount - data.amount;
    let newStatus = fine.status;
    if (newRemainingAmount === 0) {
      newStatus = FineStatus.PAID;
    } else if (newPaidAmount > 0) {
      newStatus = FineStatus.PARTIALLY_PAID;
    }

    const payment = await prisma.finePayment.create({
      data: {
        fineId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        recordedById: data.recordedById
      }
    });

    // GL Posting Trigger for Fine Payment
    try {
      const cashAccount =
        (await prisma.accAccount.findFirst({ where: { code: "1010" } })) ||
        (await prisma.accAccount.findFirst({ where: { type: "ASSET" } }));
      const fineRevenueAccount =
        (await prisma.accAccount.findFirst({ where: { code: "4020" } })) ||
        (await prisma.accAccount.findFirst({ where: { type: "REVENUE" } }));

      if (cashAccount && fineRevenueAccount && data.amount > 0) {
        await postJournalEntry({
          sourceModule: "ACADEMIC",
          sourceReferenceType: "FINE_PAYMENT",
          sourceReferenceId: payment.id,
          voucherType: "CRV",
          narration: `Academic Fine Collection (Ref #${fine.referenceNumber})`,
          lines: [
            { account_id: cashAccount.id, debit: data.amount, credit: 0, description: `Cash Receipt for Academic Fine` },
            { account_id: fineRevenueAccount.id, debit: 0, credit: data.amount, description: `Fine Income Revenue` },
          ],
          autoPost: true,
        });
      }
    } catch (glErr) {
      console.error("GL Posting Trigger Failed (Academic Fine):", glErr);
    }

    const updated = await prisma.fine.update({
      where: { id: fineId },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus
      }
    });

    await prisma.fineHistory.create({
      data: {
        fineId,
        action: 'PAYMENT_RECORDED',
        details: `Payment of ${data.amount} recorded. (${data.paymentMethod || 'Cash'})`,
        performedBy: data.recordedById
      }
    });
    
    await this.notifyStudent(fine.studentId, 'Fine Payment Recorded', `A payment of Rs. ${data.amount} has been recorded for your fine (${fine.referenceNumber}).`);

    return { payment, fine: updated };
  }

  private async notifyStudent(studentId: number, title: string, message: string) {
    const student = await prisma.students.findUnique({ where: { id: studentId } });
    if (student && student.user_id) {
      try {
        await prisma.notifications.create({
          data: {
            rid: student.user_id,
            sid: 1,
            title,
            reason: message,
            justification: 'System generated',
            status: 'Unread',
            type: 'Fine',
            created_at: new Date(),
            updated_at: new Date()
          }
        });
      } catch (e) {
        console.error("Failed to create notification", e);
      }
    }
  }
}

export const fineService = new FineService();
