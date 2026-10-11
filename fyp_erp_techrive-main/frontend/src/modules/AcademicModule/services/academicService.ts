import API from "../../../api/api";
import type {
  Department,
  Program,
  Major,
  Minor,
  Course,
  Curriculum,
  CurriculumVersion,
  Prerequisite,
  Corequisite,
  LMSMaterial,
  LMSAssignment,
  LMSAssignmentSubmission,
  EligibilityResult,
  DashboardSummaryStats,
} from "../types";

// ─── Institution Type helper ──────────────────────────────────────────────────
function getInstitutionType(): string {
  return localStorage.getItem("erp_academic_inst_type") || "university";
}

function getStoredBranchId(): number | null {
  const raw = localStorage.getItem("erp_academic_branch_id");
  return raw ? Number(raw) : null;
}

// ─── Strip frontend-only display fields before sending to backend ─────────────
function cleanPayload<T extends Record<string, any>>(payload: T): Partial<T> {
  const {
    department_name,
    program_name,
    course_name,
    assignment_title,
    student_name,
    prerequisites_count,
    corequisites_count,
    ...cleaned
  } = payload as any;
  return cleaned;
}

// ─── API response extractor ───────────────────────────────────────────────────
// Handles both array responses { success, data: [...] }
// and paginated responses    { success, data: { data: [...], total, ... } }
// Returns the array, or null if the call truly failed.
async function callApi<T>(apiFunc: () => Promise<any>): Promise<T[] | null> {
  try {
    const res = await apiFunc();
    if (!res?.data?.success) return null;

    const payload = res.data.data;
    if (Array.isArray(payload)) return payload as T[];

    // Paginated wrapper: { data: [...], total, page, ... }
    if (payload && Array.isArray(payload.data)) return payload.data as T[];

    return null;
  } catch (err: any) {
    // Re-throw real server errors (4xx/5xx) so the UI can show them
    const status = err?.response?.status;
    if (status && status >= 400) throw err;
    // Network/timeout — return null so callers can decide
    return null;
  }
}

// ─── Mock / Fallback Data ─────────────────────────────────────────────────────
// Used ONLY when the API is unreachable (network error).
// If the DB is empty, an empty array is returned — never mock data.

const MOCK_DEPARTMENTS: Department[] = [];
const MOCK_PROGRAMS: Program[] = [];
const MOCK_MAJORS: Major[] = [];
const MOCK_MINORS: Minor[] = [];
const MOCK_COURSES: Course[] = [];
const MOCK_CURRICULUMS: Curriculum[] = [];
const MOCK_VERSIONS: CurriculumVersion[] = [];
const MOCK_PREREQUISITES: Prerequisite[] = [];
const MOCK_COREQUISITES: Corequisite[] = [];
const MOCK_LMS_MATERIALS: LMSMaterial[] = [];
const MOCK_ASSIGNMENTS: LMSAssignment[] = [];
const MOCK_SUBMISSIONS: LMSAssignmentSubmission[] = [];

