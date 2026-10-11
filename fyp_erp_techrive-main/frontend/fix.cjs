const fs = require('fs');

const files = [
  'src/modules/AcademicModule/StudentPortal/pages/StudentFinesPage.tsx',
  'src/modules/AcademicModule/pages/FineManagementPage.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\\Bearer \\\\ /g, '\Bearer \\');
  fs.writeFileSync(file, content);
});
