import { prisma } from "../../../config/db";

type TimetableInput = {
  active_session_section_id: number;
  subject_id: number;
  teacher_id: number;
  room_id?: number | null;
  time_table_slot_id: number;
  day: string;
  time_table_id: number;
  session_id?: number | null;
  branch_id?: number | null;
};

const assertAvailable = async (input: TimetableInput, id?: number) => {
  if (!input.day?.trim() || !input.time_table_slot_id) throw new Error("Day and time slot are required.");
  const conflict = await prisma.classTimeTables.findFirst({
    where: {
      ...(id ? { id: { not: id } } : {}),
      day: input.day.trim(),
      time_table_slot_id: input.time_table_slot_id,
      OR: [
        { teacher_id: input.teacher_id },
        ...(input.room_id ? [{ room_id: input.room_id }] : []),
        { active_session_section_id: input.active_session_section_id },
      ],
    },
    select: { teacher_id: true, room_id: true },
  });
  if (!conflict) return;
  if (conflict.teacher_id === input.teacher_id) throw new Error("Teacher clash: this teacher already has a class in this slot.");
  if (input.room_id && conflict.room_id === input.room_id) throw new Error("Room clash: this room is already booked in this slot.");
  throw new Error("Section clash: this section already has another class in this slot.");
};

export class TimetableAdminService {
  static async lookups() {
    const [courses, staff, rooms, slots, timetables, sessions, activeSessions, sectionLinks] = await Promise.all([
      prisma.courses.findMany({ where: { status: "Active" }, select: { id: true, name: true, subject_code: true }, orderBy: { name: "asc" } }),
      prisma.staff.findMany({ where: { status: "Active", deleted_at: null }, select: { id: true, first_name: true, middle_name: true, last_name: true }, orderBy: { first_name: "asc" } }),
      prisma.rooms.findMany({ where: { status: "Active", deleted_at: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.timeTableSlots.findMany({ where: { status: 1 }, select: { id: true, name: true, slot_from: true, slot_to: true }, orderBy: { id: "asc" } }),
      prisma.timeTables.findMany({ select: { id: true, title: true }, orderBy: { id: "desc" } }),
      prisma.sessions.findMany({ where: { status: "Active", deleted_at: null }, select: { id: true, title: true }, orderBy: { id: "desc" } }),
      prisma.activeSessions.findMany({ where: { status: { in: ["Active", "active", "1"] }, deleted_at: null }, select: { id: true, title: true }, orderBy: { id: "desc" } }),
      prisma.activeSessionSections.findMany({ select: { id: true, active_session_id: true, section_id: true }, orderBy: { id: "asc" } }),
    ]);
    const sectionIds = sectionLinks.map((link) => link.section_id);
    const sections = sectionIds.length ? await prisma.sections.findMany({ where: { id: { in: sectionIds } }, select: { id: true, name: true } }) : [];
    const sectionNames = new Map(sections.map((section) => [section.id, section.name]));
    return {
      courses,
      staff: staff.map((person) => ({ id: person.id, name: [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(" ") || `Staff #${person.id}` })),
      rooms,
      time_slots: slots.map(s => ({
        ...s,
        name: s.name + (s.slot_from && s.slot_to ? ` (${new Date(s.slot_from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(s.slot_to).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : "")
      })),
      timetables,
      sessions,
      active_sessions: activeSessions,
      active_session_sections: sectionLinks.map((link) => ({ ...link, name: sectionNames.get(link.section_id) || `Section #${link.section_id}` })),
    };
  }

  static async list() {
    return prisma.classTimeTables.findMany({ orderBy: [{ day: "asc" }, { time_table_slot_id: "asc" }, { id: "asc" }] });
  }

  static async create(input: TimetableInput) {
    await assertAvailable(input);
    return prisma.classTimeTables.create({ data: { ...input, day: input.day.trim(), room_id: input.room_id || null, created_at: new Date(), updated_at: new Date() } });
  }

  static async update(id: number, input: TimetableInput) {
    const existing = await prisma.classTimeTables.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new Error("Timetable entry not found.");
    await assertAvailable(input, id);
    return prisma.classTimeTables.update({ where: { id }, data: { ...input, day: input.day.trim(), room_id: input.room_id || null, updated_at: new Date() } });
  }

  static async remove(id: number) {
    const existing = await prisma.classTimeTables.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new Error("Timetable entry not found.");
    return prisma.classTimeTables.delete({ where: { id } });
  }

  /** Return only teachers enrolled in a given active session (across all its sections). */
  static async getTeachersBySession(activeSessionId: number) {
    const sectionLinks = await prisma.activeSessionSections.findMany({
      where: { active_session_id: activeSessionId },
      select: { id: true },
    });
    if (!sectionLinks.length) return [];

    const sectionIds = sectionLinks.map((s) => s.id);
    const assignments = await prisma.activeSessionTeachers.findMany({
      where: { active_session_section_id: { in: sectionIds } },
      select: { staff_id: true },
    });
    const uniqueStaffIds = [...new Set(assignments.map((a) => a.staff_id))];
    if (!uniqueStaffIds.length) return [];

    const staffRows = await prisma.staff.findMany({
      where: { id: { in: uniqueStaffIds } },
      select: { id: true, first_name: true, middle_name: true, last_name: true },
    });

    return staffRows.map((s) => ({
      id: s.id,
      name: [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ") || `Staff #${s.id}`,
    }));
  }

  /** Return only courses/subjects linked to a given active session via teacher enrollments. */
  static async getCoursesBySession(activeSessionId: number) {
    const sectionLinks = await prisma.activeSessionSections.findMany({
      where: { active_session_id: activeSessionId },
      select: { id: true },
    });
    if (!sectionLinks.length) return [];

    const sectionIds = sectionLinks.map((s) => s.id);
    const assignments = await prisma.activeSessionTeachers.findMany({
      where: { active_session_section_id: { in: sectionIds } },
      select: { course_ids: true },
    });

    const allCourseIds = [
      ...new Set(
        assignments.flatMap((a) =>
          (a.course_ids || "").split(",").filter(Boolean).map(Number)
        )
      ),
    ];
    if (!allCourseIds.length) return [];

    return prisma.courses.findMany({
      where: { id: { in: allCourseIds } },
      select: { id: true, name: true, subject_code: true },
      orderBy: { name: "asc" },
    });
  }

  /** Create a new time slot. */
  static async createTimeSlot(name: string, slotFrom: string, slotTo: string) {
    // Parse HH:mm to ISO 8601
    const pad = (t: string) => t.length === 5 ? `${t}:00.000Z` : t;
    const fromDate = new Date(`1970-01-01T${pad(slotFrom)}`);
    const toDate = new Date(`1970-01-01T${pad(slotTo)}`);

    return prisma.timeTableSlots.create({
      data: {
        name,
        slot_from: fromDate,
        slot_to: toDate,
        status: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /** Create a new time table. */
  static async createTimeTable(title: string) {
    return prisma.timeTables.create({
      data: {
        title,
        // @ts-ignore
        status: "Active",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }
}
