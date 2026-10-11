import { prisma } from "../../../../config/db";

export class GradebookService {
  
  // 1. Get Categories for a Course & Section
  static async getCategories(courseId: number, sectionId: number) {
    const categories = await prisma.$queryRawUnsafe(`
      SELECT * FROM gradebook_categories 
      WHERE course_id = $1 AND active_session_section_id = $2
      ORDER BY created_at ASC
    `, courseId, sectionId);
    return categories;
  }

  // 2. Save/Update Category
  static async saveCategory(data: any, teacherId: number) {
    if (data.id) {
      // Update
      const res = await prisma.$queryRawUnsafe(`
        UPDATE gradebook_categories 
        SET name = $1, weight = $2, total_marks = $3
        WHERE id = $4
        RETURNING *
      `, data.name, data.weight, data.total_marks, data.id);
      return (res as any)[0];
    } else {
      // Create
      const res = await prisma.$queryRawUnsafe(`
        INSERT INTO gradebook_categories (active_session_section_id, course_id, teacher_id, name, weight, total_marks)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, data.active_session_section_id, data.course_id, teacherId, data.name, data.weight, data.total_marks);
      return (res as any)[0];
    }
  }

  // 3. Delete Category
  static async deleteCategory(categoryId: number) {
    await prisma.$queryRawUnsafe(`DELETE FROM gradebook_categories WHERE id = $1`, categoryId);
    return { success: true };
  }

  // 4. Publish Gradebook (Locks edits and makes visible to students)
  static async publishGradebook(courseId: number, sectionId: number, isPublished: boolean) {
    await prisma.$queryRawUnsafe(`
      UPDATE gradebook_categories 
      SET is_published = $1 
      WHERE course_id = $2 AND active_session_section_id = $3
    `, isPublished, courseId, sectionId);
    return { success: true };
  }

  // 5. Get Students and their Marks for a Category
  static async getMarks(categoryId: number, sectionId: number) {
    // Get all students in the section
    const sessionStudents = await prisma.$queryRawUnsafe<any[]>(`
      SELECT ass.student_id, s.first_name, s.last_name, s.reg_no
      FROM active_session_students ass
      JOIN students s ON s.id = ass.student_id
      WHERE ass.active_session_section_id = $1
    `, sectionId);

    // Get existing marks for the category
    const marks = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM gradebook_marks WHERE gradebook_category_id = $1
    `, categoryId);

    // Merge
    return sessionStudents.map(st => {
      const mark = marks.find(m => m.student_id === st.student_id);
      return {
        student_id: st.student_id,
        student_name: `${st.first_name || ''} ${st.last_name || ''}`.trim(),
        reg_no: st.reg_no,
        obtained_marks: mark ? mark.obtained_marks : '',
        is_absent: mark ? mark.is_absent : false
      };
    });
  }

  // 6. Save Marks
  static async saveMarks(categoryId: number, marksData: any[]) {
    for (const m of marksData) {
      if (m.obtained_marks === '' || m.obtained_marks === null) continue;

      const existing = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id FROM gradebook_marks 
        WHERE gradebook_category_id = $1 AND student_id = $2
      `, categoryId, m.student_id);

      if (existing.length > 0) {
        await prisma.$queryRawUnsafe(`
          UPDATE gradebook_marks 
          SET obtained_marks = $1, is_absent = $2
          WHERE id = $3
        `, m.obtained_marks, m.is_absent, existing[0].id);
      } else {
        await prisma.$queryRawUnsafe(`
          INSERT INTO gradebook_marks (gradebook_category_id, student_id, obtained_marks, is_absent)
          VALUES ($1, $2, $3, $4)
        `, categoryId, m.student_id, m.obtained_marks, m.is_absent);
      }
    }
    return { success: true };
  }

  // 7. Get Summary & Computed Grades
  static async getSummary(courseId: number, sectionId: number) {
    const categories = await this.getCategories(courseId, sectionId) as any[];
    if (!categories.length) return { students: [], categories: [] };

    // Get all students in the section
    const sessionStudents = await prisma.$queryRawUnsafe<any[]>(`
      SELECT ass.student_id, s.first_name, s.last_name, s.reg_no
      FROM active_session_students ass
      JOIN students s ON s.id = ass.student_id
      WHERE ass.active_session_section_id = $1
    `, sectionId);

    // Get all marks for all categories
    const catIds = categories.map(c => c.id);
    const allMarks = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM gradebook_marks 
      WHERE gradebook_category_id IN (${catIds.join(',') || '0'})
    `);

    // Get Grade Scales
    const gradeScales = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM grade_scales ORDER BY min_score DESC
    `);

    const students = sessionStudents.map(st => {
      let weightedTotal = 0;
      const categoryMarks: any = {};

      categories.forEach(cat => {
        const m = allMarks.find(mark => mark.student_id === st.student_id && mark.gradebook_category_id === cat.id);
        const obtained = m ? Number(m.obtained_marks) : 0;
        const total = Number(cat.total_marks) || 1;
        const weight = Number(cat.weight) || 0;
        
        const catWeightedScore = (obtained / total) * weight;
        categoryMarks[cat.id] = {
          obtained: m ? obtained : null,
          weighted_score: catWeightedScore
        };
        weightedTotal += catWeightedScore;
      });

      // Find Grade
      const grade = gradeScales.find(g => weightedTotal >= Number(g.min_score) && weightedTotal <= Number(g.max_score));

      return {
        student_id: st.student_id,
        student_name: `${st.first_name || ''} ${st.last_name || ''}`.trim(),
        reg_no: st.reg_no,
        categoryMarks,
        weightedTotal: weightedTotal.toFixed(2),
        grade_letter: grade ? grade.grade_letter : 'F',
        gpa: grade ? grade.gpa : 0
      };
    });

    return { students, categories };
  }
}
