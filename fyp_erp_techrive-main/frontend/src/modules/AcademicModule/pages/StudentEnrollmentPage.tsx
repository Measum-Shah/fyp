import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import API from "../../../api/api";
import "./StudentEnrollmentPage.css";

type LookupOption = {
  id: number;
  name?: string | null;
  title?: string | null;
  code?: string | null;
  class_code?: string | null;
  branch_code?: string | null;
  branch_id?: number | null;
  board?: string | null;
};

type ActiveSessionOption = {
  id: number;
  title?: string | null;
  session_id: number;
  board_id: number;
  branch_id: number;
  program_id: number;
  class_id: number;
  intake_id?: number | null;
  status?: string | null;
};

type ActiveSessionSectionOption = {
  id: number;
  active_session_id: number;
  section_id: number;
  name?: string | null;
};

type StaffOption = {
  id: number;
  name: string;
  reg_no?: string | null;
  staff_type?: string | null;
  branch_id?: number | null;
  staff_ref: string;
};

type Lookups = {
  branches: LookupOption[];
  active_sessions: ActiveSessionOption[];
  active_session_sections: ActiveSessionSectionOption[];
  programs: LookupOption[];
  classes: LookupOption[];
  boards: LookupOption[];
  intakes: LookupOption[];
  staff: StaffOption[];
};

type FeeInfo = {
  fee_status: string;
  is_paid: boolean;
  total_dues: number;
  total_paid: number;
  outstanding_balance: number;
  has_fee_assignment: boolean;
};

type EnrollmentRecord = {
  id: number;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  full_name?: string;
  reg_no?: string | null;
  walkin_reg_no?: string | null;
  admission_status?: string | null;
  email?: string | null;
  mobile_1?: string | null;
  branch_id?: number | null;
  program_id?: number | null;
  class_id?: number | null;
  section_id?: number | null;
  session_id?: number | null;
  active_session_id?: number | null;
  active_session_section_id?: number | null;
  disability?: number | null;
  disability_description?: string | null;
  previous_school?: string | null;
  previous_class?: string | null;
  previous_board_id?: number | null;
  previous_qualification?: string | null;
  previous_total_marks?: number | null;
  previous_obtained_marks?: number | null;
  previous_percentage?: number | null;
  previous_pass_year?: string | null;
  temp_address?: string | null;
  extra_info?: string | null;
  student_image?: string | null;
  cnic_b_form?: string | null;
  father_guardian_name?: string | null;
  father_cnic?: string | null;
  mother_cnic?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  blood_group?: string | null;
  nationality?: string | null;
  mother_tongue?: string | null;
  mobile_2?: string | null;
  home_phone?: string | null;
  state?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  board_id?: number | null;
  intake_id?: number | null;
  reg_date?: string | null;
  display_admission_label?: string;
  fee?: FeeInfo;
  message?: string;
  updated?: boolean;
  parent?: Record<string, unknown> | null;
  credentials?: { email: string; password: string } | null;
  credentials_message?: string | null;
};

const emptyForm = {
  first_name: "",
  middle_name: "",
  last_name: "",
  date_of_birth: "",
  gender: "",
  blood_group: "",
  nationality: "",
  mother_tongue: "",
  email: "",
  cnic_b_form: "",
  mobile_1: "",
  mobile_2: "",
  home_phone: "",
  state: "",
  country: "",
  city: "",
  address: "",
  temp_address: "",
  extra_info: "",
  disability: "0",
  disability_description: "",
  branch_id: "",
  active_session_id: "",
  active_session_section_id: "",
  reg_no: "",
  reg_date: "",
  previous_school: "",
  previous_class: "",
  previous_board_id: "",
  previous_qualification: "",
  previous_total_marks: "",
  previous_obtained_marks: "",
  previous_percentage: "",
  previous_pass_year: "",
  father_first_name: "",
  father_middle_name: "",
  father_last_name: "",
  father_cnic: "",
  father_occupation: "",
  father_office: "",
  father_office_number: "",
  father_mobile_1: "",
  father_email: "",
  father_is_staff: "0",
  father_staff_ref: "",
  mother_first_name: "",
  mother_middle_name: "",
  mother_last_name: "",
  mother_cnic: "",
  mother_occupation: "",
  mother_office: "",
  mother_office_number: "",
  mother_mobile_1: "",
  mother_email: "",
  mother_is_staff: "0",
  mother_staff_ref: "",
  guardian_is: "",
  guardian_first_name: "",
  guardian_middle_name: "",
  guardian_last_name: "",
  guardian_cnic: "",
  guardian_occupation: "",
  guardian_relation: "",
  guardian_mobile_1: "",
  guardian_email: "",
  guardian_address: "",
  guardian_is_staff: "0",
  guardian_staff_ref: "",
};

type FormState = typeof emptyForm;

const calcPct = (obtained: string, total: string): string => {
  const o = Number(obtained);
  const t = Number(total);
  if (!Number.isFinite(o) || !Number.isFinite(t) || t <= 0 || o < 0) return "";
  if (o > t) return "";
  return String(Math.round((o / t) * 100));
};

const SE_PHOTO_MAX_BYTES = 2 * 1024 * 1024;
const SE_PHOTO_ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";

