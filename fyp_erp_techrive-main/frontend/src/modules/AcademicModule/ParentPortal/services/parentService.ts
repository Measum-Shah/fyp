import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

API.interceptors.request.use((config) => {
  // Support both parent_token (from /parent/login) and erp_token (from main login)
  const token = localStorage.getItem("erp_token");  // parent logs in via main login page
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const parentService = {
  login: async (email: string, password: string) => {
    const res = await API.post("/parent/auth/login", { email, password });
    return res.data;
  },
  getStudentInfo:    async () => (await API.get("/parent/student")).data,
  getStudentCourses: async () => (await API.get("/parent/student/courses")).data,
  getStudentResults: async () => (await API.get("/parent/student/results")).data,
  getStudentProgress:async () => (await API.get("/parent/student/progress")).data,
  getStudentTeachers:async () => (await API.get("/parent/student/teachers")).data,
};