import React, { useState, useEffect } from "react";
import { DataTable, type Column } from "../components/common/DataTable";
import { Modal } from "../components/common/Modal";
import { RoleGuard } from "../components/common/RoleGuard";
import { useRoleAccess } from "../hooks/useRoleAccess";
import { academicService } from "../services/academicService";
import { teacherService } from "../TeacherPortal/services/teacherService";
import { toast } from "./AcademicLayout";
import type { LearningMaterial, Assignment, StudentSubmission, MaterialType, Course } from "../types";

const MaterialTypeBadge: React.FC<{ type?: MaterialType | string }> = ({ type }) => {
  const rawType = (type || "lecture_note").toString().toLowerCase();
  const styles: Record<string, { bg: string; color: string; label: string; icon: string }> = {
    lecture_note: { bg: "rgba(59, 130, 246, 0.15)", color: "#2563eb", label: "Lecture Note", icon: "📄" },
    syllabus: { bg: "rgba(16, 185, 129, 0.15)", color: "#059669", label: "Syllabus", icon: "📑" },
    slide: { bg: "rgba(168, 85, 247, 0.15)", color: "#9333ea", label: "Slide", icon: "📊" },
    video: { bg: "rgba(244, 63, 94, 0.15)", color: "#e11d48", label: "Video", icon: "🎬" },
    learning_material: { bg: "rgba(245, 158, 11, 0.15)", color: "#d97706", label: "Material", icon: "📚" },
  };

  const meta = styles[rawType] || styles.lecture_note;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.2rem 0.6rem",
        borderRadius: "9999px",
        fontSize: "0.725rem",
        fontWeight: 600,
        background: meta.bg,
        color: meta.color,
      }}
    >
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
};

