import { prisma } from './config/db';

async function main() {
  const currs = await prisma.curriculum.findMany();
  console.log('Curriculums:', JSON.stringify(currs, null, 2));
  
  // Let's fix them up based on their title and what we know
  for (const c of currs) {
    let updates: any = {};
    if (c.title === 'BSCS University Curriculum 2026') {
      const p = await prisma.programs.findFirst({ where: { name: { contains: 'Computer Science' } } });
      const d = await prisma.departments.findFirst({ where: { name: { contains: 'Computer Science' } } });
      updates = { program_id: p?.id, department_id: d?.id, academic_year: '2026-2027', total_semesters: 8, total_credits: 130 };
    } else if (c.title === 'BSENG Curriculum 2026') {
      const p = await prisma.programs.findFirst({ where: { name: { contains: 'Engineering' } } });
      const d = await prisma.departments.findFirst({ where: { name: { contains: 'Engineering' } } });
      updates = { program_id: p?.id, department_id: d?.id, academic_year: '2026-2027', total_semesters: 8, total_credits: 136 };
    } else if (c.title === 'College F.Sc Board Curriculum') {
      updates = { academic_year: '2026-2027', total_semesters: 2, total_credits: 1100 };
    } else if (c.title === 'School Secondary Science Scheme') {
      updates = { academic_year: '2026-2027', total_semesters: 2, total_credits: 1100 };
    } else if (c.title === 'Institute Bootcamp Syllabus 2026') {
      updates = { academic_year: '2026-2027', total_semesters: 1, total_credits: 12 };
    }

    if (Object.keys(updates).length > 0 && updates.program_id !== undefined) {
      await prisma.curriculum.update({ where: { id: c.id }, data: updates });
      console.log(`Updated ${c.title} with`, updates);
    } else if (Object.keys(updates).length > 0 && c.institution_type !== 'university') {
      await prisma.curriculum.update({ where: { id: c.id }, data: updates });
      console.log(`Updated ${c.title} with`, updates);
    }
  }
}
main().finally(() => prisma.$disconnect());
