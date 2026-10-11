import React, { useEffect, useState } from "react";
import { teacherService, type TeacherCourse, type TeacherStudent } from "../services/teacherService";
import { DataTable, type Column } from "../../../AcademicModule/components/common/DataTable";

const TeacherCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<TeacherCourse | null>(null);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await teacherService.getMyCourses();
      if (res.success) setCourses(res.data);
    } catch (error) {
      console.error("Failed to load courses", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (courseId: number) => {
    try {
      setLoadingStudents(true);
      const res = await teacherService.getCourseStudents(courseId);
      if (res.success) setStudents(res.data);
    } catch (error) {
      console.error("Failed to load students", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSelectCourse = (course: TeacherCourse) => {
    setSelectedCourse(course);
    fetchStudents(course.id);
  };

  const studentColumns: Column<TeacherStudent>[] = [
    { key: "reg_no", header: "Reg No", render: (r) => r.reg_no || "-" },
    { key: "name", header: "Name", render: (r) => <span className="font-semibold text-[var(--text-dark)]">{r.first_name} {r.last_name}</span> },
    { key: "email", header: "Email", render: (r) => <span className="text-[var(--text-muted)]">{r.email}</span> },
  ];

  const courseColumns: Column<TeacherCourse>[] = [
    { key: "subject_code", header: "Course Code", render: (course) => <span className="teacher-course-code">{course.subject_code || "-"}</span> },
    { key: "name", header: "Course Name", render: (course) => <span className="teacher-course-name">{course.name || "-"}</span> },
    { key: "credit_hours", header: "Credit Hours", align: "center", render: (course) => course.credit_hours ?? "-" },
    { key: "semester", header: "Semester", align: "center", render: (course) => course.semester ? `Semester ${course.semester}` : "-" },
    { key: "number_of_students", header: "Number of Students", align: "center", render: (course) => course.number_of_students ?? 0 },
    { key: "status", header: "Status", align: "center", render: (course) => <span className={`teacher-course-status teacher-course-status-${String(course.status || "inactive").toLowerCase()}`}>{course.status || "-"}</span> },
    { key: "actions", header: "", align: "right", render: (course) => <button type="button" className="teacher-course-action" onClick={() => handleSelectCourse(course)}>View Students</button> },
  ];

  useEffect(() => {
    void Promise.resolve().then(fetchCourses);
  }, []);

  return (
    <div className="teacher-courses-page" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="panel-card-header" style={{ marginBottom: "0.5rem" }}>
        <div>
          <h2 className="topbar-title" style={{ fontSize: "1.4rem" }}>My Courses</h2>
          <p className="topbar-date">View your assigned courses and enrolled students</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading courses...</div>
      ) : (
        <>
          <div className="panel-card teacher-course-list-panel">
            <div className="panel-card-header">
              <div>
                <h3>Course List</h3>
                <p className="teacher-course-list-caption">Your assigned courses and current enrollment details</p>
              </div>
            </div>
            <DataTable columns={courseColumns} data={courses} loading={loading} emptyMessage="No courses assigned." />
          </div>

          {selectedCourse && <div className="panel-card" style={{ minHeight: "400px" }}>
            <>
                <div className="panel-card-header">
                  <div>
                    <h3>{selectedCourse.name}</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      Course Code: {selectedCourse.subject_code} &bull; Students Enrolled
                    </p>
                  </div>
                </div>
                <div style={{ padding: "1rem" }}>
                  <DataTable 
                    columns={studentColumns} 
                    data={students} 
                    loading={loadingStudents}
                  />
                </div>
            </>
          </div>}
        </>
      )}
    </div>
  );
};

export default TeacherCoursesPage;
