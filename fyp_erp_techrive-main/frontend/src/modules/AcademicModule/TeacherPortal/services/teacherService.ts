import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export interface TeacherDashboardStats {
  assigned_courses: number;
  total_students: number;
  classes_today: number;
  pending_assignments: number;
  upcoming_exams: number;
  attendance_alerts: number;
  total_courses: number;
  active_assignments: number;
  by_institution: Record<string, { courses: number; assignments: number }>;
}

export interface TeacherCourse {
  id: number;
  name: string | null;
  subject_code: string | null;
  credit_hours: number | null;
  semester: number | null;
  type: string | null;
  category: string | null;
  status: string;
  number_of_students: number;
  course: string;
}

export interface TeacherStudent {
  id: number;
  first_name: string | null;
  last_name: string | null;
  reg_no: string | null;
  email: string | null;
}

export interface StudentAttendanceRecord {
  id: number | null;
  student_id: number;
  student_name: string;
  reg_no: string | null;
  course_id: number;
  class_date: string;
  attendance: "Present" | "Absent" | "Leave" | "Not Marked";
}

export interface AttendanceAnalytics {
  required_percentage: number;
  courses: { course_id: number; course_name: string; attendance_percentage: number; present: number; total: number }[];
  students_below_threshold: { student_id: number; name: string; reg_no: string | null; attendance_percentage: number; present: number; total: number }[];
  most_attended_course: AttendanceAnalytics["courses"][number] | null;
  least_attended_course: AttendanceAnalytics["courses"][number] | null;
}

type ApiPayload = Record<string, unknown>;

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("erp_token"); 
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const teacherService = {
  // Dashboard stats
  getDashboardStats: async (): Promise<{ success: boolean; data: TeacherDashboardStats }> => {
    const res = await API.get("/teacher/dashboard-stats");
    return res.data;
  },
  // My courses for teacher
  getMyCourses: async (): Promise<{ success: boolean; data: TeacherCourse[] }> => {
    const res = await API.get("/teacher/my-courses");
    return res.data;
  },
  // Students of a particular course
  getCourseStudents: async (courseId: number): Promise<{ success: boolean; data: TeacherStudent[] }> => {
    const res = await API.get(`/teacher/course/${courseId}/students`);
    return res.data;
  },
  getTimetable: async () => {
    const res = await API.get("/teacher/timetable");
    return res.data;
  },
  getAttendance: async (courseId: number, classDate: string): Promise<{ success: boolean; data: StudentAttendanceRecord[] }> => {
    const res = await API.get("/teacher/attendance", { params: { course_id: courseId, class_date: classDate } });
    return res.data;
  },
  saveAttendance: async (data: Pick<StudentAttendanceRecord, "student_id" | "course_id" | "class_date" | "attendance">) => {
    const res = await API.post("/teacher/attendance", data);
    return res.data;
  },
  getAttendanceAnalytics: async (): Promise<{ success: boolean; data: AttendanceAnalytics }> => {
    const res = await API.get("/teacher/attendance/analytics");
    return res.data;
  },
  // LMS – upload material (notes)
  uploadMaterial: async (data: ApiPayload) => {
    const res = await API.post("/teacher/lms/material", data);
    return res.data;
  },
  // LMS – create assignment
  createAssignment: async (data: ApiPayload) => {
    const res = await API.post("/teacher/lms/assignment", data);
    return res.data;
  },
  // LMS – get assignment submissions
  getAssignmentSubmissions: async (assignmentId: number) => {
    const res = await API.get(`/teacher/lms/assignment/${assignmentId}/submissions`);
    return res.data;
  },
  // Exams
  getExams: async () => {
    const res = await API.get("/teacher/exams");
    return res.data;
  },
  createExamSlot: async (data: { course_id: number; title: string; total_marks: number }) => {
    const res = await API.post("/teacher/exams", data);
    return res.data;
  },
  getExamStudents: async (scheduleId: number) => {
    const res = await API.get(`/teacher/exams/${scheduleId}/students`);
    return res.data;
  },
  saveMarks: async (scheduleId: number, marks: ApiPayload[]) => {
    const res = await API.post(`/teacher/exams/${scheduleId}/marks`, { marks });
    return res.data;
  },
  // Communication
  getNotices: async () => {
    const res = await API.get("/teacher/notices");
    return res.data;
  },
  createNotice: async (data: { title: string, body: string }) => {
    const res = await API.post("/teacher/notices", data);
    return res.data;
  },
  messageParent: async (data: { email: string, message: string }) => {
    const res = await API.post("/teacher/parent-message", data);
    return res.data;
  },
  // Gradebook
  getGradebookCategories: async (courseId: number, sectionId: number) => {
    const res = await API.get(`/teacher/gradebook/${courseId}/${sectionId}/categories`);
    return res.data;
  },
  saveGradebookCategory: async (data: any) => {
    const res = await API.post(`/teacher/gradebook/categories`, data);
    return res.data;
  },
  deleteGradebookCategory: async (categoryId: number) => {
    const res = await API.delete(`/teacher/gradebook/categories/${categoryId}`);
    return res.data;
  },
  getGradebookMarks: async (categoryId: number, sectionId: number) => {
    const res = await API.get(`/teacher/gradebook/${categoryId}/${sectionId}/marks`);
    return res.data;
  },
  saveGradebookMarks: async (categoryId: number, marks: any[]) => {
    const res = await API.post(`/teacher/gradebook/${categoryId}/marks`, { marks });
    return res.data;
  },
  getGradebookSummary: async (courseId: number, sectionId: number) => {
    const res = await API.get(`/teacher/gradebook/${courseId}/${sectionId}/summary`);
    return res.data;
  },
  publishGradebook: async (courseId: number, sectionId: number, isPublished: boolean) => {
    const res = await API.post(`/teacher/gradebook/publish`, { courseId, sectionId, isPublished });
    return res.data;
  }
};