export const academicService = {
  // ─── Departments ─────────────────────────────────────────────────────────────
  getDepartments: async (institutionType?: string, branchId?: number | null): Promise<Department[]> => {
    const inst = institutionType || getInstitutionType();
    const params: Record<string, any> = { institution_type: inst };
    // Pass branch_id if set — backend filters via branch_departments junction
    const storedBranchId = branchId ?? getStoredBranchId();
    if (storedBranchId) params.branch_id = storedBranchId;
    const result = await callApi<Department>(() =>
      API.get("/academic/departments", { params })
    );
    return result ?? MOCK_DEPARTMENTS;
  },

  createDepartment: async (dept: Omit<Department, "id">): Promise<Department> => {
    const payload = cleanPayload({ ...dept, institution_type: dept.institution_type || getInstitutionType() });
    const res = await API.post("/academic/departments", payload);
    if (res.data?.success && res.data?.data) return res.data.data as Department;
    throw new Error(res.data?.message || "Failed to create department");
  },

  updateDepartment: async (id: number, dept: Partial<Department>): Promise<Department> => {
    const res = await API.put(`/academic/departments/${id}`, cleanPayload(dept));
    if (res.data?.success && res.data?.data) return res.data.data as Department;
    throw new Error(res.data?.message || "Failed to update department");
  },

  deleteDepartment: async (id: number): Promise<boolean> => {
    await API.delete(`/academic/departments/${id}`);
    return true;
  },

  // ─── Branches ────────────────────────────────────────────────────────────────
  getBranches: async (institutionType?: string): Promise<{ id: number; name: string; branch_code: string; short_name?: string }[]> => {
    const inst = institutionType || getInstitutionType();
    const result = await callApi<{ id: number; name: string; branch_code: string; short_name?: string }>(() =>
      API.get("/academic/branches", { params: { institution_type: inst } })
    );
    return result ?? [];
  },

  // ─── Universities & Campuses ─────────────────────────────────────────────────
  getUniversities: async (): Promise<{ id: number; name: string; description?: string }[]> => {
    const result = await callApi<{ id: number; name: string; description?: string }>(() =>
      API.get("/academic/branches/universities")
    );
    return result ?? [];
  },

  getCampusesByUniversity: async (companyId: number): Promise<{ id: number; name: string; branch_code: string; address?: string }[]> => {
    const result = await callApi<{ id: number; name: string; branch_code: string; address?: string }>(() =>
      API.get(`/academic/branches/universities/${companyId}/campuses`)
    );
    return result ?? [];
  },

  // ─── Programs ────────────────────────────────────────────────────────────────
  getPrograms: async (institutionType?: string, branchId?: number | null): Promise<Program[]> => {
    const inst = institutionType || getInstitutionType();
    const storedBranchId = branchId ?? getStoredBranchId();
    const params: any = { institution_type: inst };
    if (storedBranchId) params.branch_id = storedBranchId;

    const result = await callApi<Program>(() =>
      API.get("/academic/programs", { params })
    );
    return result ?? MOCK_PROGRAMS;
  },

  createProgram: async (prog: Omit<Program, "id">): Promise<Program> => {
    const payload = cleanPayload({ ...prog, institution_type: prog.institution_type || getInstitutionType() });
    const res = await API.post("/academic/programs", payload);
    if (res.data?.success && res.data?.data) return res.data.data as Program;
    throw new Error(res.data?.message || "Failed to create program");
  },

  updateProgram: async (id: number, prog: Partial<Program>): Promise<Program> => {
    const res = await API.put(`/academic/programs/${id}`, cleanPayload(prog));
    if (res.data?.success && res.data?.data) return res.data.data as Program;
    throw new Error(res.data?.message || "Failed to update program");
  },

  deleteProgram: async (id: number): Promise<boolean> => {
    await API.delete(`/academic/programs/${id}`);
    return true;
  },

  // ─── Majors ──────────────────────────────────────────────────────────────────
  getMajors: async (institutionType?: string, branchId?: number | null): Promise<Major[]> => {
    const inst = institutionType || getInstitutionType();
    const storedBranchId = branchId ?? getStoredBranchId();
    const params: any = { institution_type: inst };
    if (storedBranchId) params.branch_id = storedBranchId;

    const result = await callApi<Major>(() =>
      API.get("/academic/majors", { params })
    );
    return result ?? MOCK_MAJORS;
  },

  createMajor: async (major: Omit<Major, "id">): Promise<Major> => {
    const payload = cleanPayload({ ...major, institution_type: major.institution_type || getInstitutionType() });
    const res = await API.post("/academic/majors", payload);
    if (res.data?.success && res.data?.data) return res.data.data as Major;
    throw new Error(res.data?.message || "Failed to create major");
  },

  updateMajor: async (id: number, major: Partial<Major>): Promise<Major> => {
    const res = await API.put(`/academic/majors/${id}`, cleanPayload(major));
    if (res.data?.success && res.data?.data) return res.data.data as Major;
    throw new Error(res.data?.message || "Failed to update major");
  },

  deleteMajor: async (id: number): Promise<boolean> => {
    await API.delete(`/academic/majors/${id}`);
    return true;
  },

  // ─── Minors ──────────────────────────────────────────────────────────────────
  getMinors: async (institutionType?: string, branchId?: number | null): Promise<Minor[]> => {
    const inst = institutionType || getInstitutionType();
    const storedBranchId = branchId ?? getStoredBranchId();
    const params: any = { institution_type: inst };
    if (storedBranchId) params.branch_id = storedBranchId;

    const result = await callApi<Minor>(() =>
      API.get("/academic/minors", { params })
    );
    return result ?? MOCK_MINORS;
  },

  createMinor: async (minor: Omit<Minor, "id">): Promise<Minor> => {
    const payload = cleanPayload({ ...minor, institution_type: minor.institution_type || getInstitutionType() });
    const res = await API.post("/academic/minors", payload);
    if (res.data?.success && res.data?.data) return res.data.data as Minor;
    throw new Error(res.data?.message || "Failed to create minor");
  },

  updateMinor: async (id: number, minor: Partial<Minor>): Promise<Minor> => {
    const res = await API.put(`/academic/minors/${id}`, cleanPayload(minor));
    if (res.data?.success && res.data?.data) return res.data.data as Minor;
    throw new Error(res.data?.message || "Failed to update minor");
  },

  deleteMinor: async (id: number): Promise<boolean> => {
    await API.delete(`/academic/minors/${id}`);
    return true;
  },

  // ─── Courses ─────────────────────────────────────────────────────────────────
  getCourses: async (params?: Record<string, any>, institutionType?: string, branchId?: number | null): Promise<Course[]> => {
    const inst = institutionType || getInstitutionType();
    // Only apply branch filter when a branchId is explicitly provided (not undefined)
    const effectiveBranchId = branchId !== undefined ? branchId : getStoredBranchId();
    const queryParams: any = { ...params, institution_type: inst, limit: 1000 };
    if (effectiveBranchId) queryParams.branch_id = effectiveBranchId;

    const result = await callApi<Course>(() =>
      API.get("/academic/courses", { params: queryParams })
    );
    return result ?? MOCK_COURSES;
  },

  getCourseById: async (id: number): Promise<Course | null> => {
    try {
      const res = await API.get(`/academic/courses/${id}`);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  },

  createCourse: async (course: Omit<Course, "id">): Promise<Course> => {
    const payload = cleanPayload({ ...course, institution_type: course.institution_type || getInstitutionType() });
    const res = await API.post("/academic/courses", payload);
    if (res.data?.success && res.data?.data) return res.data.data as Course;
    throw new Error(res.data?.message || "Failed to create course");
  },

  updateCourse: async (id: number, course: Partial<Course>): Promise<Course> => {
    const res = await API.put(`/academic/courses/${id}`, cleanPayload(course));
    if (res.data?.success && res.data?.data) return res.data.data as Course;
    throw new Error(res.data?.message || "Failed to update course");
  },

  deleteCourse: async (id: number): Promise<boolean> => {
    await API.delete(`/academic/courses/${id}`);
    return true;
  },

  // ─── Curriculums ─────────────────────────────────────────────────────────────
  getCurriculums: async (institutionType?: string, branchId?: number | null): Promise<Curriculum[]> => {
    const inst = institutionType || getInstitutionType();
    const storedBranchId = branchId ?? getStoredBranchId();
    const params: any = { institution_type: inst };
    if (storedBranchId) params.branch_id = storedBranchId;

    const result = await callApi<Curriculum>(() =>
      API.get("/academic/curriculums", { params })
    );
    return result ?? MOCK_CURRICULUMS;
  },

  createCurriculum: async (curr: Omit<Curriculum, "id">): Promise<Curriculum> => {
    const payload = cleanPayload({ ...curr, institution_type: curr.institution_type || getInstitutionType() });
    const res = await API.post("/academic/curriculums", payload);
    if (res.data?.success && res.data?.data) return res.data.data as Curriculum;
    throw new Error(res.data?.message || "Failed to create curriculum");
  },

  updateCurriculum: async (id: number, curr: Partial<Curriculum>): Promise<Curriculum> => {
    const res = await API.put(`/academic/curriculums/${id}`, cleanPayload(curr));
    if (res.data?.success && res.data?.data) return res.data.data as Curriculum;
    throw new Error(res.data?.message || "Failed to update curriculum");
  },

  deleteCurriculum: async (id: number): Promise<boolean> => {
    await API.delete(`/academic/curriculums/${id}`);
    return true;
  },

  // ─── Curriculum Versions ─────────────────────────────────────────────────────
  getVersions: async (institutionType?: string, branchId?: number | null): Promise<CurriculumVersion[]> => {
    const inst = institutionType || getInstitutionType();
    const storedBranchId = branchId ?? getStoredBranchId();
    const params: any = { institution_type: inst };
    if (storedBranchId) params.branch_id = storedBranchId;

    const result = await callApi<CurriculumVersion>(() =>
      API.get("/academic/curriculum-versions", { params })
    );
    return result ?? MOCK_VERSIONS;
  },

  createVersion: async (ver: Omit<CurriculumVersion, "id">): Promise<CurriculumVersion> => {
    const payload = cleanPayload({ ...ver, institution_type: getInstitutionType() });
    const res = await API.post("/academic/curriculum-versions", payload);
    if (res.data?.success && res.data?.data) return res.data.data as CurriculumVersion;
    throw new Error(res.data?.message || "Failed to create version");
  },

  updateVersion: async (id: number, ver: Partial<CurriculumVersion>): Promise<CurriculumVersion> => {
    const res = await API.put(`/academic/curriculum-versions/${id}`, cleanPayload(ver));
    if (res.data?.success && res.data?.data) return res.data.data as CurriculumVersion;
    throw new Error(res.data?.message || "Failed to update version");
  },

  deleteVersion: async (id: number): Promise<boolean> => {
    await API.delete(`/academic/curriculum-versions/${id}`);
    return true;
  },

  // ─── Prerequisites ───────────────────────────────────────────────────────────
  getPrerequisitesByCourse: async (courseId: number): Promise<Prerequisite[]> => {
    const result = await callApi<Prerequisite>(() =>
      API.get(`/academic/prerequisites/${courseId}`, { params: { type: "prerequisite" } })
    );
    return result ?? [];
  },

  getAllPrerequisites: async (institutionType?: string): Promise<Prerequisite[]> => {
    const result = await callApi<Prerequisite>(() =>
      API.get("/academic/prerequisites", { params: { type: "prerequisite" } })
    );
    return result ?? MOCK_PREREQUISITES;
  },

  assignPrerequisite: async (course_id: number, precourse_id: number, min_grade = "C"): Promise<Prerequisite> => {
    const res = await API.post("/academic/prerequisites", {
      course_id,
      precourse_id,
      co_requisite_type: "prerequisite",
    });
    if (res.data?.success && res.data?.data) return res.data.data as Prerequisite;
    throw new Error(res.data?.message || "Failed to assign prerequisite");
  },

  removePrerequisite: async (id: number): Promise<boolean> => {
    await API.delete(`/academic/prerequisites/${id}`);
    return true;
  },

  // ─── Corequisites ────────────────────────────────────────────────────────────
  getCorequisitesByCourse: async (courseId: number): Promise<Corequisite[]> => {
    const result = await callApi<Corequisite>(() =>
      API.get(`/academic/prerequisites/${courseId}`, { params: { type: "corequisite" } })
    );
    return result ?? [];
  },

  getAllCorequisites: async (institutionType?: string): Promise<Corequisite[]> => {
    const result = await callApi<Corequisite>(() =>
      API.get("/academic/prerequisites", { params: { type: "corequisite" } })
    );
    return result ?? MOCK_COREQUISITES;
  },

  assignCorequisite: async (course_id: number, corequisite_course_id: number): Promise<Corequisite> => {
    const res = await API.post("/academic/prerequisites", {
      course_id,
      precourse_id: corequisite_course_id,
      co_requisite_type: "corequisite",
    });
    if (res.data?.success && res.data?.data) return res.data.data as Corequisite;
    throw new Error(res.data?.message || "Failed to assign corequisite");
  },

  removeCorequisite: async (id: number): Promise<boolean> => {
    await API.delete(`/academic/prerequisites/${id}`);
    return true;
  },

  // ─── LMS Materials ───────────────────────────────────────────────────────────
  getMaterials: async (institutionType?: string, courseId?: number): Promise<LMSMaterial[]> => {
    const inst = institutionType || getInstitutionType();
    const params: Record<string, any> = { institution_type: inst };
    if (courseId) params.course_id = courseId;
    const result = await callApi<LMSMaterial>(() =>
      API.get("/academic/lms/materials", { params })
    );
    return result ?? MOCK_LMS_MATERIALS;
  },

  uploadMaterial: async (mat: Omit<LMSMaterial, "id">): Promise<LMSMaterial> => {
    const payload = cleanPayload({
      ...mat,
      institution_type: (mat as any).institution_type || getInstitutionType(),
    });
    const res = await API.post("/academic/lms/materials", payload);
    if (res.data?.success && res.data?.data) return res.data.data as LMSMaterial;
    throw new Error(res.data?.message || "Upload failed — server returned no data");
  },

  updateMaterial: async (id: number, mat: Partial<LMSMaterial>): Promise<LMSMaterial> => {
    const res = await API.put(`/academic/lms/materials/${id}`, cleanPayload(mat));
    if (res.data?.success && res.data?.data) return res.data.data as LMSMaterial;
    throw new Error(res.data?.message || "Failed to update material");
  },

  deleteMaterial: async (id: number): Promise<boolean> => {
    await API.delete(`/academic/lms/materials/${id}`);
    return true;
  },

  // ─── LMS Assignments ─────────────────────────────────────────────────────────
  getAssignments: async (institutionType?: string): Promise<LMSAssignment[]> => {
    const inst = institutionType || getInstitutionType();
    const result = await callApi<LMSAssignment>(() =>
      API.get("/academic/lms/assignments", { params: { institution_type: inst } })
    );
    return result ?? MOCK_ASSIGNMENTS;
  },

  createAssignment: async (assign: Omit<LMSAssignment, "id">): Promise<LMSAssignment> => {
    const payload = cleanPayload({
      ...assign,
      institution_type: getInstitutionType(),
    });
    const res = await API.post("/academic/lms/assignments", payload);
    if (res.data?.success && res.data?.data) return res.data.data as LMSAssignment;
    throw new Error(res.data?.message || "Failed to create assignment");
  },

  updateAssignment: async (id: number, assign: Partial<LMSAssignment>): Promise<LMSAssignment> => {
    const res = await API.put(`/academic/lms/assignments/${id}`, cleanPayload(assign));
    if (res.data?.success && res.data?.data) return res.data.data as LMSAssignment;
    throw new Error(res.data?.message || "Failed to update assignment");
  },

  deleteAssignment: async (id: number): Promise<boolean> => {
    await API.delete(`/academic/lms/assignments/${id}`);
    return true;
  },

  submitAssignment: async (sub: Partial<LMSAssignmentSubmission>): Promise<LMSAssignmentSubmission> => {
    const payload = cleanPayload(sub);
    const res = await API.post("/academic/lms/assignments/submit", payload);
    if (res.data?.success && res.data?.data) return res.data.data as LMSAssignmentSubmission;
    throw new Error(res.data?.message || "Failed to submit assignment");
  },

  getSubmissions: async (assignmentId: number): Promise<LMSAssignmentSubmission[]> => {
    const result = await callApi<LMSAssignmentSubmission>(() =>
      API.get(`/academic/lms/assignments/${assignmentId}/submissions`)
    );
    return result ?? MOCK_SUBMISSIONS;
  },

  gradeSubmission: async (id: number, grade: number, feedback: string): Promise<LMSAssignmentSubmission> => {
    const res = await API.put(`/academic/lms/submissions/${id}/grade`, { grade, feedback });
    if (res.data?.success && res.data?.data) return res.data.data as LMSAssignmentSubmission;
    throw new Error(res.data?.message || "Failed to grade submission");
  },

  // ─── Enrollment Validation ───────────────────────────────────────────────────
  validateEnrollmentEligibility: async (studentId: number, courseId: number): Promise<EligibilityResult> => {
    try {
      const res = await API.get(`/academic/enrollment/validate/${studentId}/${courseId}`);
      if (res.data) return res.data as EligibilityResult;
    } catch (e) {
      console.warn("Enrollment validation error:", e);
    }
    return {
      eligible: false,
      student_id: studentId,
      course_id: courseId,
      recommendation: "Unable to validate eligibility at this time.",
    };
  },

  // ─── Dashboard & Reports ─────────────────────────────────────────────────────
  getDashboardStats: async (institutionType = "university"): Promise<DashboardSummaryStats> => {
    try {
      const res = await API.get("/academic/dashboard/summary", {
        params: { institution_type: institutionType },
      });
      if (res.data?.success && res.data?.data) return res.data.data as DashboardSummaryStats;
    } catch (e) {
      console.warn("Dashboard stats error:", e);
    }
    return {
      total_departments: 0,
      total_programs: 0,
      total_courses: 0,
      total_curriculums: 0,
      total_curriculum_versions: 0,
      total_learning_materials: 0,
      total_assignments: 0,
    };
  },
};
