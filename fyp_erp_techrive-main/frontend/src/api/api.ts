import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("erp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Session-ended handling ────────────────────────────────────────────────
// Previously there was no response interceptor at all, so a 401 from
// auth.middleware.ts's isSessionActive() check (which fires the moment an
// admin force-logs-out a session — see session.controller.ts's
// forceLogoutSession) had nowhere to go: the failed request just errored
// out silently and the user was left staring at a dead page, still
// "logged in" client-side, until they happened to refresh.
// /auth/login and /auth/register are excluded on purpose — those routes
// legitimately return 401 for wrong credentials while the person is
// sitting on the login page itself, and redirecting-to-login FROM the
// login page on a failed login attempt would wipe out the error message
// they're supposed to see.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl: string = error?.config?.url || "";
    const isPublicAuthEndpoint =
      requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");

    if (status === 401 && !isPublicAuthEndpoint) {
      localStorage.removeItem("erp_token");
      localStorage.removeItem("erp_user");
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    API.post("/auth/login", { email, password }),

  register: (name: string, email: string, password: string) =>
    API.post("/auth/register", { name, email, password }),

  getMe: () => API.get("/auth/me"),

  // Tells the server to close the erp_user_sessions row for this login
  // (records logout_time / session_duration_seconds / logout_reason) —
  // without this call, the previous behavior of only clearing
  // localStorage never told the backend the session actually ended.
  logout: () => API.post("/auth/logout"),
};

export default API;
