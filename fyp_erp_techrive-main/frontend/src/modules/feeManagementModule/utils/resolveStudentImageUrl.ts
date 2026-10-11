import API from "../../../api/api";

/**
 * Resolve students.student_image (e.g. "/uploads/student-enrollment-photos/…")
 * to a browser URL. Static files are served at /uploads on the API host
 * (API.baseURL ends with /api).
 */
export const resolveStudentImageUrl = (
  studentImage: string | null | undefined
): string | null => {
  if (!studentImage || typeof studentImage !== "string") return null;
  const path = studentImage.trim();
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const apiBase = API.defaults.baseURL ?? "";
  const serverOrigin = apiBase.replace(/\/api\/?$/, "");
  return `${serverOrigin}${path.startsWith("/") ? path : `/${path}`}`;
};
