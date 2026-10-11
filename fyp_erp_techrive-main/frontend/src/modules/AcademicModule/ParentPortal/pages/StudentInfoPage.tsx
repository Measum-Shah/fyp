import React, { useState, useEffect } from "react";
import { parentService } from "../services/parentService";

/* ── SVG Icons for section headers ──────────────────────────────────────────── */
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconFather = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconMother = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconCheckCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// Format "2005-11-10" → "10 Nov 2005"
const formatDate = (val: string | null | undefined): string => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val; // fallback to raw string
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const StudentInfoPage: React.FC = () => {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentService.getStudentInfo()
      .then(res => { if (res.success) setStudent(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="parent-loading">
      <div className="parent-loading-spinner" />
      Loading student information...
    </div>
  );

  if (!student) return (
    <div className="parent-error">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      Student not found.
    </div>
  );

  const getEnrollmentStatus = () => {
    if (student.admission_status === "Registered") {
      return (
        <span className="parent-status-badge parent-status-badge--success">
          <IconCheckCircle /> Registered
        </span>
      );
    }
    if (student.admission_status === "Walk-in") {
      return (
        <span className="parent-status-badge parent-status-badge--warning">
          <IconClock /> Walk-in (Fee Pending)
        </span>
      );
    }
    return student.academic_status || "Pending";
  };

  const Section = ({ title, icon, items }: { title: string; icon: React.ReactNode; items: [string, string | React.ReactNode][] }) => (
    <div className="parent-info-section">
      <h3 className="parent-info-section__title">
        <span className="parent-info-section__icon">{icon}</span>
        {title}
      </h3>
      <div className="parent-info-section__grid">
        {items.map(([label, value]) => (
          <div key={label} className="parent-info-field">
            <div className="parent-info-field__label">{label}</div>
            <div className="parent-info-field__value">{value || "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="parent-student-info">
      {/* Page Header */}
      <div className="parent-page-header">
        <h2 className="parent-page-header__title">Student Information</h2>
        <p className="parent-page-header__subtitle">Detailed student profile and family information</p>
      </div>

      {/* Student Avatar Card */}
      <div className="parent-student-card">
        <div className="parent-student-card__avatar">
          {student.full_name?.charAt(0)?.toUpperCase() || "S"}
        </div>
        <div className="parent-student-card__info">
          <h3 className="parent-student-card__name">{student.full_name}</h3>
          <p className="parent-student-card__reg">
            {student.reg_no || student.walkin_reg_no || "No registration number"}
          </p>
          {student.program_name && (
            <span className="parent-student-card__program">{student.program_name}</span>
          )}
        </div>
      </div>

      {/* Personal Details */}
      <Section title="Personal Details" icon={<IconUser />} items={[
        ["Full Name",    student.full_name],
        ["Reg No",       student.reg_no || student.walkin_reg_no],
        ["Gender",       student.gender],
        ["Date of Birth", formatDate(student.date_of_birth)],
        ["Email",        student.email],
        ["Mobile",       student.mobile],
        ["Enrollment Status", getEnrollmentStatus()],
        ["Program",      student.program_name],
      ]} />

      {/* Father Info */}
      <Section title="Father Info" icon={<IconFather />} items={[
        ["Father Name",  student.father_name],
        ["Father Email", student.father_email],
        ["Father Phone", student.father_phone],
      ]} />

      {/* Mother Info */}
      <Section title="Mother Info" icon={<IconMother />} items={[
        ["Mother Name",  student.mother_name],
        ["Mother Email", student.mother_email],
        ["Mother Phone", student.mother_phone],
      ]} />
    </div>
  );
};

export default StudentInfoPage;
