const { prisma } = require('./src/config/db');
async function main() {
  console.log('Starting seed...');
  const teacher = await prisma.erp_users.findFirst({ where: { name: { contains: 'Imran' } } });
  if (!teacher) throw new Error('Teacher not found');
  
  const course = await prisma.courses.findFirst({ where: { subject_code: 'UNI-CS101' } });
  if (!course) throw new Error('Course UNI-CS101 not found');
  
  const session = await prisma.activeSessions.findFirst({ where: { title: { contains: 'FA23' } } });
  if (!session) throw new Error('Active Session FA23 not found');
  
  let section = await prisma.sections.findFirst({ where: { name: 'Section A' } });
  if (!section) {
    section = await prisma.sections.create({ data: { name: 'Section A', status: 1, created_by: 1 } });
  }
  
  let activeSessionSection = await prisma.activeSessionSections.findFirst({ where: { active_session_id: session.id, section_id: section.id } });
  if (!activeSessionSection) {
    activeSessionSection = await prisma.activeSessionSections.create({ data: { active_session_id: session.id, section_id: section.id, created_at: new Date() } });
  }
  
  let timeTable = await prisma.classTimeTables.findFirst({ where: { teacher_id: teacher.employee_id || teacher.id, subject_id: course.id, active_session_section_id: activeSessionSection.id } });
  if (!timeTable) {
    timeTable = await prisma.classTimeTables.create({ data: { teacher_id: teacher.employee_id || teacher.id, subject_id: course.id, active_session_section_id: activeSessionSection.id, time_table_id: 1, day: 'Monday' } });
  }
  
  const studentNames = ['Ali Khan', 'Fatima Zahra', 'Omar Farooq'];
  for (let i = 0; i < studentNames.length; i++) {
    const [firstName, lastName] = studentNames[i].split(' ');
    let student = await prisma.students.findFirst({ where: { reg_no: 'FA23-BCS-00' + (i + 1) } });
    if (!student) {
      student = await prisma.students.create({ data: { first_name: firstName, last_name: lastName, reg_no: 'FA23-BCS-00' + (i + 1), gender: i === 1 ? 2 : 1, status: 1, date_of_birth: new Date(), joining_date: new Date() } });
    }
    
    let enrollment = await prisma.activeSessionStudents.findFirst({ where: { student_id: student.id, active_session_section_id: activeSessionSection.id } });
    if (!enrollment) {
      enrollment = await prisma.activeSessionStudents.create({ data: { student_id: student.id, active_session_section_id: activeSessionSection.id, status: 1 } });
    }
  }
  
  console.log('Seeding completed successfully!');
  await prisma['$disconnect']();
}
main().catch(e => { console.error(e); process.exit(1); });
