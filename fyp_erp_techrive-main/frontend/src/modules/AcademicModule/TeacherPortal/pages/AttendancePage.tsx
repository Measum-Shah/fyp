import React, { useEffect, useState } from "react";
import { teacherService, type AttendanceAnalytics, type StudentAttendanceRecord, type TeacherCourse } from "../services/teacherService";

const today = () => new Date().toISOString().slice(0, 10);

const AttendancePage: React.FC = () => {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [courseId, setCourseId] = useState("");
  const [classDate, setClassDate] = useState(today);
  const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
  const [statuses, setStatuses] = useState<Record<number, StudentAttendanceRecord["attendance"]>>({});
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null);
  const [view, setView] = useState<"mark" | "analytics">("mark");
  const [loading, setLoading] = useState(true);
  const [savingStudent, setSavingStudent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void Promise.resolve().then(async () => {
      try {
        const [courseResponse, analyticsResponse] = await Promise.all([
          teacherService.getMyCourses(),
          teacherService.getAttendanceAnalytics()
        ]);
        setCourses(courseResponse.data);
        // Backend may return an empty array [] instead of an analytics object — guard against that
        const rawAnalytics = analyticsResponse.data;
        if (rawAnalytics && !Array.isArray(rawAnalytics) && typeof rawAnalytics === "object" && rawAnalytics.courses) {
          setAnalytics(rawAnalytics);
        } else {
          setAnalytics({
            required_percentage: 75,
            courses: [],
            students_below_threshold: [],
            most_attended_course: null,
            least_attended_course: null,
          });
        }
        if (courseResponse.data[0]) setCourseId(String(courseResponse.data[0].id));
      } catch {
        setError("Attendance data could not be loaded.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!courseId || !classDate || view !== "mark") return;
    void Promise.resolve().then(() => {
      setLoading(true);
      return teacherService.getAttendance(Number(courseId), classDate);
    })
      .then((response) => {
        setRecords(response.data);
        setStatuses(Object.fromEntries(response.data.map((record) => [record.student_id, record.attendance])));
        setError(null);
      })
      .catch(() => setError("Attendance records could not be loaded."))
      .finally(() => setLoading(false));
  }, [courseId, classDate, view]);

  const saveStatus = async (record: StudentAttendanceRecord) => {
    const attendance = statuses[record.student_id];
    if (!attendance || attendance === "Not Marked") return;
    setSavingStudent(record.student_id);
    setNotice(null);
    try {
      await teacherService.saveAttendance({ student_id: record.student_id, course_id: record.course_id, class_date: classDate, attendance });
      setRecords((current) => current.map((item) => item.student_id === record.student_id ? { ...item, attendance } : item));
      setNotice(`${record.student_name}'s attendance was saved.`);
      const response = await teacherService.getAttendanceAnalytics();
      setAnalytics(response.data);
    } catch {
      setError("Attendance could not be saved.");
    } finally {
      setSavingStudent(null);
    }
  };

  return (
    <div className="teacher-attendance-page">
      <header className="teacher-attendance-header">
        <div>
          <h1 className="teacher-attendance-title">Attendance Management</h1>
          <p className="teacher-attendance-subtitle">Mark attendance and monitor course attendance performance.</p>
        </div>
        <div className="teacher-attendance-tabs" role="tablist" aria-label="Attendance views">
          <button type="button" className={view === "mark" ? "active" : ""} onClick={() => setView("mark")}>Mark Attendance</button>
          <button type="button" className={view === "analytics" ? "active" : ""} onClick={() => setView("analytics")}>Attendance Analytics</button>
        </div>
      </header>

      {error && <div className="teacher-attendance-message error" role="alert">{error}</div>}
      {notice && <div className="teacher-attendance-message success" role="status">{notice}</div>}

      {view === "mark" ? (
        <section className="teacher-attendance-panel">
          <div className="teacher-attendance-filters">
            <label>Course<select value={courseId} onChange={(event) => setCourseId(event.target.value)} disabled={loading}><option value="">Select course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.subject_code || "Course"} - {course.name}</option>)}</select></label>
            <label>Date<input type="date" value={classDate} onChange={(event) => setClassDate(event.target.value)} disabled={loading} /></label>
          </div>
          <div className="teacher-attendance-table-wrap">
            <table className="teacher-attendance-table">
              <thead><tr><th>Registration No.</th><th>Student</th><th>Attendance</th><th>Action</th></tr></thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.student_id}>
                    <td>{record.reg_no || "-"}</td>
                    <td className="teacher-attendance-student">{record.student_name}</td>
                    <td><select value={statuses[record.student_id] || "Not Marked"} onChange={(event) => setStatuses((current) => ({ ...current, [record.student_id]: event.target.value as StudentAttendanceRecord["attendance"] }))}><option value="Not Marked">Not Marked</option><option value="Present">Present</option><option value="Absent">Absent</option><option value="Leave">Leave</option></select></td>
                    <td><button type="button" className="teacher-attendance-save" onClick={() => saveStatus(record)} disabled={savingStudent === record.student_id || statuses[record.student_id] === "Not Marked"}>{savingStudent === record.student_id ? "Saving..." : record.id ? "Edit" : "Save"}</button></td>
                  </tr>
                ))}
                {!loading && records.length === 0 && <tr><td colSpan={4} className="teacher-attendance-empty">Select a course with enrolled students to mark attendance.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="teacher-attendance-analytics">
          <div className="teacher-attendance-threshold">Warning threshold: <strong>{analytics?.required_percentage ?? 75}%</strong></div>
          <div className="teacher-attendance-analytics-grid">
            <div className="teacher-attendance-panel"><h2>Course Attendance Percentage</h2>{analytics?.courses.length ? analytics.courses.map((course) => <div className="teacher-attendance-progress" key={course.course_id}><div><span>{course.course_name}</span><strong>{course.attendance_percentage}%</strong></div><progress max="100" value={course.attendance_percentage} /></div>) : <p className="teacher-attendance-empty">No attendance records available.</p>}</div>
            <div className="teacher-attendance-panel"><h2>Most / Least Attended Courses</h2><div className="teacher-attendance-highlight"><span>Most attended</span><strong>{analytics?.most_attended_course?.course_name || "-"}</strong><b>{analytics?.most_attended_course?.attendance_percentage ?? 0}%</b></div><div className="teacher-attendance-highlight"><span>Least attended</span><strong>{analytics?.least_attended_course?.course_name || "-"}</strong><b>{analytics?.least_attended_course?.attendance_percentage ?? 0}%</b></div></div>
          </div>
          <div className="teacher-attendance-panel"><h2>Students Below Attendance Threshold</h2>{analytics?.students_below_threshold.length ? <div className="teacher-attendance-table-wrap"><table className="teacher-attendance-table"><thead><tr><th>Registration No.</th><th>Student</th><th>Attendance</th><th>Present / Total</th></tr></thead><tbody>{analytics.students_below_threshold.map((student) => <tr key={student.student_id}><td>{student.reg_no || "-"}</td><td className="teacher-attendance-student">{student.name}</td><td><span className="teacher-attendance-warning">{student.attendance_percentage}%</span></td><td>{student.present} / {student.total}</td></tr>)}</tbody></table></div> : <p className="teacher-attendance-empty">No students are below the required threshold.</p>}</div>
        </section>
      )}
    </div>
  );
};

export default AttendancePage;
