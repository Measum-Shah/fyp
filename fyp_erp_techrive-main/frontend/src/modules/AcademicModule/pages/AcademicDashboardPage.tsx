import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "../components/common/StatCard";
import { BarChart, LineChart, DonutChart } from "../components/common/VisualCharts";
import { SkeletonLoader } from "../components/common/SkeletonLoader";
import { academicService } from "../services/academicService";
import { useRoleAccess } from "../hooks/useRoleAccess";
import type { DashboardSummaryStats, ChartDataPoint } from "../types";

const AcademicDashboardPage: React.FC = () => {
  const { role, institutionType, isAdmin, isFaculty, isStudent } = useRoleAccess();
  const [stats, setStats] = useState<DashboardSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    academicService.getDashboardStats(institutionType).then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, [institutionType]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const userName = (() => {
    try {
      const raw = localStorage.getItem("erp_user");
      if (raw && raw !== "undefined") {
        return JSON.parse(raw).name?.split(" ")[0] || "Admin";
      }
    } catch {
      // fallback
    }
    return "Admin";
  })();

  // Scale for charts
  const scale = institutionType === "university" ? 1 :
                institutionType === "college" ? 0.6 :
                institutionType === "institute" ? 0.4 : 0.2;

  // Mock Data arrays for charts (scaled according to institution context)
  const coursesByDept: ChartDataPoint[] = [
    { label: "CS", value: Math.max(1, Math.floor(12 * scale)) }, 
    { label: "EE", value: Math.max(1, Math.floor(8 * scale)) }, 
    { label: "BA", value: Math.max(1, Math.floor(15 * scale)) }, 
    { label: "MATH", value: Math.max(1, Math.floor(6 * scale)) },
  ];
  const programsByDept: ChartDataPoint[] = [
    { label: "CS", value: Math.max(1, Math.floor(3 * scale)) }, 
    { label: "EE", value: Math.max(1, Math.floor(2 * scale)) }, 
    { label: "BA", value: Math.max(1, Math.floor(4 * scale)) }, 
    { label: "MATH", value: Math.max(1, Math.floor(2 * scale)) },
  ];
  const coursesByProgram: ChartDataPoint[] = [
    { label: "BS CS", value: Math.max(1, Math.floor(40 * scale)) },
    { label: "BS SE", value: Math.max(1, Math.floor(35 * scale)) },
    { label: "BBA", value: Math.max(1, Math.floor(25 * scale)) },
    { label: "MBA", value: Math.max(1, Math.floor(15 * scale)) },
  ];
  const coursesBySemester: ChartDataPoint[] = [
    { label: "Sem 1", value: Math.max(1, Math.floor(12 * scale)) },
    { label: "Sem 2", value: Math.max(1, Math.floor(10 * scale)) },
    { label: "Sem 3", value: Math.max(1, Math.floor(14 * scale)) },
    { label: "Sem 4", value: Math.max(1, Math.floor(11 * scale)) },
    { label: "Sem 5", value: Math.max(1, Math.floor(9 * scale)) },
    { label: "Sem 6", value: Math.max(1, Math.floor(8 * scale)) },
    { label: "Sem 7", value: Math.max(1, Math.floor(6 * scale)) },
    { label: "Sem 8", value: Math.max(1, Math.floor(5 * scale)) },
  ];
  const coursesByCategory: ChartDataPoint[] = [
    { label: "Core", value: Math.max(1, Math.floor(50 * scale)) },
    { label: "Elective", value: Math.max(1, Math.floor(20 * scale)) },
    { label: "Optional", value: Math.max(1, Math.floor(10 * scale)) },
    { label: "Lab", value: Math.max(1, Math.floor(15 * scale)) },
    { label: "General", value: Math.max(1, Math.floor(25 * scale)) },
  ];
  const enrollmentTrends: ChartDataPoint[] = [
    { label: "Jan", value: Math.max(1, Math.floor(45 * scale)) }, 
    { label: "Feb", value: Math.max(1, Math.floor(52 * scale)) }, 
    { label: "Mar", value: Math.max(1, Math.floor(61 * scale)) },
    { label: "Apr", value: Math.max(1, Math.floor(58 * scale)) }, 
    { label: "May", value: Math.max(1, Math.floor(72 * scale)) }, 
    { label: "Jun", value: Math.max(1, Math.floor(85 * scale)) },
  ];
  const assignmentStats: ChartDataPoint[] = [
    { label: "Active", value: Math.max(1, Math.floor(24 * scale)) }, 
    { label: "Graded", value: Math.max(1, Math.floor(18 * scale)) }, 
    { label: "Late", value: Math.max(1, Math.floor(5 * scale)) },
  ];

  const activities = [
    { text: "New course CS301 — Web Engineering added to catalog", time: "5 min ago", type: "info" },
    { text: "Curriculum v2.1 activated for BS Computer Science", time: "20 min ago", type: "success" },
    { text: "Assignment deadline extended for CS201 Lab Project", time: "1 hour ago", type: "info" },
    { text: "3 new student assignment submissions received", time: "2 hours ago", type: "success" },
    { text: "Department report generated for June 2026", time: "4 hours ago", type: "info" },
  ];

  if (loading) return <div style={{ padding: "1.5rem 2rem" }}><SkeletonLoader rows={7} type="card" /></div>;

  return (
    <div>
      {/* ═══ Welcome Banner ═══════════════════════════════════════════════════ */}
      <section className="welcome-banner">
        <div className="welcome-content">
          <h2 className="welcome-greeting">
            {greeting()}, <span>{userName}</span> 👋
          </h2>
          <p className="welcome-text">
            {isAdmin && `Here's your academic module overview for this ${institutionType}. Manage courses, curriculums, and LMS content.`}
            {isFaculty && `Welcome back to your faculty dashboard. View your active courses, grade assignments, and upload LMS materials.`}
            {isStudent && `Welcome back to your student portal. Track your enrolled courses, check assignments, and view your academic progress.`}
          </p>
        </div>
        <div className="welcome-visual">
          <div className="welcome-circle welcome-circle-1" />
          <div className="welcome-circle welcome-circle-2" />
          <div className="welcome-circle welcome-circle-3" />
        </div>
      </section>

      {/* ═══ ROLE: ADMIN VIEW ═════════════════════════════════════════════════ */}
      {isAdmin && (
        <>
          <section className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            <StatCard label="Departments" value={stats?.total_departments ?? 0} color="blue" />
            <StatCard label="Programs" value={stats?.total_programs ?? 0} color="green" />
            <StatCard label="Courses" value={stats?.total_courses ?? 0} color="purple" />
            <StatCard label="Curriculums" value={stats?.total_curriculums ?? 0} color="gold" />
            <StatCard label="Versions" value={stats?.total_curriculum_versions ?? 0} color="green" />
            <StatCard label="Materials" value={stats?.total_learning_materials ?? 0} color="blue" />
            <StatCard label="Assignments" value={stats?.total_assignments ?? 0} color="gold" />
          </section>

          <section className="panels-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <BarChart title="Courses by Department" data={coursesByDept} />
            <DonutChart title="Programs by Department" data={programsByDept} />
            <DonutChart title="Courses by Category" data={coursesByCategory} />
          </section>

          <section className="panels-grid" style={{ gridTemplateColumns: "1fr 1fr", paddingTop: "0" }}>
            <BarChart title="Courses by Program" data={coursesByProgram} />
            <BarChart title="Courses by Semester" data={coursesBySemester} />
          </section>

          <section className="panels-grid" style={{ gridTemplateColumns: "1fr 1fr", paddingTop: "0" }}>
            <LineChart title="Enrollment Trends" data={enrollmentTrends} />
            <BarChart title="Assignments by Status" data={assignmentStats} />
          </section>

          <div className="panels-grid" style={{ paddingTop: "0" }}>
            <section className="panel-card">
              <div className="panel-card-header">
                <h3>System Activity</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dark-sub)" }}>Today</span>
              </div>
              <div className="activity-list">
                {activities.map((act, i) => (
                  <div key={i} className="activity-item">
                    <div className={`activity-dot activity-dot-${act.type}`} />
                    <div className="activity-content">
                      <p className="activity-text">{act.text}</p>
                      <span className="activity-time">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-card-header">
                <h3>Admin Quick Actions</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                {[
                  { label: "Manage Structure", path: "/academic/structure" },
                  { label: "Course Catalog", path: "/academic/courses" },
                  { label: "Build Curriculum", path: "/academic/curriculum" },
                  { label: "Global Reports", path: "/academic/reports" },
                ].map((qa, i) => (
                  <button key={i} onClick={() => navigate(qa.path)} style={{ padding: "1rem", background: "var(--input-bg)", border: "1px solid var(--card-border)", borderRadius: "10px", textAlign: "left", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-dark)", cursor: "pointer", transition: "all 0.2s ease" }} onMouseOver={e => e.currentTarget.style.borderColor = "var(--accent)"} onMouseOut={e => e.currentTarget.style.borderColor = "var(--card-border)"}>
                    {qa.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </>
      )}

      {/* ═══ ROLE: FACULTY VIEW ═══════════════════════════════════════════════ */}
      {isFaculty && (
        <>
          <section className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <StatCard label="My Active Courses" value={4} color="blue" />
            <StatCard label="Pending Submissions" value={18} color="gold" />
            <StatCard label="Uploaded Materials" value={24} color="purple" />
            <StatCard label="Average Attendance" value={"88%"} color="green" />
          </section>

          <div className="panels-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
            <section className="panel-card">
              <div className="panel-card-header">
                <h3>My Teaching Schedule</h3>
              </div>
              <div style={{ padding: "1rem" }}>
                {[
                  { course: "CS301 - Web Application Engineering", time: "Mon/Wed 10:00 AM", room: "Lab 402" },
                  { course: "CS201 - Data Structures", time: "Tue/Thu 2:00 PM", room: "Room 105" },
                ].map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid var(--divider-color)" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-dark)" }}>{c.course}</h4>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dark-sub)" }}>{c.time}</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent)", background: "rgba(29,111,191,0.1)", padding: "0.2rem 0.6rem", borderRadius: "6px", height: "fit-content" }}>{c.room}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-card-header">
                <h3>Faculty Actions</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
                <button onClick={() => navigate("/academic/lms")} className="submit-btn" style={{ margin: 0 }}>Upload LMS Material</button>
                <button onClick={() => navigate("/academic/reports")} style={{ padding: "0.6rem", background: "var(--input-bg)", border: "1px solid var(--card-border)", borderRadius: "8px", fontWeight: 600, color: "var(--text-dark)", cursor: "pointer" }}>Grade Assignments</button>
                <button onClick={() => navigate("/academic/enrollment")} style={{ padding: "0.6rem", background: "var(--input-bg)", border: "1px solid var(--card-border)", borderRadius: "8px", fontWeight: 600, color: "var(--text-dark)", cursor: "pointer" }}>View Student Roster</button>
              </div>
            </section>
          </div>
        </>
      )}

      {/* ═══ ROLE: STUDENT VIEW ═══════════════════════════════════════════════ */}
      {isStudent && (
        <>
          <section className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <StatCard label="Enrolled Courses" value={6} color="blue" />
            <StatCard label="Current CGPA" value={3.8} color="green" />
            <StatCard label="Pending Assignments" value={2} color="gold" />
            <StatCard label="Completed Credits" value={84} color="purple" />
          </section>

          <div className="panels-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
            <section className="panel-card">
              <div className="panel-card-header">
                <h3>My Current Courses</h3>
              </div>
              <div style={{ padding: "1rem", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
                {[
                  { code: "CS301", title: "Web Application Engineering", credits: 3 },
                  { code: "CS305", title: "Software Quality Assurance", credits: 3 },
                  { code: "MGT201", title: "Principles of Management", credits: 3 },
                  { code: "ENG102", title: "Technical Report Writing", credits: 3 },
                ].map((c, i) => (
                  <div key={i} style={{ border: "1px solid var(--card-border)", borderRadius: "8px", padding: "1rem", background: "var(--input-bg)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent)" }}>{c.code}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dark-sub)" }}>{c.credits} Cr</span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-dark)" }}>{c.title}</h4>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel-card">
              <div className="panel-card-header">
                <h3>Upcoming Deadlines</h3>
              </div>
              <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[
                  { task: "CS301 Project Phase 1", due: "Tomorrow, 11:59 PM", status: "pending" },
                  { task: "MGT201 Case Study", due: "Friday, 5:00 PM", status: "pending" },
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--divider-color)" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-dark)" }}>{t.task}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--error, #dc2626)" }}>Due: {t.due}</span>
                  </div>
                ))}
                <button onClick={() => navigate("/academic/lms")} className="submit-btn" style={{ margin: "0.5rem 0 0 0" }}>Go to LMS</button>
              </div>
            </section>
          </div>
        </>
      )}

    </div>
  );
};

export default AcademicDashboardPage;
