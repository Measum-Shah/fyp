import { prisma } from '../../../../config/db';
import { getStudentByUser } from './studentPortal.helpers';

export const getEnrolledCourses = async (userId: number) => {
  const student = await getStudentByUser(userId);

  // Student's active courses are tied to active_session_students, or student_enrollments
  const enrollments = await prisma.studentEnrollments.findMany({
    where: { student_id: student.id }
  });

  // Get courses based on subject_id
  const subjectIds = enrollments.map(e => e.subject_id);
  
  const courses = await prisma.courses.findMany({
    where: { id: { in: subjectIds } }
  });

  return { enrollments, courses };
};

export const getExamResults = async (userId: number) => {
  const student = await getStudentByUser(userId);
  
  const results = await prisma.examMarkLedgers.findMany({
    where: { students_id: student.id }
  });
  
  return results;
};

export const getCGPA = async (userId: number) => {
  const student = await getStudentByUser(userId);
  
  // Just returning placeholder or basic calculation
  // Real calculation would depend on grades per course
  const results = await prisma.examMarkLedgers.findMany({
    where: { students_id: student.id }
  });

  let totalMarks = 0;
  results.forEach(r => {
    totalMarks += (r.obtain_mark_theory || 0) + (r.obtain_mark_practical || 0);
  });

  return {
    total_marks: totalMarks,
    results_count: results.length,
    cgpa_placeholder: 3.5 // Since actual grading scale depends on board config
  };
};

export const getGradebook = async (userId: number) => {
  const student = await getStudentByUser(userId);
  
  // Get all categories where published is true
  const marks = await prisma.$queryRawUnsafe<any[]>(`
    SELECT m.obtained_marks, c.name, c.weight, c.total_marks, c.course_id 
    FROM gradebook_marks m
    JOIN gradebook_categories c ON c.id = m.gradebook_category_id
    WHERE m.student_id = $1 AND c.is_published = true
  `, student.id);

  const courses = await prisma.courses.findMany({
    where: { id: { in: [...new Set(marks.map(m => m.course_id))] } }
  });

  let gradeScales: any[] = [];
  try {
    gradeScales = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM grade_scales ORDER BY min_score DESC
    `);
  } catch (err) {
    console.warn("grade_scales table not found, using empty scales");
  }

  const gradebook = courses.map(course => {
    const courseMarks = marks.filter(m => m.course_id === course.id);
    let weightedTotal = 0;
    
    courseMarks.forEach(m => {
      const obtained = Number(m.obtained_marks) || 0;
      const total = Number(m.total_marks) || 1;
      const weight = Number(m.weight) || 0;
      weightedTotal += (obtained / total) * weight;
    });

    const grade = gradeScales.find(g => weightedTotal >= Number(g.min_score) && weightedTotal <= Number(g.max_score));

    return {
      course_id: course.id,
      course_name: course.name,
      categories: courseMarks,
      weighted_total: weightedTotal.toFixed(2),
      grade_letter: grade ? grade.grade_letter : 'F',
      gpa: grade ? grade.gpa : 0
    };
  });

  return gradebook;
};

/**
 * Fetches semester-wise grouped transcript for the student.
 * Groups AccumulativeReportDetails by term_id via StudentReports → AccumulativeReport.
 */
export const getTranscript = async (userId: number) => {
  const student = await getStudentByUser(userId);

  // Fetch all StudentReports (one record per term = one GPA row)
  const semReports = await prisma.studentReports.findMany({
    where: { student_id: student.id },
    orderBy: { term_id: 'asc' }
  });

  // Fetch grading scales for grade lookup
  const gradingScales = await prisma.gradingScales.findMany();

  // Fetch all AccumulativeReports for this student
  const accReports = await prisma.accumulativeReport.findMany({
    where: { student_id: student.id }
  });

  const accReportIds = accReports.map(r => r.id);

  // Fetch all detail rows
  const accDetails = await prisma.accumulativeReportDetails.findMany({
    where: { accumulative_report_id: { in: accReportIds } }
  });

  // Fetch courses for subject names
  const subjectIds = [...new Set(accDetails.map(d => d.subject_id).filter(Boolean))] as number[];
  const courses = await prisma.courses.findMany({
    where: { id: { in: subjectIds } }
  });

  // Fetch terms (semesters) for labels
  const termIds = [...new Set(semReports.map(r => r.term_id).filter(Boolean))] as number[];
  const terms = await prisma.terms.findMany({
    where: { id: { in: termIds } }
  });

  // Build semester blocks
  const semesters = semReports.map(sr => {
    const accReport = accReports.find(ar => ar.session_id === sr.session_id);
    const details = accReport
      ? accDetails.filter(d => d.accumulative_report_id === accReport.id)
      : [];

    const term = terms.find(t => t.id === sr.term_id);

    const courseRows = details.map(d => {
      const course = courses.find(c => c.id === d.subject_id);
      const percentage = d.term1_percentage || 0;

      // Find grade from GradingScales
      const scale = gradingScales.find(gs =>
        percentage >= gs.percentage_from && percentage <= gs.percentage_to
      );

      return {
        course_no: course?.subject_code || '—',
        course_title: course?.name || `Subject #${d.subject_id}`,
        credit_hours: course?.credit_hours || 3,
        marks: (d.term1_marks || 0) + (d.term2_marks || 0),
        total_marks: (d.term1_total || 0) + (d.term2_total || 0),
        letter_grade: d.grade || scale?.name || 'F',
        grade_point: scale?.grade_point || 0,
        percentage,
      };
    });

    return {
      term_id: sr.term_id,
      term_name: term?.name || `Semester ${sr.term_id}`,
      session_name: sr.name || '',
      gpa: sr.grade ? Number(sr.grade).toFixed(2) : '0.00',
      courses: courseRows,
    };
  });

  // Calculate overall CGPA
  let totalGpaSum = 0;
  semReports.forEach(r => { totalGpaSum += r.grade || 0; });
  const cgpa = semReports.length > 0 ? (totalGpaSum / semReports.length).toFixed(2) : '0.00';

  return {
    student_id: student.id,
    reg_no: student.reg_no,
    program_id: student.program_id,
    semesters,
    cgpa,
    total_semesters: semReports.length,
  };
};