const LMSContentPage: React.FC = () => {
  const { isStudent, isFaculty, isAdmin, institutionType } = useRoleAccess();
  const canManage = isFaculty || isAdmin;

  // Active sub-tab
  const [tab, setTab] = useState<string>("materials");

  // Courses list
  const [courses, setCourses] = useState<Course[]>([]);

  // Materials state
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [materialFormData, setMaterialFormData] = useState<Partial<LearningMaterial>>({
    material_type: "lecture_note",
  });
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Assignments state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentFormData, setAssignmentFormData] = useState<Partial<Assignment>>({
    submission_type: "file",
    status: "published",
    max_score: 100,
  });

  // Submissions state (Faculty)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | "">("");
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<StudentSubmission | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(0);
  const [feedbackInput, setFeedbackInput] = useState<string>("");

  // Student Submission Modal
  const [studentSubmitModalOpen, setStudentSubmitModalOpen] = useState(false);
  const [targetAssignment, setTargetAssignment] = useState<Assignment | null>(null);
  const [studentSubmissionText, setStudentSubmissionText] = useState("");
  const [studentSelectedFile, setStudentSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);

  const [saving, setSaving] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number, type: "assignment" | "material" } | null>(null);
  const [loadingData, setLoadingData] = useState({ materials: true, assignments: true, submissions: false });

  useEffect(() => {
    void Promise.resolve().then(() => {
      setLoadingData(p => ({ ...p, materials: true, assignments: true }));
      const coursesRequest: Promise<Course[]> = isFaculty
        ? teacherService.getMyCourses().then((response) => {
            const mapped = response.data.map((course) => ({
              ...course,
              code: course.subject_code || undefined,
              title: course.name || undefined,
              semester_suggested: course.semester || undefined,
            }));
            return mapped as unknown as Course[];
          })
        : academicService.getCourses(undefined, institutionType);
      coursesRequest.then(setCourses).catch(() => {});
      const lmsInstitutionType = isFaculty ? undefined : institutionType;

      academicService.getMaterials(lmsInstitutionType)
        .then(setMaterials)
        .catch(() => toast.error("Error", "Failed to load learning materials."))
        .finally(() => setLoadingData(p => ({ ...p, materials: false })));

      academicService.getAssignments(lmsInstitutionType)
        .then((data) => {
          setAssignments(data);
          if (data && data.length > 0) setSelectedAssignmentId(data[0].id);
        })
        .catch(() => toast.error("Error", "Failed to load assignments."))
        .finally(() => setLoadingData(p => ({ ...p, assignments: false })));
    });
  }, [institutionType, isFaculty]);


  // Fetch submissions when selected assignment changes
  useEffect(() => {
    if (selectedAssignmentId) {
      void Promise.resolve().then(() => {
        setLoadingData(p => ({ ...p, submissions: true }));
        return academicService.getSubmissions(Number(selectedAssignmentId));
      })
        .then(setSubmissions)
        .catch(() => toast.error("Error", "Failed to load student submissions."))
        .finally(() => setLoadingData(p => ({ ...p, submissions: false })));
    }
  }, [selectedAssignmentId]);

  // Handle Save Material
  const handleSaveMaterial = async () => {
    if (!materialFormData.title || !materialFormData.course_id || (!selectedFile && !editingMaterialId)) {
      toast.error("Validation Error", "Please provide a title, course, and select a file.");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(20);

    const savePayload = async (fileUrl: string | undefined, fileSize: string | undefined) => {
      try {
        setUploadProgress(60);
        const payload = {
          ...materialFormData,
          institution_type: institutionType,
        };
        if (fileUrl) payload.file_url = fileUrl;
        if (fileSize) payload.file_size = fileSize;

        if (editingMaterialId) {
          const updated = await academicService.updateMaterial(editingMaterialId, payload as any);
          setMaterials((prev) => prev.map((m) => (m.id === editingMaterialId ? updated : m)));
          toast.success("Material Updated", `${updated.title} updated successfully.`);
        } else {
          const created = await academicService.uploadMaterial(payload as any);
          setMaterials((prev) => [created, ...prev]);
          toast.success("Material Uploaded", `${created.title} added successfully.`);
        }
        setUploadProgress(100);
        setMaterialModalOpen(false);
        setSelectedFile(null);
        setMaterialFormData({ material_type: "lecture_note" });
        setEditingMaterialId(null);
      } catch (error: any) {
        console.error(error);
        const errMsg = error.response?.data?.message || error.message || "Unknown error";
        toast.error("Upload Failed", errMsg);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    };

    if (selectedFile) {
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          savePayload(reader.result as string, (selectedFile.size / (1024 * 1024)).toFixed(2) + " MB");
        };
        reader.readAsDataURL(selectedFile);
      } catch (err: any) {
        toast.error("Upload Failed", "Could not process file.");
        setIsUploading(false);
        setUploadProgress(0);
      }
    } else {
      savePayload(undefined, undefined);
    }
  };

  // Handle Save Assignment
  const handleSaveAssignment = async () => {
    if (!assignmentFormData.title || !assignmentFormData.course_id || !assignmentFormData.due_date) {
      setAssignmentError("Please provide a title, course, and due date.");
      toast.error("Validation Error", "Please provide a title, course, and due date.");
      return;
    }
    setAssignmentError(null);
    setSaving(true);
    try {
      const rawDate = assignmentFormData.due_date || (assignmentFormData as any).deadline || "";
      // Ensure deadline is a full ISO string (datetime-local gives "YYYY-MM-DDTHH:MM" without seconds)
      let deadlineStr = String(rawDate);
      if (deadlineStr && !deadlineStr.includes("Z") && deadlineStr.split(":").length === 2) {
        deadlineStr += ":00";
      }
      const payload: any = {
        ...assignmentFormData,
        institution_type: institutionType,
        deadline: deadlineStr,
      };
      // Remove frontend-only fields that backend doesn't expect
      delete payload.due_date;
      delete payload.course_name;
      delete payload.submissions_count;
      if (editingAssignmentId) {
        const updated = await academicService.updateAssignment(editingAssignmentId, payload as any);
        setAssignments((prev) => prev.map((a) => (a.id === editingAssignmentId ? { ...a, ...updated } : a)));
        toast.success("Assignment Updated", `${updated.title} updated successfully.`);
      } else {
        const created = await academicService.createAssignment(payload as any);
        setAssignments((prev) => [created, ...prev]);
        toast.success("Assignment Created", `${created.title} published.`);
      }
      setAssignmentModalOpen(false);
      setAssignmentFormData({ submission_type: "file", status: "published", max_score: 100 });
      setEditingAssignmentId(null);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Failed to save assignment.";
      setAssignmentError(message);
      toast.error("Save Failed", message);
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete (Generic for Assignment & Material)
  const confirmDelete = (id: number, type: "assignment" | "material") => {
    setItemToDelete({ id, type });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    const { id, type } = itemToDelete;
    setSaving(true);
    try {
      if (type === "assignment") {
        await academicService.deleteAssignment(id);
        setAssignments((prev) => prev.filter((a) => a.id !== id));
        toast.success("Assignment Deleted", "The assignment was removed successfully.");
      } else if (type === "material") {
        await academicService.deleteMaterial(id);
        setMaterials((prev) => prev.filter((m) => m.id !== id));
        toast.success("Material Deleted", "The learning material was removed successfully.");
      }
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error("Deletion Failed", err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle Grade Submission
  const handleGradeSubmission = async () => {
    if (!activeSubmission) return;
    setSaving(true);
    try {
      const updated = await academicService.gradeSubmission(activeSubmission.id, gradeInput, feedbackInput);
      setSubmissions((prev) => prev.map((s) => (s.id === activeSubmission.id ? { ...s, ...updated } : s)));
      toast.success("Grade Saved", "Student submission graded.");
      setGradeModalOpen(false);
    } catch (err: any) {
      toast.error("Grading Failed", err.message);
    }
    setSaving(false);
  };

  // Handle Student Submit Assignment
  const handleStudentSubmit = async () => {
    if (!targetAssignment) return;
    setIsSubmitting(true);
    setSubmitProgress(20);

    const submitPayload = async (fileUrl: string | null) => {
      try {
        setSubmitProgress(70);
        await academicService.submitAssignment({
          assignment_id: targetAssignment.id,
          submission_text: studentSubmissionText,
          file_url: fileUrl || undefined,
        } as any);
        
        setSubmitProgress(100);
        toast.success("Assignment Submitted", "Your work was turned in successfully!");
        setStudentSubmitModalOpen(false);
        setStudentSelectedFile(null);
        
        // Refresh assignments to update student_submission status
        academicService.getAssignments(institutionType).then(setAssignments).catch(() => {});
      } catch (err: any) {
        toast.error("Submission Failed", err.message);
      } finally {
        setIsSubmitting(false);
        setSubmitProgress(0);
      }
    };

    if (studentSelectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        submitPayload(reader.result as string);
      };
      reader.readAsDataURL(studentSelectedFile);
    } else {
      submitPayload(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isStudentSubmit = false) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for base64 uploads
        toast.error("File too large", "Maximum file size is 5MB for direct base64 uploads.");
        return;
      }
      if (isStudentSubmit) {
        setStudentSelectedFile(file);
      } else {
        setSelectedFile(file);
      }
    }
  };

  // Columns for Materials Table
  const materialColumns: Column<LearningMaterial>[] = [
    { key: "title", header: "Title", render: (r) => <span className="font-semibold text-[var(--text-dark)]">{r.title}</span> },
    { key: "material_type", header: "Type", render: (r) => <MaterialTypeBadge type={r.material_type || (r as any).type} />, align: "center" },
    {
      key: "course_name",
      header: "Course",
      render: (r) => {
        if (r.course_name) return r.course_name;
        if (r.course_id) {
          const match = courses.find((c) => c.id === Number(r.course_id));
          if (match) return `${match.code} — ${match.title}`;
        }
        return "";
      },
    },
    { key: "description", header: "Description", render: (r) => <span style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)" }}>{(r as any).description || ""}</span> },
    { key: "file_size", header: "File Size", render: (r) => r.file_size || "", align: "center" },
    { key: "uploaded_by_name", header: "Uploaded By", render: (r) => r.uploaded_by_name || r.uploader_name || "" },
    {
      key: "created_at",
      header: "Uploaded Date",
      render: (r) => (
        <span style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)" }}>
          {(r as any).created_at ? new Date((r as any).created_at).toLocaleDateString() : ""}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      align: "center",
      render: (r) => (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              if (r.file_url) {
                const a = document.createElement("a");
                a.href = r.file_url.startsWith("http") || r.file_url.startsWith("data:") || r.file_url.startsWith("/")
                  ? r.file_url
                  : `/${r.file_url}`;
                a.download = r.file_name || `${r.title.replace(/\s+/g, "_")}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toast.success("Download Started", `Downloading ${r.title}...`);
              } else {
                toast.error("Download Failed", "No valid file URL available.");
              }
            }}
            style={{ padding: "0.35rem", border: "none", background: "transparent", cursor: "pointer", color: "#059669", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.15s", fontSize: "0.75rem", fontWeight: 600 }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            title="Download"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          {canManage && (
            <>
              <button
                title="Edit Material"
                aria-label="Edit Material"
                onClick={() => {
                  setMaterialFormData({
                    title: r.title,
                    description: r.description,
                    course_id: r.course_id,
                    material_type: r.material_type || (r as any).type,
                  });
                  setEditingMaterialId(r.id);
                  setMaterialModalOpen(true);
                }}
                style={{ padding: "0.35rem", border: "none", background: "transparent", cursor: "pointer", color: "var(--accent)", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                title="Delete Material"
                aria-label="Delete Material"
                onClick={() => confirmDelete(r.id, "material")}
                style={{ padding: "0.35rem", border: "none", background: "transparent", cursor: "pointer", color: "var(--error, #dc2626)", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Columns for Assignments Table
  const assignmentColumns: Column<Assignment>[] = [
    { key: "title", header: "Assignment Title", render: (r) => <span className="font-semibold text-[var(--text-dark)]">{r.title}</span> },
    { key: "course_name", header: "Course", render: (r) => r.course_name || "—" },
    {
      key: "due_date",
      header: "Deadline",
      render: (r) => {
        const dateVal = r.due_date || (r as any).deadline;
        const isPast = dateVal ? new Date(dateVal) < new Date() : false;
        return (
          <span className={`text-xs font-semibold ${isPast ? "text-[var(--error, #dc2626)]" : "text-[var(--text-dark)]"}`}>
            {dateVal ? new Date(dateVal).toLocaleString() : "—"}
          </span>
        );
      },
    },
    { key: "max_score", header: "Max Points", align: "center" },
    { key: "submissions_count", header: "Submissions", align: "center", render: (r) => r.submissions_count ?? 0 },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (r) => {
        const isDraft = r.status === "draft";
        return (
          <span 
            style={{
              padding: "0.2rem 0.6rem",
              borderRadius: "9999px",
              fontSize: "0.7rem",
              fontWeight: 600,
              background: isDraft ? "rgba(100, 116, 139, 0.15)" : "var(--success-bg, rgba(16,185,129,0.15))",
              color: isDraft ? "var(--text-dark-sub, #64748b)" : "var(--success, #059669)"
            }}
          >
            {r.status || "published"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (r) => (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", alignItems: "center" }}>
          <button
            onClick={() => {
              setEditingAssignmentId(r.id);
              // Format date for datetime-local input (needs "YYYY-MM-DDTHH:MM" format)
              const rawDt = r.due_date || r.deadline || "";
              let dtLocal = "";
              if (rawDt) {
                const d = new Date(rawDt);
                if (!isNaN(d.getTime())) {
                  dtLocal = d.getFullYear() + "-" +
                    String(d.getMonth() + 1).padStart(2, "0") + "-" +
                    String(d.getDate()).padStart(2, "0") + "T" +
                    String(d.getHours()).padStart(2, "0") + ":" +
                    String(d.getMinutes()).padStart(2, "0");
                } else {
                  dtLocal = String(rawDt).replace("Z", "").slice(0, 16);
                }
              }
              setAssignmentFormData({
                title: r.title,
                description: r.description,
                instructions: r.instructions,
                course_id: r.course_id,
                due_date: dtLocal,
                max_score: r.max_score,
                submission_type: r.submission_type,
                visibility: r.visibility,
                status: r.status,
              });
              setAssignmentModalOpen(true);
            }}
            title="Edit assignment"
            aria-label="Edit assignment"
            style={{ padding: "0.35rem", border: "none", background: "transparent", cursor: "pointer", color: "var(--accent)", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={() => confirmDelete(r.id, "assignment")}
            title="Delete assignment"
            aria-label="Delete assignment"
            style={{ padding: "0.35rem", border: "none", background: "transparent", cursor: "pointer", color: "var(--error, #dc2626)", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  // Columns for Submissions Table
  const submissionColumns: Column<StudentSubmission>[] = [
    {
      key: "student_name",
      header: "Student Name",
      render: (r) => (
        <span style={{ fontWeight: 600, color: "var(--text-dark)" }}>{r.student_name || "—"}</span>
      ),
    },
    {
      key: "submitted_at",
      header: "Submitted At",
      render: (r) => (
        <span style={{ fontSize: "0.82rem", color: "var(--text-dark-sub)" }}>
          {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (r) => {
        const statusMap: Record<string, { bg: string; color: string; border: string }> = {
          submitted: { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" },
          graded:    { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "rgba(16, 185, 129, 0.3)" },
          late:      { bg: "rgba(244, 63, 94, 0.12)",  color: "#f43f5e", border: "rgba(244, 63, 94, 0.3)" },
        };
        const style = statusMap[r.status] || statusMap.submitted;
        const label = r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "—";

        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.2rem 0.7rem",
              borderRadius: "9999px",
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
              background: style.bg,
              color: style.color,
              border: `1px solid ${style.border}`,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        );
      },
    },
    {
      key: "grade",
      header: "Grade",
      align: "center",
      render: (r) => (
        r.grade !== undefined && r.grade !== null
          ? <span style={{ fontWeight: 700, color: "var(--accent)" }}>{r.grade} / 100</span>
          : <span style={{ color: "var(--text-dark-sub)" }}>—</span>
      ),
    },
    {
      key: "actions",
      header: "Grade",
      align: "center",
      render: (r) => (
        <button
          onClick={() => {
            setActiveSubmission(r);
            setGradeInput(r.grade || 0);
            setFeedbackInput(r.feedback || "");
            setGradeModalOpen(true);
          }}
          className="submit-btn"
          style={{ width: "auto", padding: "0.35rem 0.85rem", fontSize: "0.78rem", margin: 0 }}
        >
          {r.status === "graded" ? "Re-grade" : "Grade"}
        </button>
      ),
    },
  ];

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Top Header */}
      <div className="panel-card-header" style={{ marginBottom: "1.25rem" }}>
        <div>
          <h2 className="topbar-title" style={{ fontSize: "1.4rem" }}>LMS Content & Assignments</h2>
          <p className="topbar-date">Manage learning materials, coursework, and submission evaluations</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "1.25rem", background: "var(--input-bg)", padding: "4px", borderRadius: "8px", width: "fit-content" }}>
        <button
          onClick={() => setTab("materials")}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.85rem",
            fontWeight: tab === "materials" ? 700 : 600,
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            background: tab === "materials" ? "var(--card-bg)" : "transparent",
            color: tab === "materials" ? "var(--text-dark)" : "var(--text-dark-sub)",
            boxShadow: tab === "materials" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s"
          }}
        >
          Learning Materials
        </button>
        <button
          onClick={() => setTab("assignments")}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.85rem",
            fontWeight: tab === "assignments" ? 700 : 600,
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            background: tab === "assignments" ? "var(--card-bg)" : "transparent",
            color: tab === "assignments" ? "var(--text-dark)" : "var(--text-dark-sub)",
            boxShadow: tab === "assignments" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s"
          }}
        >
          {isStudent ? "My Assignments" : "Assignments"}
        </button>
        {!isStudent && (
          <button
            onClick={() => setTab("submissions")}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.85rem",
              fontWeight: tab === "submissions" ? 700 : 600,
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              background: tab === "submissions" ? "var(--card-bg)" : "transparent",
              color: tab === "submissions" ? "var(--text-dark)" : "var(--text-dark-sub)",
              boxShadow: tab === "submissions" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s"
            }}
          >
            Student Submissions
          </button>
        )}
      </div>

      {/* TAB 1: LEARNING MATERIALS */}
      {tab === "materials" && (
        <div className="panel-card">
          <DataTable
            columns={materialColumns}
            data={materials}
            loading={loadingData.materials}
            searchQuery=""
            onSearchChange={() => {}}
            page={1}
            totalPages={1}
            totalCount={materials.length}
            onPageChange={() => {}}
            itemsPerPage={10}
            onItemsPerPageChange={() => {}}
            actionButton={
              <RoleGuard allowedRoles={["admin", "faculty"]}>
                <button
                  onClick={() => setMaterialModalOpen(true)}
                  className="submit-btn"
                  style={{ width: "auto", padding: "0.5rem 1rem", fontSize: "0.85rem", margin: 0 }}
                >
                  + Upload Material
                </button>
              </RoleGuard>
            }
          />
        </div>
      )}

      {/* TAB 2: ASSIGNMENTS */}
      {tab === "assignments" && (
        <div>
          {!isStudent ? (
            <div className="panel-card">
              <DataTable
                columns={assignmentColumns}
                data={assignments}
                loading={loadingData.assignments}
                searchQuery=""
                onSearchChange={() => {}}
                page={1}
                totalPages={1}
                totalCount={assignments.length}
                onPageChange={() => {}}
                itemsPerPage={10}
                onItemsPerPageChange={() => {}}
                actionButton={
                  <button
                    onClick={() => {
                      setEditingAssignmentId(null);
                      setAssignmentFormData({ submission_type: "file", status: "published", max_score: 100 });
                      setAssignmentModalOpen(true);
                    }}
                    className="submit-btn"
                    style={{ width: "auto", padding: "0.5rem 1rem", fontSize: "0.85rem", margin: 0 }}
                  >
                    + Create Assignment
                  </button>
                }
              />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
              {assignments.map((ass) => (
                <div key={ass.id} className="panel-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", background: "rgba(29, 111, 191, 0.1)", color: "var(--accent)", borderRadius: "6px" }}>
                        {ass.course_name || "Course Assignment"}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "var(--error, #dc2626)", fontWeight: 600 }}>
                        Due: {ass.due_date ? new Date(ass.due_date).toLocaleDateString() : "—"}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "0.35rem" }}>{ass.title}</h3>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-dark-sub)", lineHeight: 1.5 }}>{ass.instructions || "Complete and submit homework task."}</p>
                  </div>
                  <div style={{ paddingTop: "1rem", marginTop: "1rem", borderTop: "1px solid var(--divider-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)", fontWeight: 600 }}>Points: {ass.max_score}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {ass.student_submission && (
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "4px", backgroundColor: ass.student_submission.status === "graded" ? "var(--success-bg, rgba(16,185,129,0.15))" : "rgba(59, 130, 246, 0.15)", color: ass.student_submission.status === "graded" ? "var(--success, #059669)" : "#2563eb" }}>
                          {ass.student_submission.status === "graded" ? `Graded: ${ass.student_submission.grade}/${ass.max_score}` : "Submitted"}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setTargetAssignment(ass);
                          setStudentSubmissionText(ass.student_submission?.submission_text || "");
                          setStudentSubmitModalOpen(true);
                        }}
                        disabled={ass.student_submission?.status === "graded"}
                        className="submit-btn"
                        style={{ width: "auto", padding: "0.4rem 0.85rem", fontSize: "0.78rem", margin: 0, opacity: ass.student_submission?.status === "graded" ? 0.5 : 1 }}
                      >
                        {ass.student_submission ? (ass.student_submission.status === "graded" ? "View Only" : "Resubmit") : "Submit"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STUDENT SUBMISSIONS (FACULTY VIEW) */}
      {tab === "submissions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="panel-card" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p style={{ fontSize: "0.82rem", color: "var(--text-dark-sub)", margin: 0 }}>Select an assignment to view and evaluate student submissions.</p>
            </div>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(Number(e.target.value))}
              className="field-input"
              style={{ width: "auto", minWidth: "280px", maxWidth: "100%", padding: "0.5rem 1rem", margin: 0 }}
            >
              {assignments.length > 0 ? (
                assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.course_name})
                  </option>
                ))
              ) : (
                <option value="" disabled>No assignments available</option>
              )}
            </select>
          </div>

          <div className="panel-card" style={{ padding: 0, overflow: "hidden" }}>
            <DataTable
              columns={submissionColumns}
              data={submissions}
              loading={loadingData.submissions}
              searchQuery=""
              onSearchChange={() => {}}
              page={1}
              totalPages={1}
              totalCount={submissions.length}
              onPageChange={() => {}}
              itemsPerPage={10}
              onItemsPerPageChange={() => {}}
              emptyMessage="No student submissions for this assignment yet."
            />
          </div>
        </div>
      )}

      {/* MODAL: Upload Learning Material */}
      <Modal
        isOpen={materialModalOpen}
        onClose={() => !isUploading && setMaterialModalOpen(false)}
        title={editingMaterialId ? "Edit Learning Material" : "Upload Learning Material"}
        maxWidth="md"
        footer={
          <>
            <button onClick={() => setMaterialModalOpen(false)} disabled={isUploading} className="submit-btn" style={{ background: "var(--input-bg)", color: "var(--text-dark)", border: "1px solid var(--input-border)", width: "auto" }}>
              Cancel
            </button>
            <button onClick={handleSaveMaterial} disabled={isUploading} className="submit-btn" style={{ width: "auto" }}>
              {isUploading ? (editingMaterialId ? "Saving..." : "Uploading...") : (editingMaterialId ? "Save Changes" : "Upload")}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="field-label">Material Title *</label>
            <input
              type="text"
              value={materialFormData.title || ""}
              onChange={(e) => setMaterialFormData((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Chapter 1 Lecture Notes"
              className="field-input"
              disabled={isUploading}
            />
          </div>
          <div>
            <label className="field-label">Type *</label>
            <select
              value={materialFormData.material_type || "lecture_note"}
              onChange={(e) => setMaterialFormData((p) => ({ ...p, material_type: e.target.value as MaterialType }))}
              className="field-input"
              disabled={isUploading}
            >
              <option value="lecture_note">Lecture Note</option>
              <option value="syllabus">Syllabus</option>
              <option value="slide">Presentation Slide</option>
              <option value="video">Video Recording</option>
              <option value="learning_material">General Material</option>
            </select>
          </div>
          <div>
            <label className="field-label">Course *</label>
            <select
              value={materialFormData.course_id || ""}
              onChange={(e) => setMaterialFormData((p) => ({ ...p, course_id: Number(e.target.value) }))}
              className="field-input"
              disabled={isUploading}
            >
              <option value="">Select course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="field-label">Description</label>
            <textarea
              value={(materialFormData as any).description || ""}
              onChange={(e) => setMaterialFormData((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Brief description of this material (optional)..."
              className="field-input"
              style={{ resize: "none" }}
              disabled={isUploading}
            />
          </div>
          
          <div>
            <label className="field-label">File Upload *</label>
            <div style={{ position: "relative" }}>
              <input
                type="file"
                onChange={(e) => handleFileSelect(e)}
                disabled={isUploading}
                style={{
                  width: "100%", padding: "0.65rem 1rem", fontSize: "0.875rem", borderRadius: "10px",
                  border: "1px dashed var(--accent)", background: "rgba(29, 111, 191, 0.05)",
                  color: "var(--text-dark)", cursor: "pointer",
                }}
              />
            </div>
            {selectedFile && <p style={{ fontSize: "0.75rem", color: "var(--text-dark-sub)", marginTop: "0.4rem" }}>Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
          </div>

          {isUploading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dark)" }}>
                <span>Uploading file to server...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "var(--input-border)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "var(--success, #059669)", width: `${uploadProgress}%`, transition: "all 0.3s ease" }} />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL: Create / Edit Assignment */}
      <Modal
        isOpen={assignmentModalOpen}
        onClose={() => {
          setAssignmentModalOpen(false);
          setEditingAssignmentId(null);
          setAssignmentFormData({ submission_type: "file", status: "published", max_score: 100 });
        }}
        title={editingAssignmentId ? "Edit Assignment" : "Create Assignment"}
        maxWidth="md"
        footer={
          <>
            <button onClick={() => {
              setAssignmentModalOpen(false);
              setEditingAssignmentId(null);
              setAssignmentFormData({ submission_type: "file", status: "published", max_score: 100 });
            }} className="submit-btn" style={{ background: "var(--input-bg)", color: "var(--text-dark)", border: "1px solid var(--input-border)", width: "auto" }}>
              Cancel
            </button>
            <button onClick={handleSaveAssignment} disabled={saving} className="submit-btn" style={{ width: "auto" }}>
              {saving ? "Saving..." : editingAssignmentId ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {assignmentError && (
            <div role="alert" style={{ padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.45)", background: "rgba(239, 68, 68, 0.12)", color: "var(--error, #dc2626)", fontSize: "0.82rem" }}>
              {assignmentError}
            </div>
          )}
          <div>
            <label className="field-label">Assignment Title *</label>
            <input
              type="text"
              value={assignmentFormData.title || ""}
              onChange={(e) => setAssignmentFormData((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Lab Task 1 — Data Structures"
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Description / Instructions</label>
            <textarea
              value={assignmentFormData.description || ""}
              onChange={(e) => setAssignmentFormData((p) => ({ ...p, description: e.target.value, instructions: e.target.value }))}
              rows={3}
              placeholder="Provide detailed instructions for the assignment..."
              className="field-input"
              style={{ resize: "none" }}
            />
          </div>
          <div>
            <label className="field-label">Course *</label>
            <select
              value={assignmentFormData.course_id || ""}
              onChange={(e) => setAssignmentFormData((p) => ({ ...p, course_id: Number(e.target.value) }))}
              className="field-input"
            >
              <option value="">Select course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="field-label">Due Date *</label>
              <input
                type="datetime-local"
                value={assignmentFormData.due_date || ""}
                onChange={(e) => setAssignmentFormData((p) => ({ ...p, due_date: e.target.value, deadline: e.target.value }))}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Total Marks *</label>
              <input
                type="number"
                value={assignmentFormData.max_score || 100}
                onChange={(e) => setAssignmentFormData((p) => ({ ...p, max_score: Number(e.target.value) }))}
                className="field-input"
                min={0}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="field-label">Attachment (Optional)</label>
              <input
                type="file"
                onChange={(e) => {
                  // Just mock setting the attachment URL for UI purposes
                  if (e.target.files && e.target.files.length > 0) {
                    setAssignmentFormData((p) => ({ ...p, attachment_url: e.target.files![0].name }));
                  }
                }}
                className="field-input"
                style={{ padding: "0.4rem" }}
              />
            </div>
            <div>
              <label className="field-label">Visibility Status *</label>
              <select
                value={assignmentFormData.visibility || "published"}
                onChange={(e) => setAssignmentFormData((p) => ({ ...p, visibility: e.target.value as "published" | "draft", status: e.target.value as "published" | "draft" }))}
                className="field-input"
              >
                <option value="published">Published (Visible to students)</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL: Grade Submission */}
      <Modal
        isOpen={gradeModalOpen}
        onClose={() => setGradeModalOpen(false)}
        title={`Grade Submission — ${activeSubmission?.student_name}`}
        maxWidth="md"
        footer={
          <>
            <button onClick={() => setGradeModalOpen(false)} className="submit-btn" style={{ background: "var(--input-bg)", color: "var(--text-dark)", border: "1px solid var(--input-border)", width: "auto" }}>
              Cancel
            </button>
            <button onClick={handleGradeSubmission} disabled={saving} className="submit-btn" style={{ width: "auto" }}>
              Save Grade
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="field-label">Score (Out of 100) *</label>
            <input
              type="number"
              value={gradeInput}
              onChange={(e) => setGradeInput(Number(e.target.value))}
              max={100}
              min={0}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Feedback</label>
            <textarea
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              rows={3}
              placeholder="Provide constructive feedback for student..."
              className="field-input"
              style={{ resize: "none" }}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL: Student Submit Assignment */}
      <Modal
        isOpen={studentSubmitModalOpen}
        onClose={() => !isSubmitting && setStudentSubmitModalOpen(false)}
        title={`Submit ${targetAssignment?.title}`}
        maxWidth="md"
        footer={
          <>
            <button onClick={() => setStudentSubmitModalOpen(false)} disabled={isSubmitting} className="submit-btn" style={{ background: "var(--input-bg)", color: "var(--text-dark)", border: "1px solid var(--input-border)", width: "auto" }}>
              Cancel
            </button>
            <button onClick={handleStudentSubmit} disabled={isSubmitting} className="submit-btn" style={{ width: "auto" }}>
              {isSubmitting ? "Submitting..." : "Turn In"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="field-label">File Upload (Optional)</label>
            <div style={{ position: "relative" }}>
              <input
                type="file"
                onChange={(e) => handleFileSelect(e, true)}
                disabled={isSubmitting}
                style={{
                  width: "100%", padding: "0.65rem 1rem", fontSize: "0.875rem", borderRadius: "10px",
                  border: "1px dashed var(--accent)", background: "rgba(29, 111, 191, 0.05)",
                  color: "var(--text-dark)", cursor: "pointer",
                }}
              />
            </div>
            {studentSelectedFile && <p style={{ fontSize: "0.75rem", color: "var(--text-dark-sub)", marginTop: "0.4rem" }}>Selected: {studentSelectedFile.name}</p>}
          </div>

          <div>
            <label className="field-label">Submission Notes / Text</label>
            <textarea
              value={studentSubmissionText}
              onChange={(e) => setStudentSubmissionText(e.target.value)}
              rows={4}
              placeholder="Paste submission link or type solution details here..."
              className="field-input"
              style={{ resize: "none" }}
              disabled={isSubmitting}
            />
          </div>

          {isSubmitting && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dark)" }}>
                <span>Submitting assignment...</span>
                <span>{submitProgress}%</span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "var(--input-border)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "var(--success, #059669)", width: `${submitProgress}%`, transition: "all 0.3s ease" }} />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL: Delete Confirmation */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => !saving && setDeleteConfirmOpen(false)}
        title="Confirm Deletion"
        maxWidth="sm"
        footer={
          <>
            <button onClick={() => setDeleteConfirmOpen(false)} disabled={saving} className="submit-btn" style={{ background: "var(--input-bg)", color: "var(--text-dark)", border: "1px solid var(--input-border)", width: "auto" }}>
              Cancel
            </button>
            <button onClick={handleDeleteConfirm} disabled={saving} className="submit-btn" style={{ background: "var(--error, #dc2626)", width: "auto" }}>
              {saving ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p style={{ color: "var(--text-dark-sub)", fontSize: "0.875rem", lineHeight: "1.5" }}>
          Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default LMSContentPage;
