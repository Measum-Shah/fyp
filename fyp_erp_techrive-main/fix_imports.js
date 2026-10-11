const fs = require('fs');
const path = require('path');

// Helper to get all files in a directory
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js'));
}

const frontendDir = path.join(__dirname, 'frontend/src');
const backendDir = path.join(__dirname, 'backend/src');

// 1. Fix global references in frontend
const allFrontendFiles = getAllFiles(frontendDir);
allFrontendFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.includes('modules/TeacherPortal')) {
    content = content.replace(/modules\/TeacherPortal/g, 'modules/AcademicModule/TeacherPortal');
    changed = true;
  }
  if (content.includes('modules/ParentPortal')) {
    content = content.replace(/modules\/ParentPortal/g, 'modules/AcademicModule/ParentPortal');
    changed = true;
  }
  
  if (changed) fs.writeFileSync(file, content, 'utf8');
});

// 2. Fix relative imports inside the moved frontend folders
const teacherPortalFiles = getAllFiles(path.join(frontendDir, 'modules/AcademicModule/TeacherPortal'));
const parentPortalFiles = getAllFiles(path.join(frontendDir, 'modules/AcademicModule/ParentPortal'));
const movedFrontendFiles = [...teacherPortalFiles, ...parentPortalFiles];

movedFrontendFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // A crude but effective regex to add one level of depth to relative imports going out of the module.
  // Example: import X from "../../components/..." -> import X from "../../../components/..."
  // It specifically looks for imports that step out at least once.
  const importRegex = /(from\s+['"]|import\s+['"])(\.\.\/)/g;
  
  // Replace ../ with ../../
  if (importRegex.test(content)) {
    content = content.replace(importRegex, '$1../$2');
    changed = true;
  }
  
  if (changed) fs.writeFileSync(file, content, 'utf8');
});

// 3. Fix global references in backend
const allBackendFiles = getAllFiles(backendDir);
allBackendFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.includes('modules/ParentModule')) {
    content = content.replace(/modules\/ParentModule/g, 'modules/AcademicModule/ParentModule');
    changed = true;
  }
  
  if (changed) fs.writeFileSync(file, content, 'utf8');
});

// 4. Fix relative imports inside the moved backend folder
const parentModuleFiles = getAllFiles(path.join(backendDir, 'modules/AcademicModule/ParentModule'));
parentModuleFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  const importRegex = /(from\s+['"]|import\s+['"])(\.\.\/)/g;
  if (importRegex.test(content)) {
    content = content.replace(importRegex, '$1../$2');
    changed = true;
  }
  
  if (changed) fs.writeFileSync(file, content, 'utf8');
});

console.log('Imports fixed!');
