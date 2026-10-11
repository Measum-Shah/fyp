import { prisma } from "../../../config/db";

export type CalendarEventType =
  | "National Holiday"
  | "Academic Event"
  | "Exam Period"
  | "Semester Break"
  | "Other";

export type CalendarEventColor =
  | "green"
  | "blue"
  | "red"
  | "orange"
  | "purple"
  | "yellow";

export interface CalendarEventInput {
  title: string;
  start: Date;
  end: Date;
  type?: CalendarEventType;
  color?: CalendarEventColor;
  branch_id?: number | null;
  created_by?: number | null;
}

/** Unified shape returned to the frontend for both table sources */
export interface CalendarEvent {
  id: number;
  source: "calendar" | "holiday";
  title: string;
  start: Date;
  end: Date;
  type: string;
  color: string;
  branch_id: number | null;
  created_by: number | null;
  created_at: Date;
}

export class CalendarService {
  /** Return all events from annual_calendars merged with erp_holidays */
  static async list(branchId?: number): Promise<CalendarEvent[]> {
    const [calendarRows, holidayRows] = await Promise.all([
      prisma.annualCalendars.findMany({
        where: branchId ? { branch_id: branchId } : undefined,
        orderBy: { start: "asc" },
      }),
      prisma.erpHolidays.findMany({
        where: branchId ? { branch_id: branchId } : undefined,
        orderBy: { start_date: "asc" },
      }),
    ]);

    const calendarEvents: CalendarEvent[] = calendarRows.map((row) => ({
      id: row.id,
      source: "calendar" as const,
      title: row.title,
      start: row.start ?? new Date(),
      end: row.end ?? row.start ?? new Date(),
      type: row.type ?? "National Holiday",
      color: row.color ?? "green",
      branch_id: row.branch_id ?? null,
      created_by: row.created_by ?? null,
      created_at: row.created_at,
    }));

    const holidayEvents: CalendarEvent[] = holidayRows.map((row) => ({
      id: row.id,
      source: "holiday" as const,
      title: row.holiday_name,
      start: row.start_date ?? new Date(),
      end: row.end_date ?? row.start_date ?? new Date(),
      type: "National Holiday",
      color: "green",
      branch_id: row.branch_id ?? null,
      created_by: row.created_by ?? null,
      created_at: row.created_at,
    }));

    return [...calendarEvents, ...holidayEvents].sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );
  }

  /** Create a new event in annual_calendars */
  static async create(data: CalendarEventInput) {
    return prisma.annualCalendars.create({
      data: {
        title: data.title,
        start: data.start,
        end: data.end,
        type: data.type ?? "National Holiday",
        color: data.color ?? "green",
        branch_id: data.branch_id ?? null,
        created_by: data.created_by ?? null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /** Update an existing annual_calendar event */
  static async update(id: number, data: Partial<CalendarEventInput>) {
    const existing = await prisma.annualCalendars.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Calendar event not found.");

    return prisma.annualCalendars.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.start !== undefined && { start: data.start }),
        ...(data.end !== undefined && { end: data.end }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.branch_id !== undefined && { branch_id: data.branch_id }),
        updated_at: new Date(),
      },
    });
  }

  /** Delete a calendar event (only annual_calendars rows can be deleted) */
  static async remove(id: number) {
    const existing = await prisma.annualCalendars.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new Error("Calendar event not found.");
    return prisma.annualCalendars.delete({ where: { id } });
  }
}
