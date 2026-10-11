export type InstitutionType = "university" | "college" | "school" | "institute";
export type UserRole = "admin" | "faculty" | "student";
export type CourseCategory = "Core" | "Elective" | "Optional" | "Lab" | "General" | "Thesis";
export type CourseStatus = "active" | "inactive";
export type MaterialType = "lecture_note" | "syllabus" | "slide" | "video" | "learning_material" | "external_link";

// Matches the actual `departments` DB table: id, name, description, institution_type
export interface Department {
  id: number;
  name: string;
  description?: string;
  institution_type?: string;
  // frontend-only display helpers (not in DB)
  code?: string;
  head_of_department?: string;
  email?: string;
  phone?: string;
  status?: string;
  programs_count?: number;
  created_at?: string;
}

// Matches the actual `programs` DB table: id, name, code, years, duration, status, institution_type, description
export interface Program {
  id: number;
  code?: string;
  name?: string;
  // frontend alias kept for backward compatibility
  title?: string;
  description?: string;
  years?: number;
  duration?: number;
  status?: number | string;
  institution_type?: string;
  // frontend-only display helpers
  department_id?: number;
  department_name?: string;
  degree_level?: string;
  duration_years?: number;
  total_credits?: number;
  created_at?: string;
}

// Matches the actual `majors` DB table: id, name, description, department_id, institution_type
export interface Major {
  id: number;
  name: string;
  description?: string;
  department_id?: number;
  department_name?: string;
  institution_type?: string;
  // frontend-only helpers
  code?: string;
  program_id?: number;
  program_name?: string;
  status?: string;
}

// Matches the actual `minors` DB table: id, name, description, department_id, institution_type
export interface Minor {
  id: number;
  name: string;
  description?: string;
  department_id?: number;
  department_name?: string;
  institution_type?: string;
  // frontend-only helpers
  code?: string;
  program_id?: number;
  program_name?: string;
  status?: string;
}

// Matches the actual `courses` DB table (with mapped aliases from backend)
export interface Course {
  id: number;
  code?: string;           // mapped from subject_code
  title?: string;          // mapped from name
  name?: string;
  subject_code?: string;
  description?: string;
  department_id?: number;
  department_name?: string;
  program_id?: number;
  program_name?: string;
  curriculum_version_id?: number;
  curriculum_version?: string;
  credit_hours?: number;
  lecture_hours?: number;
  lab_hours?: number;
  category?: CourseCategory;
  level_or_grade?: string;
  level?: string;
  semester_suggested?: number;  // mapped from semester
  semester?: number;
  semester_recommendation?: number;
  status?: CourseStatus | string;
  prerequisites_count?: number;
  corequisites_count?: number;
  // institution-specific fields
  class_id?: number;        // school: class
  college_group?: string;   // college: group (Pre-Medical, ICS, etc.)
  college_year?: string;    // college: First Year / Second Year
  marks?: number;           // school/college: marks instead of credit hours
  institution_type?: string;
  major_id?: number;
  minor_id?: number;
  type?: string;
  created_at?: string;
}

// Matches the actual `curriculum` DB table + frontend-enriched fields
export interface Curriculum {
  id: number;
  title: string;
  description?: string;
  status: "active" | "inactive" | "draft" | "archived";
  institution_type?: string;
  major_id?: number;
  syllabus_id?: number;
  term_id?: number;
  created_by?: number;
  // frontend-enriched (returned by backend service)
  code?: string;
  program_id?: number;
  program_name?: string;
  academic_year?: string;
  semester?: string;
  total_semesters?: number;
  total_semesters_or_grades?: number;
  total_credits?: number;
  total_courses?: number;
  version?: string;
  current_version?: string;
  department_id?: number;
  department_name?: string;
  minor_id?: number;
  created_at?: string;
}

export interface CurriculumItem {
  id: number;
  curriculum_id: number;
  course_id: number;
  course_code?: string;
  course_title?: string;
  credit_hours?: number;
  semester_or_grade: number;
  is_mandatory: boolean;
}

// Matches the actual `curriculum_versions` DB table
export interface CurriculumVersion {
  id: number;
  curriculum_id?: number;
  version_number: string;
  change_log?: string;
  effective_date?: string;
  status: "active" | "inactive" | "draft" | "archived";
  created_by?: string;
  created_by_name?: string;
  institution_type?: string;
  created_at?: string;
}

// Matches the actual `prerequisite` DB table
export interface Prerequisite {
  id: number;
  course_id: number;
  precourse_id?: number;
  prerequisite_course_id?: number;
  co_requisite_type?: string;
  course_code?: string;
  course_title?: string;
  precourse_code?: string;
  prerequisite_code?: string;
  precourse_title?: string;
  prerequisite_title?: string;
  min_grade?: string;
  created_at?: string;
}
export type CoursePrerequisite = Prerequisite;

export interface Corequisite {
  id: number;
  course_id: number;
  corequisite_course_id?: number;
  course_code?: string;
  course_title?: string;
  corequisite_code?: string;
  corequisite_title?: string;
  created_at?: string;
}
export type CourseCorequisite = Corequisite;

export interface PrerequisiteChainNode {
  course_id: number;
  code: string;
  title: string;
  prerequisites: PrerequisiteChainNode[];
}

// Matches the actual `lms_materials` DB table
export interface LMSMaterial {
  id: number;
  module_id?: number;
  course_id?: number;
  course_name?: string;
  title: string;
  type?: MaterialType;
  material_type?: MaterialType;
  file_url?: string;
  file_size?: string;
  file_name?: string;
  description?: string;
  uploader_name?: string;
  uploaded_by_name?: string;
  institution_type?: string;
  created_at?: string;
}
export type LearningMaterial = LMSMaterial;

// Matches the actual `lms_assignments` DB table
export interface LMSAssignment {
  id: number;
  course_id?: number;
  course_name?: string;
  title: string;
  instructions?: string;
  description?: string;
  deadline?: string;
  due_date?: string;
  max_score: number;
  submission_type: "file" | "text" | "link" | "both";
  attachment_url?: string;
  visibility?: "published" | "draft" | "closed";
  status: "active" | "closed" | "published" | "draft";
  submissions_count?: number;
  institution_type?: string;
  created_by?: number;
  created_at?: string;
  student_submission?: LMSAssignmentSubmission;
}
export type Assignment = LMSAssignment;

// Matches the actual `lms_assignment_submissions` DB table
export interface LMSAssignmentSubmission {
  id: number;
  assignments_id?: number;
  assignment_id?: number;
  assignment_title?: string;
  student_id: number;
  student_name?: string;
  submission_text?: string;
  file_url?: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  status: "submitted" | "graded" | "late";
}
export type StudentSubmission = LMSAssignmentSubmission;

export interface EligibilityResult {
  eligible: boolean;
  student_id?: number;
  course_id?: number;
  course_code?: string;
  course_title?: string;
  missing_prerequisites?: { id: number; code: string; title: string; prerequisite_course_id?: number; min_grade?: string }[];
  recommendation?: string;
}
export type EnrollmentEligibility = EligibilityResult;

export interface DashboardSummaryStats {
  total_departments: number;
  total_programs: number;
  total_courses: number;
  total_curriculums: number;
  total_curriculum_versions: number;
  total_learning_materials: number;
  total_assignments: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
}

export interface AcademicFilterParams {
  search?: string;
  department_id?: number | string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}