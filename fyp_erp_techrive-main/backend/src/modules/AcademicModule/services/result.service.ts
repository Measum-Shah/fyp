import { prisma } from "../../../config/db";

export class ResultService {
  /**
   * Generates results (GPA/CGPA) for a student in a specific term.
   */
  static async generateStudentResult(student_id: number, term_id: number, session_id: number) {
    // 1. Fetch ExamSchedules for the term & session
    const schedules = await prisma.examSchedules.findMany({
      where: { term_id, session_id },
    });

    if (!schedules.length) {
      throw new Error("No exam schedules found for this term and session.");
    }

    const scheduleIds = schedules.map(s => s.id);

    // 2. Fetch ExamMarkLedgers for the student
    const ledgers = await prisma.examMarkLedgers.findMany({
      where: {
        students_id: student_id,
        exam_schedule_id: { in: scheduleIds },
      }
    });

    if (!ledgers.length) {
      throw new Error("No marks found for this student in the selected term.");
    }

    // 3. Fetch courses to get credit hours
    const subjectIds = schedules.map(s => s.subjects_id).filter(id => id !== null) as number[];
    const courses = await prisma.courses.findMany({
      where: { id: { in: subjectIds } }
    });

    // 4. Fetch Grading Scales
    const gradingTypesIds = schedules.map(s => s.grading_types_id).filter(id => id !== null) as number[];
    const gradingScales = await prisma.gradingScales.findMany({
      where: { gradingType_id: { in: gradingTypesIds } }
    });

    let totalPoints = 0;
    let totalCredits = 0;
    
    // Also save to AccumulativeReport
    const student = await prisma.students.findUnique({ where: { id: student_id }});
    if (!student) throw new Error("Student not found");

    const report = await prisma.accumulativeReport.create({
      data: {
        student_id,
        session_id,
        board_id: student.board_id,
        program_id: student.program_id,
        class_id: student.class_id,
        status: 1
      }
    });

    for (const ledger of ledgers) {
      const schedule = schedules.find(s => s.id === ledger.exam_schedule_id);
      if (!schedule) continue;

      const course = courses.find(c => c.id === schedule.subjects_id);
      const creditHours = course?.credit_hours || 3; // default to 3 if not found

      const obtained = (ledger.obtain_mark_theory || 0) + (ledger.obtain_mark_practical || 0);
      const total = schedule.total_marks || 100;
      const percentage = Math.round((obtained / total) * 100);

      // Find grade
      const scales = gradingScales.filter(gs => gs.gradingType_id === schedule.grading_types_id);
      let grade = "F";
      let gradePoint = 0;

      for (const scale of scales) {
        if (percentage >= scale.percentage_from && percentage <= scale.percentage_to) {
          grade = scale.name;
          gradePoint = scale.grade_point || 0;
          break;
        }
      }

      totalPoints += gradePoint * creditHours;
      totalCredits += creditHours;

      // Save report details
      await prisma.accumulativeReportDetails.create({
        data: {
          accumulative_report_id: report.id,
          subject_id: course?.id,
          term1_marks: obtained,
          term1_total: total,
          term1_percentage: percentage,
          grade: grade,
          published: 1
        }
      });
    }

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;

    // We can save the GPA in StudentReports as well for easier fetching
    await prisma.studentReports.create({
      data: {
        student_id,
        term_id,
        session_id,
        grade: gpa, // storing GPA in grade field
        branch_id: student.branch_id,
        board_id: student.board_id,
        program_id: student.program_id,
        name: `Term ${term_id} Result`
      }
    });

    return { gpa: gpa.toFixed(2), totalCredits, totalPoints };
  }

  static async getStudentResult(student_id: number) {
    // Fetch from StudentReports
    const reports = await prisma.studentReports.findMany({
      where: { student_id },
      orderBy: { term_id: 'asc' }
    });

    let totalGpaSum = 0;
    
    reports.forEach(r => {
      totalGpaSum += r.grade || 0;
    });

    const cgpa = reports.length > 0 ? (totalGpaSum / reports.length) : 0;

    return {
      termResults: reports,
      cgpa: cgpa.toFixed(2)
    };
  }

  static async generateBatchResults(program_id: number, term_id: number, session_id: number) {
    const students = await prisma.students.findMany({
      where: { program_id, term_id, session_id }
    });

    const results = [];
    for (const student of students) {
      try {
        const result = await this.generateStudentResult(student.id, term_id, session_id);
        results.push({ student_id: student.id, name: student.mt_email, success: true, gpa: result.gpa });
      } catch (err: any) {
        results.push({ student_id: student.id, name: student.mt_email, success: false, message: err.message });
      }
    }
    return results;
  }
}
