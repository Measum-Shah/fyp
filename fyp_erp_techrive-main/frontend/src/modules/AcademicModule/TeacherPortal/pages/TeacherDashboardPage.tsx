import React, { useEffect, useState } from "react";
import { teacherService, type TeacherDashboardStats } from "../services/teacherService";

const IconTrend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconCourses = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const IconFile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconUsers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconCalendar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconExam = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
const IconAlert = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.3 3.4-8 14A2 2 0 0 0 4 20.4h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

const TeacherDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await teacherService.getDashboardStats();
      if (res.success) {
        setStats(res.data);
        setError(null);
      }
    } catch (error) {
      console.error("Failed to load dashboard stats", error);
      setError("Dashboard statistics could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchStats);
  }, []);

  const currentStats = {
    courses: stats?.assigned_courses ?? 0,
    assignments: stats?.pending_assignments ?? 0
  };

  const statCards = [
    { label: "Assigned Courses", value: currentStats.courses, change: "Current Session", icon: <IconCourses />, color: "blue" },
    { label: "Total Students", value: stats?.total_students ?? 0, change: "Across your courses", icon: <IconUsers />, color: "green" },
    { label: "Classes Today", value: stats?.classes_today ?? 0, change: "On today's timetable", icon: <IconCalendar />, color: "gold" },
    { label: "Pending Assignments", value: currentStats.assignments, change: "Open deadlines", icon: <IconFile />, color: "purple" },
    { label: "Upcoming Exams", value: stats?.upcoming_exams ?? 0, change: "Scheduled ahead", icon: <IconExam />, color: "blue" },
    { label: "Attendance Alerts", value: stats?.attendance_alerts ?? 0, change: "Today", icon: <IconAlert />, color: "gold" },
  ];

  return (
    <div className="teacher-dashboard flex flex-col gap-6">
      <div className="teacher-dashboard-header flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Overview</h1>
      </div>

      {error && <div className="teacher-dashboard-error" role="alert">{error}</div>}

      <div className="teacher-stats-grid">
        {statCards.map((stat, i) => (
          <div key={i} className={`stat-card stat-card-${stat.color}`}>
            <div className="stat-header">
              <div className={`stat-icon stat-icon-${stat.color}`}>
                {stat.icon}
              </div>
              <span className="stat-change">
                <IconTrend /> {stat.change}
              </span>
            </div>
            <div className="stat-value">{loading ? "..." : stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="panel-card teacher-dashboard-note mt-6">
         <div className="panel-card-header">
           <h3>Welcome to Teacher Dashboard</h3>
         </div>
         <div className="p-4 text-slate-600 dark:text-slate-300">
           From here you can manage your assigned courses, students, and LMS activities (Assignments, Study Material, etc.). Use the sidebar to navigate to the specific modules.
         </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
