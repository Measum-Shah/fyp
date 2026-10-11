import { prisma } from "../../../../config/db";

export class TeacherEnrollmentService {

  // Step 1: Get all Universities/Companies
  static async getUniversities() {
    const activeBranches = await prisma.erpBranches.findMany({
      where: { status: 1, deleted_at: null },
      select: { company_id: true },
      distinct: ["company_id"],
    });

    return prisma.erpCompanies.findMany({
      where: { status: 1, deleted_at: null, id: { in: activeBranches.map(branch => branch.company_id) } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  // Step 2: Get campuses by university
  static async getCampuses(company_id: number) {
    return prisma.erpBranches.findMany({
      where: { company_id, status: 1 },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  // Step 3: Get active sessions by branch
  static async getActiveSessions(branch_id: number) {
    return prisma.activeSessions.findMany({
      where: { branch_id, status: "Active", deleted_at: null },
      select: { id: true, title: true, program_id: true, class_id: true },
      orderBy: { id: "desc" },
    });
  }

  // Lookup: Sessions (academic year)
  static async getSessions() {
    return prisma.sessions.findMany({
      where: { status: "Active", deleted_at: null },
      select: { id: true, title: true, start_year: true, end_year: true },
      orderBy: { id: "desc" },
    });
  }

  // Lookup: Programs available to a branch and global programs.
  static async getPrograms(branch_id: number, institution_type?: string) {
    const where: any = {
      status: 1,
      deleted_at: null,
      OR: [{ branch_id }, { branch_id: null }],
    };
    if (institution_type) {
      where.institution_type = institution_type;
    }
    return prisma.programs.findMany({
      where,
      select: { id: true, name: true, institution_type: true },
      orderBy: { name: "asc" },
    });
  }

  // Lookup: Classes
  static async getClasses() {
    return prisma.classes.findMany({
      where: { status: "Active", deleted_at: null },
      select: { id: true, name: true, class_code: true },
      orderBy: { name: "asc" },
    });
  }

  // University sessions use semesters; school sessions use classes.
  static async getSemesters(branch_id?: number) {
    const semesters = await prisma.semesters.findMany({
      where: {
        status: 1,
        ...(branch_id ? { OR: [{ branch_id }, { branch_id: null }] } : {}),
      },
      select: { id: true, semester: true },
      orderBy: { id: "asc" },
    });

    return semesters.length > 0
      ? semesters
      : Array.from({ length: 8 }, (_, index) => ({ id: index + 1, semester: `Semester ${index + 1}` }));
  }

  // Lookup: Boards and universities available in the system.
  static async getBoards(_branch_id: number, institution_type?: string) {
    const allBoards = await prisma.boards.findMany({
      where: { status: "Active", deleted_at: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    if (institution_type === "university") {
      const activeBranches = await prisma.erpBranches.findMany({
        where: { status: 1, deleted_at: null },
        select: { company_id: true },
        distinct: ["company_id"],
      });
      const universities = await prisma.erpCompanies.findMany({
        where: { status: 1, deleted_at: null, id: { in: activeBranches.map(branch => branch.company_id) } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });

      return [
        ...universities.map(university => ({ id: -university.id, name: university.name })),
        ...allBoards,
      ];
    }

    return allBoards;
  }

  // Lookup: All sections
  static async getAllSections() {
    return prisma.sections.findMany({
      where: { status: "Active", deleted_at: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  // Create a new Active Session
  static async createActiveSession(data: {
    title: string;
    branch_id: number;
    session_id: number;
    board_id: number;
    program_id: number;
    class_id: number;
  }) {
    const existing = await prisma.activeSessions.findFirst({
      where: { branch_id: data.branch_id, program_id: data.program_id, session_id: data.session_id, class_id: data.class_id, deleted_at: null },
    });
    if (existing) throw new Error("An active session with the same Program, Class and Year already exists for this campus.");

    return prisma.activeSessions.create({
      data: {
        title: data.title,
        branch_id: data.branch_id,
        session_id: data.session_id,
        board_id: data.board_id,
        program_id: data.program_id,
        class_id: data.class_id,
        status: "Active",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  // Add a section to an active session
  static async addSectionToSession(active_session_id: number, section_id: number) {
    const existing = await prisma.activeSessionSections.findFirst({ where: { active_session_id, section_id } });
    if (existing) throw new Error("This section is already added to this session.");
    return prisma.activeSessionSections.create({
      data: { active_session_id, section_id, created_at: new Date(), updated_at: new Date() },
    });
  }

  // Create a brand-new Section
  static async createSection(name: string) {
    const existing = await (prisma as any).sections.findFirst({ where: { name, deleted_at: null } });
    if (existing) throw new Error(`Section "${name}" already exists.`);
    return (prisma as any).sections.create({ data: { name, description: name, status: "Active", created_at: new Date() } });
  }

  // Step 4: Get sections by active session
  static async getSections(active_session_id: number) {
    const sections = await prisma.activeSessionSections.findMany({
      where: { active_session_id },
      select: { id: true, section_id: true },
    });

    const sectionIds = sections.map((s) => s.section_id);
    const sectionNames = await (prisma as any).sections.findMany({
      where: { id: { in: sectionIds } },
      select: { id: true, name: true },
    });

    return sections.map((s) => ({
      id: s.id, // active_session_section_id
      section_id: s.section_id,
      name: sectionNames.find((n: any) => n.id === s.section_id)?.name || `Section ${s.section_id}`,
    }));
  }

  // Step 5: Get teachers/lecturers filtered by designation
  // staff_type: "teacher" → school, "lecturer" → university
  static async getAvailableStaff(_branch_id: number, staff_type?: string) {
    const where: any = { deleted_at: null, status: "Active" };

    const allStaff = await prisma.staff.findMany({
      where,
      select: {
        id: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        reg_no: true,
        designation: true,
        staff_type: true,
      },
      orderBy: { first_name: "asc" },
      take: 300,
    });

    // Filter by designation keyword if staff_type is passed
    let filtered = allStaff;
    if (staff_type === "lecturer") {
      filtered = allStaff.filter((s) =>
        (s.designation || "").toLowerCase().includes("lecturer") ||
        (s.designation || "").toLowerCase().includes("professor") ||
        (s.staff_type || "").toLowerCase() === "lecturer"
      );
    } else if (staff_type === "teacher") {
      filtered = allStaff.filter((s) =>
        (s.designation || "").toLowerCase().includes("teacher") ||
        (s.staff_type || "").toLowerCase() === "teacher"
      );
    }

    return filtered.map((s) => ({
      id: s.id,
      name: [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ").trim() || `Staff #${s.id}`,
      reg_no: s.reg_no,
      designation: s.designation,
    }));
  }

  // Step 6: Get courses by institution_type and active_session
  static async getCoursesBySession(active_session_id: number, institution_type: string) {
    const session = await prisma.activeSessions.findUnique({
      where: { id: active_session_id },
      select: { program_id: true, class_id: true },
    });

    const where: any = { institution_type };
    if (session?.program_id) where.program_id = session.program_id;
    if (session?.class_id) where.class_id = session.class_id;

    const courses = await prisma.courses.findMany({
      where,
      select: { id: true, name: true, subject_code: true, credit_hours: true },
      orderBy: { name: "asc" },
      take: 200,
    });

    // Fallback: if no courses found by program, get by institution_type only
    if (courses.length === 0) {
      return prisma.courses.findMany({
        where: { institution_type },
        select: { id: true, name: true, subject_code: true, credit_hours: true },
        orderBy: { name: "asc" },
        take: 200,
      });
    }

    return courses;
  }

  // Step 7: Assign teacher to section with courses
  static async assignTeacher(data: {
    active_session_section_id: number;
    staff_id: number;
    course_ids: number[];
    rate_per_lecture?: number;
  }) {
    const existing = await prisma.activeSessionTeachers.findFirst({
      where: {
        active_session_section_id: data.active_session_section_id,
        staff_id: data.staff_id,
      },
    });

    const courseIdsStr = data.course_ids.join(",");

    if (existing) {
      // Update course_ids if already assigned
      return prisma.activeSessionTeachers.update({
        where: { id: existing.id },
        data: {
          course_ids: courseIdsStr,
          rate_per_lecture: data.rate_per_lecture || existing.rate_per_lecture,
          updated_at: new Date(),
        },
      });
    }

    return prisma.activeSessionTeachers.create({
      data: {
        active_session_section_id: data.active_session_section_id,
        staff_id: data.staff_id,
        course_ids: courseIdsStr,
        rate_per_lecture: data.rate_per_lecture || 0,
        class_timetable_id: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  // Get list of already enrolled teachers for a section
  static async getEnrolledTeachers(active_session_section_id: number) {
    const records = await prisma.activeSessionTeachers.findMany({
      where: { active_session_section_id },
    });

    if (records.length === 0) return [];

    const staffIds = records.map((r) => r.staff_id);
    const staffList = await prisma.staff.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, first_name: true, last_name: true, reg_no: true, designation: true },
    });

    const allCourseIds = [...new Set(records.flatMap((r) => (r.course_ids || "").split(",").filter(Boolean).map(Number)))];
    const courses = allCourseIds.length > 0
      ? await prisma.courses.findMany({ where: { id: { in: allCourseIds } }, select: { id: true, name: true, subject_code: true } })
      : [];

    return records.map((r) => {
      const staff = staffList.find((s) => s.id === r.staff_id);
      const courseIds = (r.course_ids || "").split(",").filter(Boolean).map(Number);
      const assignedCourses = courses.filter((c) => courseIds.includes(c.id));
      return {
        id: r.id,
        staff_id: r.staff_id,
        name: staff ? `${staff.first_name} ${staff.last_name}`.trim() : `Staff #${r.staff_id}`,
        reg_no: staff?.reg_no,
        designation: staff?.designation,
        courses: assignedCourses,
      };
    });
  }

  // Remove teacher assignment
  static async removeTeacher(id: number) {
    return prisma.activeSessionTeachers.delete({ where: { id } });
  }
}