const StudentEnrollmentPage: React.FC = () => {
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [created, setCreated] = useState<EnrollmentRecord | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const clearPhoto = useCallback(() => {
    setPhotoFile(null);
    setPhotoPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    if (photoInputRef.current) photoInputRef.current.value = "";
    setFieldErrors((prev) => {
      if (!prev.student_photo) return prev;
      const next = { ...prev };
      delete next.student_photo;
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const onPhotoSelected = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      setFieldErrors((prev) => ({
        ...prev,
        student_photo: "Only JPG/JPEG and PNG images are allowed.",
      }));
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }
    if (file.size > SE_PHOTO_MAX_BYTES) {
      setFieldErrors((prev) => ({
        ...prev,
        student_photo: "Student photo must be 2 MB or smaller.",
      }));
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }

    setFieldErrors((prev) => {
      if (!prev.student_photo) return prev;
      const next = { ...prev };
      delete next.student_photo;
      return next;
    });
    setPhotoFile(file);
    setPhotoPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "previous_obtained_marks" || key === "previous_total_marks") {
        const obtained =
          key === "previous_obtained_marks" ? value : prev.previous_obtained_marks;
        const total =
          key === "previous_total_marks" ? value : prev.previous_total_marks;
        next.previous_percentage = calcPct(obtained, total);
      }
      return next;
    });
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleGuardianIsChange = (val: string) => {
    setForm((prev) => {
      const next = { ...prev, guardian_is: val };
      if (val === "Father") {
        next.guardian_first_name = prev.father_first_name;
        next.guardian_last_name = prev.father_last_name;
        next.guardian_cnic = prev.father_cnic;
        next.guardian_mobile_1 = prev.father_mobile_1;
        next.guardian_email = prev.father_email;
        next.guardian_occupation = prev.father_occupation;
        next.guardian_relation = "Father";
        next.guardian_is_staff = prev.father_is_staff;
        next.guardian_staff_ref = prev.father_staff_ref;
      } else if (val === "Mother") {
        next.guardian_first_name = prev.mother_first_name;
        next.guardian_last_name = prev.mother_last_name;
        next.guardian_cnic = prev.mother_cnic;
        next.guardian_mobile_1 = prev.mother_mobile_1;
        next.guardian_email = prev.mother_email;
        next.guardian_occupation = prev.mother_occupation;
        next.guardian_relation = "Mother";
        next.guardian_is_staff = prev.mother_is_staff;
        next.guardian_staff_ref = prev.mother_staff_ref;
      }
      return next;
    });
    setFieldErrors((prev) => {
      if (!prev.guardian_is) return prev;
      const next = { ...prev };
      delete next.guardian_is;
      return next;
    });
  };

  const loadLookups = useCallback(async () => {
    setLookupsLoading(true);
    setPageError(null);
    try {
      // Load the full Student Enrollment lookup payload once.
      // Branch → Active Session and Active Session → Section filtering is done
      // client-side from active_sessions / active_session_sections so a
      // branch-change re-fetch cannot race and wipe the dropdown options.
      const res = await API.get("/academic/student-enrollment/lookups");
      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        setLookups({
          branches: data.branches || [],
          active_sessions: data.active_sessions || [],
          active_session_sections: data.active_session_sections || [],
          programs: data.programs || [],
          classes: data.classes || [],
          boards: data.boards || [],
          intakes: data.intakes || [],
          staff: data.staff || [],
        });
      } else {
        setPageError(
          res.data?.message || "Failed to load enrollment lookups."
        );
      }
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load enrollment lookups.";
      setPageError(msg);
    } finally {
      setLookupsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  const activeSessionsForBranch = useMemo(() => {
    if (!lookups || !form.branch_id) return [];
    const bid = Number(form.branch_id);
    if (!Number.isFinite(bid)) return [];
    return (lookups.active_sessions || []).filter(
      (s) => Number(s.branch_id) === bid
    );
  }, [lookups, form.branch_id]);

  const selectedActiveSession = useMemo(() => {
    if (!form.active_session_id) return null;
    return (
      activeSessionsForBranch.find(
        (s) => Number(s.id) === Number(form.active_session_id)
      ) || null
    );
  }, [activeSessionsForBranch, form.active_session_id]);

  const sectionsForActiveSession = useMemo(() => {
    if (!lookups || !form.active_session_id) return [];
    const aid = Number(form.active_session_id);
    if (!Number.isFinite(aid)) return [];
    return (lookups.active_session_sections || []).filter(
      (s) => Number(s.active_session_id) === aid
    );
  }, [lookups, form.active_session_id]);

  const labelOf = (list: LookupOption[] | undefined, id?: number | null) => {
    if (!list || !id) return "—";
    const found = list.find((x) => x.id === id);
    return found?.name || found?.title || `#${id}`;
  };

  const onBranchChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      branch_id: value,
      active_session_id: "",
      active_session_section_id: "",
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.branch_id;
      delete next.active_session_id;
      delete next.active_session_section_id;
      return next;
    });
  };

  const onActiveSessionChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      active_session_id: value,
      active_session_section_id: "",
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.active_session_id;
      delete next.active_session_section_id;
      return next;
    });
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.first_name.trim()) errors.first_name = "First name is required";
    if (!form.mobile_1.trim()) errors.mobile_1 = "Contact number is required";
    if (!form.branch_id) errors.branch_id = "Branch is required";
    if (!form.active_session_id)
      errors.active_session_id = "Active session is required";
    if (!form.active_session_section_id)
      errors.active_session_section_id = "Active session section is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Enter a valid email";
    }
    if (form.disability === "1" && !form.disability_description.trim()) {
      errors.disability_description =
        "Please provide disability / special needs details";
    }
    if (form.father_is_staff === "1" && !form.father_staff_ref) {
      errors.father_staff_ref = "Select the staff member for father";
    }
    if (form.mother_is_staff === "1" && !form.mother_staff_ref) {
      errors.mother_staff_ref = "Select the staff member for mother";
    }
    if (form.guardian_is_staff === "1" && !form.guardian_staff_ref) {
      errors.guardian_staff_ref = "Select the staff member for guardian";
    }
    const obt = form.previous_obtained_marks
      ? Number(form.previous_obtained_marks)
      : null;
    const tot = form.previous_total_marks
      ? Number(form.previous_total_marks)
      : null;
    if (obt !== null && (!Number.isFinite(obt) || obt < 0)) {
      errors.previous_obtained_marks = "Enter a valid obtained marks value";
    }
    if (tot !== null && (!Number.isFinite(tot) || tot <= 0)) {
      errors.previous_total_marks = "Enter a valid total marks value";
    }
    if (
      obt !== null &&
      tot !== null &&
      Number.isFinite(obt) &&
      Number.isFinite(tot) &&
      obt > tot
    ) {
      errors.previous_obtained_marks =
        "Obtained marks cannot exceed total marks";
    }
    if (photoFile) {
      if (!["image/jpeg", "image/png"].includes(photoFile.type)) {
        errors.student_photo = "Only JPG/JPEG and PNG images are allowed.";
      } else if (photoFile.size > SE_PHOTO_MAX_BYTES) {
        errors.student_photo = "Student photo must be 2 MB or smaller.";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPageError(null);
    setSuccessMsg(null);
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name,
        middle_name: form.middle_name || null,
        last_name: form.last_name || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        blood_group: form.blood_group || null,
        nationality: form.nationality || null,
        mother_tongue: form.mother_tongue || null,
        email: form.email || null,
        cnic_b_form: form.cnic_b_form || null,
        mobile_1: form.mobile_1,
        mobile_2: form.mobile_2 || null,
        home_phone: form.home_phone || null,
        state: form.state || null,
        country: form.country || null,
        city: form.city || null,
        address: form.address || null,
        temp_address: form.temp_address || null,
        extra_info: form.extra_info || null,
        disability: Number(form.disability),
        disability_description:
          form.disability === "1" ? form.disability_description : null,
        branch_id: Number(form.branch_id),
        active_session_id: Number(form.active_session_id),
        active_session_section_id: Number(form.active_session_section_id),
        reg_no: form.reg_no || null,
        reg_date: form.reg_date || null,
        previous_school: form.previous_school || null,
        previous_class: form.previous_class || null,
        previous_board_id: form.previous_board_id
          ? Number(form.previous_board_id)
          : null,
        previous_qualification: form.previous_qualification || null,
        previous_total_marks: form.previous_total_marks
          ? Number(form.previous_total_marks)
          : null,
        previous_obtained_marks: form.previous_obtained_marks
          ? Number(form.previous_obtained_marks)
          : null,
        previous_percentage: form.previous_percentage
          ? Number(form.previous_percentage)
          : null,
        previous_pass_year: form.previous_pass_year || null,
        father_cnic: form.father_cnic || null,
        mother_cnic: form.mother_cnic || null,
        parent: {
          father_first_name: form.father_first_name || null,
          father_middle_name: form.father_middle_name || null,
          father_last_name: form.father_last_name || null,
          father_cnic: form.father_cnic || null,
          father_occupation: form.father_occupation || null,
          father_office: form.father_office || null,
          father_office_number: form.father_office_number || null,
          father_mobile_1: form.father_mobile_1 || null,
          father_email: form.father_email || null,
          father_is_staff: Number(form.father_is_staff),
          father_staff_ref:
            form.father_is_staff === "1" ? form.father_staff_ref : null,
          mother_first_name: form.mother_first_name || null,
          mother_middle_name: form.mother_middle_name || null,
          mother_last_name: form.mother_last_name || null,
          mother_cnic: form.mother_cnic || null,
          mother_occupation: form.mother_occupation || null,
          mother_office: form.mother_office || null,
          mother_office_number: form.mother_office_number || null,
          mother_mobile_1: form.mother_mobile_1 || null,
          mother_email: form.mother_email || null,
          mother_is_staff: Number(form.mother_is_staff),
          mother_staff_ref:
            form.mother_is_staff === "1" ? form.mother_staff_ref : null,
          guardian_is: form.guardian_is || null,
          guardian_first_name: form.guardian_first_name || null,
          guardian_middle_name: form.guardian_middle_name || null,
          guardian_last_name: form.guardian_last_name || null,
          guardian_cnic: form.guardian_cnic || null,
          guardian_occupation: form.guardian_occupation || null,
          guardian_relation: form.guardian_relation || null,
          guardian_mobile_1: form.guardian_mobile_1 || null,
          guardian_email: form.guardian_email || null,
          guardian_address: form.guardian_address || null,
          guardian_is_staff: Number(form.guardian_is_staff),
          guardian_staff_ref:
            form.guardian_is_staff === "1" ? form.guardian_staff_ref : null,
        },
      };

      let res;
      if (photoFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (key === "parent") {
            fd.append("parent", JSON.stringify(value));
            return;
          }
          if (value === null || value === undefined) return;
          fd.append(key, String(value));
        });
        fd.append("student_photo", photoFile);
        res = await API.post("/academic/student-enrollment", fd, {
          // Let the browser set multipart boundary (do not force application/json).
          headers: { "Content-Type": undefined as unknown as string },
        });
      } else {
        res = await API.post("/academic/student-enrollment", payload);
      }
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Enrollment failed");
      }
      const data = res.data.data as EnrollmentRecord;
      setCreated(data);
      setSuccessMsg(
        data.message ||
          `Student enrolled successfully (ID ${data.id}). Linked to active session section.`
      );
      setForm(emptyForm);
      clearPhoto();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Could not create student enrollment.";
      setPageError(msg);
    } finally {
      setSaving(false);
    }
  };

  const selectEnrollment = async (id: number) => {
    setPageError(null);
    try {
      const res = await API.get(`/academic/student-enrollment/${id}`);
      if (res.data?.success) {
        setCreated(res.data.data);
        setSuccessMsg(null);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load student.";
      setPageError(msg);
    }
  };

  const handleVerifyFee = async () => {
    if (!created?.id) return;
    setVerifying(true);
    setPageError(null);
    try {
      const res = await API.post(
        `/academic/student-enrollment/${created.id}/verify-fee`
      );
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Verification failed");
      }
      const data = res.data.data as EnrollmentRecord;
      setCreated(data);
      if (data.updated) {
        setSuccessMsg(data.message || "Student is now Registered.");
      } else {
        setPageError(data.message || "Fee not fully paid yet.");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Fee verification failed.";
      setPageError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const sectionLabel = (record: EnrollmentRecord) => {
    const byLink = lookups?.active_session_sections.find(
      (s) => s.id === record.active_session_section_id
    );
    if (byLink?.name) return byLink.name;
    const bySection = lookups?.active_session_sections.find(
      (s) => s.section_id === record.section_id
    );
    return bySection?.name || (record.section_id ? `#${record.section_id}` : "—");
  };

  if (lookupsLoading && !lookups) {
    return <div className="se-loading">Loading Student Enrollment…</div>;
  }

  return (
    <div className="se-page">
      <header className="se-header">
        <h1 className="se-title">Student Enrollment</h1>
        <p className="se-subtitle">
          Register a student into the Academic student record and link them to
          an active session section. New enrollments start as{" "}
          <strong>Walk-in</strong> until Fee Management payment is verified,
          then become <strong>Registered</strong>.
        </p>
      </header>

      {successMsg && (
        <div className="se-banner se-banner-success" role="status">
          {successMsg}
        </div>
      )}
      {created?.credentials && (
        <div className="se-banner" style={{background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe'}} role="status">
          <strong>Student Login Account Created!</strong><br />
          Email: <strong>{created.credentials.email}</strong><br />
          Password: <strong>{created.credentials.password}</strong><br />
          <small>Please share these credentials with the student so they can access the Student Portal.</small>
        </div>
      )}
      {created?.credentials_message && (
        <div className="se-banner" style={{background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a'}} role="status">
          {created.credentials_message}
        </div>
      )}
      {pageError && (
        <div className="se-banner se-banner-error" role="alert">
          {pageError}
        </div>
      )}

      <form className="se-card se-form-card" onSubmit={handleSubmit} noValidate>
        <h2 className="se-card-title">Enrollment Form</h2>

        <section className="se-section" aria-labelledby="se-photo">
          <h3 className="se-section-label" id="se-photo">
            Student Passport-Size Photo
          </h3>
          <div className="se-photo-row">
            <div className="se-photo-preview" aria-live="polite">
              {photoPreviewUrl ? (
                <img
                  src={photoPreviewUrl}
                  alt="Student passport photo preview"
                  className="se-photo-img"
                />
              ) : (
                <div className="se-photo-placeholder">No photo selected</div>
              )}
            </div>
            <div className="se-photo-controls">
              <p className="se-hint">
                Upload a clear passport-size photo (JPG or PNG, max 2 MB).
              </p>
              <input
                ref={photoInputRef}
                id="se-student-photo"
                type="file"
                accept={SE_PHOTO_ACCEPT}
                className="se-file-input"
                onChange={(e) => onPhotoSelected(e.target.files)}
              />
              <div className="se-photo-actions">
                <label htmlFor="se-student-photo" className="se-btn se-btn-secondary se-btn-file">
                  {photoFile ? "Change Photo" : "Choose Photo"}
                </label>
                {photoFile && (
                  <button
                    type="button"
                    className="se-btn se-btn-secondary"
                    onClick={clearPhoto}
                    disabled={saving}
                  >
                    Remove
                  </button>
                )}
              </div>
              {fieldErrors.student_photo && (
                <span className="se-error">{fieldErrors.student_photo}</span>
              )}
            </div>
          </div>
        </section>

        <section className="se-section" aria-labelledby="se-student-info">
          <h3 className="se-section-label" id="se-student-info">
            Student Information
          </h3>
          <div className="se-fields se-fields-3">
            <div className="se-field">
              <label className="se-label" htmlFor="se-first-name">
                First Name <span className="se-req">*</span>
              </label>
              <input
                id="se-first-name"
                className={`se-input ${fieldErrors.first_name ? "se-invalid" : ""}`}
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
                autoComplete="given-name"
              />
              {fieldErrors.first_name && (
                <span className="se-error">{fieldErrors.first_name}</span>
              )}
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-middle-name">
                Middle Name
              </label>
              <input
                id="se-middle-name"
                className="se-input"
                value={form.middle_name}
                onChange={(e) => setField("middle_name", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-last-name">
                Last Name
              </label>
              <input
                id="se-last-name"
                className="se-input"
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
                autoComplete="family-name"
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-dob">
                Date of Birth
              </label>
              <input
                id="se-dob"
                type="date"
                className="se-input"
                value={form.date_of_birth}
                onChange={(e) => setField("date_of_birth", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-gender">
                Gender
              </label>
              <select
                id="se-gender"
                className="se-select"
                value={form.gender}
                onChange={(e) => setField("gender", e.target.value)}
              >
                <option value="">Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-blood">
                Blood Group
              </label>
              <input
                id="se-blood"
                className="se-input"
                value={form.blood_group}
                onChange={(e) => setField("blood_group", e.target.value)}
                placeholder="e.g. B+"
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-nationality">
                Nationality
              </label>
              <input
                id="se-nationality"
                className="se-input"
                value={form.nationality}
                onChange={(e) => setField("nationality", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-tongue">
                Mother Tongue
              </label>
              <input
                id="se-tongue"
                className="se-input"
                value={form.mother_tongue}
                onChange={(e) => setField("mother_tongue", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-cnic">
                Student CNIC / B-Form
              </label>
              <input
                id="se-cnic"
                className="se-input"
                value={form.cnic_b_form}
                onChange={(e) => setField("cnic_b_form", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="se-section" aria-labelledby="se-disability">
          <h3 className="se-section-label" id="se-disability">
            Disability / Special Needs
          </h3>
          <div className="se-fields">
            <div className="se-field">
              <label className="se-label" htmlFor="se-disability">
                Does the student have a disability or special need?
              </label>
              <select
                id="se-disability"
                className="se-select"
                value={form.disability}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    disability: v,
                    disability_description:
                      v === "1" ? prev.disability_description : "",
                  }));
                }}
              >
                <option value="0">No</option>
                <option value="1">Yes</option>
              </select>
            </div>
            {form.disability === "1" && (
              <div className="se-field se-span-2">
                <label className="se-label" htmlFor="se-disability-details">
                  Disability / Special Needs Details{" "}
                  <span className="se-req">*</span>
                </label>
                <textarea
                  id="se-disability-details"
                  className={`se-textarea ${
                    fieldErrors.disability_description ? "se-invalid" : ""
                  }`}
                  value={form.disability_description}
                  onChange={(e) =>
                    setField("disability_description", e.target.value)
                  }
                />
                {fieldErrors.disability_description && (
                  <span className="se-error">
                    {fieldErrors.disability_description}
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="se-section" aria-labelledby="se-contact">
          <h3 className="se-section-label" id="se-contact">
            Contact Information
          </h3>
          <div className="se-fields">
            <div className="se-field">
              <label className="se-label" htmlFor="se-mobile1">
                Contact Number <span className="se-req">*</span>
              </label>
              <input
                id="se-mobile1"
                className={`se-input ${fieldErrors.mobile_1 ? "se-invalid" : ""}`}
                value={form.mobile_1}
                onChange={(e) => setField("mobile_1", e.target.value)}
                autoComplete="tel"
              />
              {fieldErrors.mobile_1 && (
                <span className="se-error">{fieldErrors.mobile_1}</span>
              )}
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-mobile2">
                Alternate Mobile
              </label>
              <input
                id="se-mobile2"
                className="se-input"
                value={form.mobile_2}
                onChange={(e) => setField("mobile_2", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-email">
                Email
              </label>
              <input
                id="se-email"
                type="email"
                className={`se-input ${fieldErrors.email ? "se-invalid" : ""}`}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <span className="se-error">{fieldErrors.email}</span>
              )}
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-home-phone">
                Home Phone
              </label>
              <input
                id="se-home-phone"
                className="se-input"
                value={form.home_phone}
                onChange={(e) => setField("home_phone", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-city">
                City
              </label>
              <input
                id="se-city"
                className="se-input"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-state">
                State / Province
              </label>
              <input
                id="se-state"
                className="se-input"
                value={form.state}
                onChange={(e) => setField("state", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-country">
                Country
              </label>
              <input
                id="se-country"
                className="se-input"
                value={form.country}
                onChange={(e) => setField("country", e.target.value)}
              />
            </div>
            <div className="se-field se-span-2">
              <label className="se-label" htmlFor="se-address">
                Permanent Address
              </label>
              <textarea
                id="se-address"
                className="se-textarea"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
              />
            </div>
            <div className="se-field se-span-2">
              <label className="se-label" htmlFor="se-temp-address">
                Temporary Address
              </label>
              <textarea
                id="se-temp-address"
                className="se-textarea"
                value={form.temp_address}
                onChange={(e) => setField("temp_address", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="se-section" aria-labelledby="se-father">
          <h3 className="se-section-label" id="se-father">
            Father Information
          </h3>
          <div className="se-fields se-fields-3">
            <div className="se-field">
              <label className="se-label" htmlFor="se-father-first">
                Father First Name
              </label>
              <input
                id="se-father-first"
                className="se-input"
                value={form.father_first_name}
                onChange={(e) => setField("father_first_name", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-father-middle">
                Father Middle Name
              </label>
              <input
                id="se-father-middle"
                className="se-input"
                value={form.father_middle_name}
                onChange={(e) => setField("father_middle_name", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-father-last">
                Father Last Name
              </label>
              <input
                id="se-father-last"
                className="se-input"
                value={form.father_last_name}
                onChange={(e) => setField("father_last_name", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-father-cnic">
                Father CNIC
              </label>
              <input
                id="se-father-cnic"
                className="se-input"
                value={form.father_cnic}
                onChange={(e) => setField("father_cnic", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-father-occ">
                Father Occupation
              </label>
              <input
                id="se-father-occ"
                className="se-input"
                value={form.father_occupation}
                onChange={(e) => setField("father_occupation", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-father-mobile">
                Father Mobile
              </label>
              <input
                id="se-father-mobile"
                className="se-input"
                value={form.father_mobile_1}
                onChange={(e) => setField("father_mobile_1", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-father-email">
                Father Email
              </label>
              <input
                id="se-father-email"
                className="se-input"
                value={form.father_email}
                onChange={(e) => setField("father_email", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-father-office">
                Father Office
              </label>
              <input
                id="se-father-office"
                className="se-input"
                value={form.father_office}
                onChange={(e) => setField("father_office", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-father-office-no">
                Father Office Number
              </label>
              <input
                id="se-father-office-no"
                className="se-input"
                value={form.father_office_number}
                onChange={(e) =>
                  setField("father_office_number", e.target.value)
                }
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-father-staff">
                Is Father a staff member?
              </label>
              <select
                id="se-father-staff"
                className="se-select"
                value={form.father_is_staff}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    father_is_staff: v,
                    father_staff_ref: v === "1" ? prev.father_staff_ref : "",
                  }));
                }}
              >
                <option value="0">No</option>
                <option value="1">Yes</option>
              </select>
            </div>
            {form.father_is_staff === "1" && (
              <div className="se-field">
                <label className="se-label" htmlFor="se-father-staff-ref">
                  Father Staff Member <span className="se-req">*</span>
                </label>
                <select
                  id="se-father-staff-ref"
                  className={`se-select ${
                    fieldErrors.father_staff_ref ? "se-invalid" : ""
                  }`}
                  value={form.father_staff_ref}
                  onChange={(e) => setField("father_staff_ref", e.target.value)}
                >
                  <option value="">Select staff…</option>
                  {(lookups?.staff || []).map((s) => (
                    <option key={s.id} value={s.staff_ref}>
                      {s.name}
                      {s.reg_no ? ` (${s.reg_no})` : ` #${s.id}`}
                    </option>
                  ))}
                </select>
                {fieldErrors.father_staff_ref && (
                  <span className="se-error">{fieldErrors.father_staff_ref}</span>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="se-section" aria-labelledby="se-mother">
          <h3 className="se-section-label" id="se-mother">
            Mother Information
          </h3>
          <div className="se-fields se-fields-3">
            <div className="se-field">
              <label className="se-label" htmlFor="se-mother-first">
                Mother First Name
              </label>
              <input
                id="se-mother-first"
                className="se-input"
                value={form.mother_first_name}
                onChange={(e) => setField("mother_first_name", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-mother-middle">
                Mother Middle Name
              </label>
              <input
                id="se-mother-middle"
                className="se-input"
                value={form.mother_middle_name}
                onChange={(e) => setField("mother_middle_name", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-mother-last">
                Mother Last Name
              </label>
              <input
                id="se-mother-last"
                className="se-input"
                value={form.mother_last_name}
                onChange={(e) => setField("mother_last_name", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-mother-cnic">
                Mother CNIC
              </label>
              <input
                id="se-mother-cnic"
                className="se-input"
                value={form.mother_cnic}
                onChange={(e) => setField("mother_cnic", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-mother-occ">
                Mother Occupation
              </label>
              <input
                id="se-mother-occ"
                className="se-input"
                value={form.mother_occupation}
                onChange={(e) => setField("mother_occupation", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-mother-mobile">
                Mother Mobile
              </label>
              <input
                id="se-mother-mobile"
                className="se-input"
                value={form.mother_mobile_1}
                onChange={(e) => setField("mother_mobile_1", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-mother-email">
                Mother Email
              </label>
              <input
                id="se-mother-email"
                className="se-input"
                value={form.mother_email}
                onChange={(e) => setField("mother_email", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-mother-office">
                Mother Office
              </label>
              <input
                id="se-mother-office"
                className="se-input"
                value={form.mother_office}
                onChange={(e) => setField("mother_office", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-mother-office-no">
                Mother Office Number
              </label>
              <input
                id="se-mother-office-no"
                className="se-input"
                value={form.mother_office_number}
                onChange={(e) =>
                  setField("mother_office_number", e.target.value)
                }
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-mother-staff">
                Is Mother a staff member?
              </label>
              <select
                id="se-mother-staff"
                className="se-select"
                value={form.mother_is_staff}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    mother_is_staff: v,
                    mother_staff_ref: v === "1" ? prev.mother_staff_ref : "",
                  }));
                }}
              >
                <option value="0">No</option>
                <option value="1">Yes</option>
              </select>
            </div>
            {form.mother_is_staff === "1" && (
              <div className="se-field">
                <label className="se-label" htmlFor="se-mother-staff-ref">
                  Mother Staff Member <span className="se-req">*</span>
                </label>
                <select
                  id="se-mother-staff-ref"
                  className={`se-select ${
                    fieldErrors.mother_staff_ref ? "se-invalid" : ""
                  }`}
                  value={form.mother_staff_ref}
                  onChange={(e) => setField("mother_staff_ref", e.target.value)}
                >
                  <option value="">Select staff…</option>
                  {(lookups?.staff || []).map((s) => (
                    <option key={s.id} value={s.staff_ref}>
                      {s.name}
                      {s.reg_no ? ` (${s.reg_no})` : ` #${s.id}`}
                    </option>
                  ))}
                </select>
                {fieldErrors.mother_staff_ref && (
                  <span className="se-error">{fieldErrors.mother_staff_ref}</span>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="se-section" aria-labelledby="se-guardian">
          <h3 className="se-section-label" id="se-guardian">
            Guardian Information (optional)
          </h3>
          <div className="se-fields se-fields-3">
            <div className="se-field">
              <label className="se-label" htmlFor="se-guardian-is">
                Guardian Is
              </label>
              <select
                id="se-guardian-is"
                className="se-select"
                value={form.guardian_is}
                onChange={(e) => handleGuardianIsChange(e.target.value)}
              >
                <option value="">Select…</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-guardian-relation">
                Relation
              </label>
              <input
                id="se-guardian-relation"
                className="se-input"
                value={form.guardian_relation}
                onChange={(e) => setField("guardian_relation", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-guardian-first">
                Guardian First Name
              </label>
              <input
                id="se-guardian-first"
                className="se-input"
                value={form.guardian_first_name}
                onChange={(e) =>
                  setField("guardian_first_name", e.target.value)
                }
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-guardian-middle">
                Guardian Middle Name
              </label>
              <input
                id="se-guardian-middle"
                className="se-input"
                value={form.guardian_middle_name}
                onChange={(e) =>
                  setField("guardian_middle_name", e.target.value)
                }
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-guardian-last">
                Guardian Last Name
              </label>
              <input
                id="se-guardian-last"
                className="se-input"
                value={form.guardian_last_name}
                onChange={(e) => setField("guardian_last_name", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-guardian-cnic">
                Guardian CNIC
              </label>
              <input
                id="se-guardian-cnic"
                className="se-input"
                value={form.guardian_cnic}
                onChange={(e) => setField("guardian_cnic", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-guardian-occ">
                Guardian Occupation
              </label>
              <input
                id="se-guardian-occ"
                className="se-input"
                value={form.guardian_occupation}
                onChange={(e) =>
                  setField("guardian_occupation", e.target.value)
                }
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-guardian-mobile">
                Guardian Mobile
              </label>
              <input
                id="se-guardian-mobile"
                className="se-input"
                value={form.guardian_mobile_1}
                onChange={(e) => setField("guardian_mobile_1", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-guardian-email">
                Guardian Email
              </label>
              <input
                id="se-guardian-email"
                className="se-input"
                value={form.guardian_email}
                onChange={(e) => setField("guardian_email", e.target.value)}
              />
            </div>
            <div className="se-field se-span-2">
              <label className="se-label" htmlFor="se-guardian-address">
                Guardian Address
              </label>
              <input
                id="se-guardian-address"
                className="se-input"
                value={form.guardian_address}
                onChange={(e) => setField("guardian_address", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-guardian-staff">
                Is Guardian a staff member?
              </label>
              <select
                id="se-guardian-staff"
                className="se-select"
                value={form.guardian_is_staff}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    guardian_is_staff: v,
                    guardian_staff_ref:
                      v === "1" ? prev.guardian_staff_ref : "",
                  }));
                }}
              >
                <option value="0">No</option>
                <option value="1">Yes</option>
              </select>
            </div>
            {form.guardian_is_staff === "1" && (
              <div className="se-field">
                <label className="se-label" htmlFor="se-guardian-staff-ref">
                  Guardian Staff Member <span className="se-req">*</span>
                </label>
                <select
                  id="se-guardian-staff-ref"
                  className={`se-select ${
                    fieldErrors.guardian_staff_ref ? "se-invalid" : ""
                  }`}
                  value={form.guardian_staff_ref}
                  onChange={(e) =>
                    setField("guardian_staff_ref", e.target.value)
                  }
                >
                  <option value="">Select staff…</option>
                  {(lookups?.staff || []).map((s) => (
                    <option key={s.id} value={s.staff_ref}>
                      {s.name}
                      {s.reg_no ? ` (${s.reg_no})` : ` #${s.id}`}
                    </option>
                  ))}
                </select>
                {fieldErrors.guardian_staff_ref && (
                  <span className="se-error">
                    {fieldErrors.guardian_staff_ref}
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="se-section" aria-labelledby="se-academic">
          <h3 className="se-section-label" id="se-academic">
            Academic Information
          </h3>
          <div className="se-fields">
            <div className="se-field">
              <label className="se-label" htmlFor="se-branch">
                Branch <span className="se-req">*</span>
              </label>
              <select
                id="se-branch"
                className={`se-select ${fieldErrors.branch_id ? "se-invalid" : ""}`}
                value={form.branch_id}
                onChange={(e) => onBranchChange(e.target.value)}
              >
                <option value="">Select branch…</option>
                {(lookups?.branches || []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.branch_code ? ` (${b.branch_code})` : ""}
                  </option>
                ))}
              </select>
              {fieldErrors.branch_id && (
                <span className="se-error">{fieldErrors.branch_id}</span>
              )}
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-active-session">
                Active Session <span className="se-req">*</span>
              </label>
              <select
                id="se-active-session"
                className={`se-select ${
                  fieldErrors.active_session_id ? "se-invalid" : ""
                }`}
                value={form.active_session_id}
                onChange={(e) => onActiveSessionChange(e.target.value)}
                disabled={!form.branch_id}
              >
                <option value="">
                  {form.branch_id
                    ? "Select active session…"
                    : "Select branch first…"}
                </option>
                {activeSessionsForBranch.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title || `Active Session #${s.id}`}
                  </option>
                ))}
              </select>
              {activeSessionsForBranch.length === 0 && form.branch_id && (
                <span className="se-hint">
                  {lookupsLoading
                    ? "Loading active sessions…"
                    : lookups && (lookups.active_sessions || []).length === 0
                      ? "No active sessions were returned by the server. Confirm the backend is running the latest Student Enrollment lookups."
                      : "No active sessions are linked to this branch."}
                </span>
              )}
              {fieldErrors.active_session_id && (
                <span className="se-error">{fieldErrors.active_session_id}</span>
              )}
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-active-section">
                Active Session Section <span className="se-req">*</span>
              </label>
              <select
                id="se-active-section"
                className={`se-select ${
                  fieldErrors.active_session_section_id ? "se-invalid" : ""
                }`}
                value={form.active_session_section_id}
                onChange={(e) =>
                  setField("active_session_section_id", e.target.value)
                }
                disabled={!form.active_session_id}
              >
                <option value="">
                  {form.active_session_id
                    ? "Select section…"
                    : "Select active session first…"}
                </option>
                {sectionsForActiveSession.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || `Section #${s.section_id}`}
                  </option>
                ))}
              </select>
              {fieldErrors.active_session_section_id && (
                <span className="se-error">
                  {fieldErrors.active_session_section_id}
                </span>
              )}
            </div>
          </div>

          {selectedActiveSession && (
            <div className="se-context-panel" aria-live="polite">
              <div className="se-context-title">Active session context</div>
              <div className="se-context-grid">
                <div>
                  <span className="se-meta-key">Program</span>
                  <span className="se-meta-val">
                    {labelOf(lookups?.programs, selectedActiveSession.program_id)}
                  </span>
                </div>
                <div>
                  <span className="se-meta-key">Class</span>
                  <span className="se-meta-val">
                    {labelOf(lookups?.classes, selectedActiveSession.class_id)}
                  </span>
                </div>
                <div>
                  <span className="se-meta-key">Board</span>
                  <span className="se-meta-val">
                    {labelOf(lookups?.boards, selectedActiveSession.board_id)}
                  </span>
                </div>
                <div>
                  <span className="se-meta-key">Intake</span>
                  <span className="se-meta-val">
                    {selectedActiveSession.intake_id
                      ? labelOf(lookups?.intakes, selectedActiveSession.intake_id)
                      : "—"}
                  </span>
                </div>
              </div>
              <p className="se-hint" style={{ marginTop: "0.55rem" }}>
                Program, class, board, and intake are taken from the selected
                active session record.
              </p>
            </div>
          )}
        </section>

        <section className="se-section" aria-labelledby="se-admission">
          <h3 className="se-section-label" id="se-admission">
            Admission Details
          </h3>
          <div className="se-fields">
            <div className="se-field">
              <label className="se-label" htmlFor="se-reg-no">
                Student Registration No. (optional)
              </label>
              <input
                id="se-reg-no"
                className="se-input"
                value={form.reg_no}
                onChange={(e) => setField("reg_no", e.target.value)}
                placeholder="Auto-generated walk-in ID if blank"
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-reg-date">
                Enrollment / Registration Date
              </label>
              <input
                id="se-reg-date"
                type="date"
                className="se-input"
                value={form.reg_date}
                onChange={(e) => setField("reg_date", e.target.value)}
              />
            </div>
            <div className="se-field se-span-2">
              <label className="se-label" htmlFor="se-extra">
                Additional Notes
              </label>
              <textarea
                id="se-extra"
                className="se-textarea"
                value={form.extra_info}
                onChange={(e) => setField("extra_info", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="se-section" aria-labelledby="se-previous-edu">
          <h3 className="se-section-label" id="se-previous-edu">
            Previous Education Information
          </h3>
          <div className="se-fields">
            <div className="se-field">
              <label className="se-label" htmlFor="se-prev-school">
                Previous Institution / School
              </label>
              <input
                id="se-prev-school"
                className="se-input"
                value={form.previous_school}
                onChange={(e) => setField("previous_school", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-prev-class">
                Previous Class / Grade
              </label>
              <input
                id="se-prev-class"
                className="se-input"
                value={form.previous_class}
                onChange={(e) => setField("previous_class", e.target.value)}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-prev-board">
                Previous Board / Education Board
              </label>
              <select
                id="se-prev-board"
                className="se-select"
                value={form.previous_board_id}
                onChange={(e) => setField("previous_board_id", e.target.value)}
              >
                <option value="">Select board…</option>
                {(lookups?.boards || []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.board ? ` (${b.board})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-prev-qual">
                Previous Qualification / Level
              </label>
              <select
                id="se-prev-qual"
                className="se-select"
                value={form.previous_qualification}
                onChange={(e) =>
                  setField("previous_qualification", e.target.value)
                }
              >
                <option value="">Select qualification…</option>
                <option value="Matric">Matric</option>
                <option value="SSC">SSC</option>
                <option value="O-Level">O-Level</option>
                <option value="FSc">FSc</option>
                <option value="FA">FA</option>
                <option value="ICS">ICS</option>
                <option value="ICom">ICom</option>
                <option value="A-Level">A-Level</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-prev-pass-year">
                Passing Year
              </label>
              <input
                id="se-prev-pass-year"
                className="se-input"
                value={form.previous_pass_year}
                onChange={(e) => setField("previous_pass_year", e.target.value)}
                placeholder="e.g. 2025"
                maxLength={4}
              />
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-prev-total">
                Total Marks
              </label>
              <input
                id="se-prev-total"
                type="number"
                min={0}
                className={`se-input ${
                  fieldErrors.previous_total_marks ? "se-invalid" : ""
                }`}
                value={form.previous_total_marks}
                onChange={(e) =>
                  setField("previous_total_marks", e.target.value)
                }
              />
              {fieldErrors.previous_total_marks && (
                <span className="se-error">
                  {fieldErrors.previous_total_marks}
                </span>
              )}
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-prev-obtained">
                Obtained Marks
              </label>
              <input
                id="se-prev-obtained"
                type="number"
                min={0}
                className={`se-input ${
                  fieldErrors.previous_obtained_marks ? "se-invalid" : ""
                }`}
                value={form.previous_obtained_marks}
                onChange={(e) =>
                  setField("previous_obtained_marks", e.target.value)
                }
              />
              {fieldErrors.previous_obtained_marks && (
                <span className="se-error">
                  {fieldErrors.previous_obtained_marks}
                </span>
              )}
            </div>
            <div className="se-field">
              <label className="se-label" htmlFor="se-prev-pct">
                Percentage
              </label>
              <input
                id="se-prev-pct"
                className="se-input"
                value={
                  form.previous_percentage
                    ? `${form.previous_percentage}%`
                    : ""
                }
                readOnly
                placeholder="Auto-calculated"
              />
              <span className="se-hint">
                Calculated automatically from obtained and total marks.
              </span>
            </div>
          </div>
        </section>

        <div className="se-actions">
          <button
            type="submit"
            className="se-btn se-btn-primary"
            disabled={saving}
          >
            {saving ? "Enrolling…" : "Submit Enrollment"}
          </button>
          <button
            type="button"
            className="se-btn se-btn-secondary"
            disabled={saving}
            onClick={() => {
              setForm(emptyForm);
              setFieldErrors({});
              setPageError(null);
              clearPhoto();
            }}
          >
            Reset Form
          </button>
        </div>
      </form>

      <aside className="se-card se-status-card">
        <h2 className="se-card-title">Status &amp; Fee Verification</h2>

        {created ? (
          <>
            <div className="se-status-row">
              <span
                className={`se-pill ${
                  created.admission_status === "Registered"
                    ? "se-pill-registered"
                    : "se-pill-walkin"
                }`}
              >
                {created.display_admission_label ||
                  created.admission_status ||
                  "—"}
              </span>
              {created.fee && (
                <span className="se-pill se-pill-fee">
                  Fee: {created.fee.fee_status}
                </span>
              )}
            </div>

            <div className="se-meta">
              <div className="se-meta-row">
                <span className="se-meta-key">Student ID</span>
                <span className="se-meta-val">{created.id}</span>
              </div>
              <div className="se-meta-row">
                <span className="se-meta-key">Name</span>
                <span className="se-meta-val">
                  {created.full_name ||
                    [created.first_name, created.last_name]
                      .filter(Boolean)
                      .join(" ")}
                </span>
              </div>
              <div className="se-meta-row">
                <span className="se-meta-key">Reg No</span>
                <span className="se-meta-val">{created.reg_no || "—"}</span>
              </div>
              <div className="se-meta-row">
                <span className="se-meta-key">Walk-in No</span>
                <span className="se-meta-val">
                  {created.walkin_reg_no || "—"}
                </span>
              </div>
              <div className="se-meta-row">
                <span className="se-meta-key">Branch</span>
                <span className="se-meta-val">
                  {labelOf(lookups?.branches, created.branch_id)}
                </span>
              </div>
              <div className="se-meta-row">
                <span className="se-meta-key">Program</span>
                <span className="se-meta-val">
                  {labelOf(lookups?.programs, created.program_id)}
                </span>
              </div>
              <div className="se-meta-row">
                <span className="se-meta-key">Class / Section</span>
                <span className="se-meta-val">
                  {labelOf(lookups?.classes, created.class_id)} /{" "}
                  {sectionLabel(created)}
                </span>
              </div>
              {created.fee && (
                <>
                  <div className="se-meta-row">
                    <span className="se-meta-key">Total Dues</span>
                    <span className="se-meta-val">
                      {created.fee.total_dues.toLocaleString()}
                    </span>
                  </div>
                  <div className="se-meta-row">
                    <span className="se-meta-key">Total Paid</span>
                    <span className="se-meta-val">
                      {created.fee.total_paid.toLocaleString()}
                    </span>
                  </div>
                  <div className="se-meta-row">
                    <span className="se-meta-key">Outstanding</span>
                    <span className="se-meta-val">
                      {created.fee.outstanding_balance.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>

            {created.admission_status === "Walk-in" && (
              <div
                className="se-banner se-banner-warn"
                style={{ marginTop: "1rem" }}
              >
                Assign and collect fees in Fee Management for student ID{" "}
                <strong>{created.id}</strong>, then verify here. Fee Management
                code is not modified by this feature.
              </div>
            )}

            <div className="se-actions">
              <button
                type="button"
                className="se-btn se-btn-verify"
                disabled={
                  verifying || created.admission_status === "Registered"
                }
                onClick={handleVerifyFee}
              >
                {verifying
                  ? "Checking fees…"
                  : created.admission_status === "Registered"
                    ? "Already Registered"
                    : "Verify Fee & Register"}
              </button>
              <button
                type="button"
                className="se-btn se-btn-secondary"
                onClick={() => selectEnrollment(created.id)}
                disabled={verifying}
              >
                Refresh Status
              </button>
            </div>
          </>
        ) : (
          <div className="se-empty">
            Submit an enrollment to view status and verify fees.
          </div>
        )}
      </aside>
    </div>
  );
};

export default StudentEnrollmentPage;
