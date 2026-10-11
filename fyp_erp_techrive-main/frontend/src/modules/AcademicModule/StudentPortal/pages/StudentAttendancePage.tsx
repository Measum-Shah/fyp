import React, { useState, useEffect } from "react";
import { StudentAPI } from "../services/api";
import { DataTable } from "../../components/common/DataTable";

const StudentAttendancePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"attendance" | "timetable">("attendance");

  useEffect(() => {
    Promise.all([StudentAPI.getAttendance(), StudentAPI.getTimetable()])
      .then(([attRes, ttRes]) => { setData(attRes.data.data); setTimetable(ttRes.data.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex flex-col gap-6 animate-pulse"><div className="panel-card" style={{height:400}}/></div>;

  const summary = data?.summary || {};
  const records = data?.records || [];
  const absent = summary.total_classes - summary.present_classes;
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday"];

  const statusBadge = (val: string) => {
    const isPresent = val === "P" || val === "Present";
    const isLeave = val === "L" || val === "Leave";
    const bg = isPresent ? "var(--success-bg)" : isLeave ? "var(--gold-light)" : "var(--error-bg)";
    const color = isPresent ? "var(--success)" : isLeave ? "var(--text-dark)" : "var(--error)";
    const border = isPresent ? "var(--success-border)" : isLeave ? "var(--gold)" : "var(--error-border)";
    const label = isPresent ? "Present" : isLeave ? "Leave" : "Absent";
    return <span className="inline-block text-xs font-semibold" style={{padding:"4px 8px", borderRadius:"6px", background:bg,color,border:`1px solid ${border}`}}>{label}</span>;
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{color: "var(--text-dark)"}}>Timetable & Attendance</h1>

      {/* Summary Stats */}
      <div className="teacher-stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-value">{(summary.percentage ?? 0).toFixed(1)}%</div>
          <div className="stat-label">Overall Attendance</div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="stat-value">{summary.present_classes ?? 0}</div>
          <div className="stat-label">Classes Present</div>
        </div>
        <div className="stat-card stat-card-gold">
          <div className="stat-value">{absent}</div>
          <div className="stat-label">Classes Absent/Leave</div>
        </div>
        <div className="stat-card stat-card-purple">
          <div className="stat-value">{summary.total_classes ?? 0}</div>
          <div className="stat-label">Total Classes</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{background:"var(--input-bg)",width:"fit-content"}}>
        {(["attendance","timetable"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="text-sm font-semibold transition-all" style={{
            padding:"8px 16px", borderRadius:"6px",
            background: tab === t ? "var(--accent)" : "transparent",
            color: tab === t ? "#fff" : "var(--text-secondary)",
          }}>{t === "attendance" ? "Attendance History" : "Class Timetable"}</button>
        ))}
      </div>

      {tab === "attendance" ? (
        <div className="panel-card">
          <div className="panel-card-header"><h3>Attendance Records</h3></div>
          <div className="p-4">
            <DataTable 
              columns={[
                { key: "class_date", header: "Date", render: (r: any) => r.class_date ? new Date(r.class_date).toLocaleDateString() : "—" },
                { key: "day", header: "Day" },
                { key: "course_id", header: "Course ID", render: (r: any) => r.course_id || "—" },
                { key: "attendance", header: "Status", render: (r: any) => statusBadge(r.attendance) }
              ]}
              data={records}
            />
          </div>
        </div>
      ) : (
        <div className="panel-card">
          <div className="panel-card-header"><h3>Weekly Timetable</h3></div>
          <div className="p-4">
            <DataTable 
              columns={[
                { key: "day", header: "Day" },
                { key: "subject_id", header: "Subject ID" },
                { key: "teacher_id", header: "Teacher ID" },
                { key: "room_id", header: "Room ID", render: (r: any) => r.room_id || "—" }
              ]}
              data={timetable}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendancePage;
