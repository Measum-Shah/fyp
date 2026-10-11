import React, { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import EmployeeForm from "../components/EmployeeForm";
import type { EmployeeFormSection } from "../components/EmployeeForm";
import EmployeeFormActionsBar from "../components/EmployeeFormActionsBar";
import ExportCsvButton, { type CsvColumn } from "../components/ExportCsvButton";
import EmployeeDashboardLayout from "../layout/EmployeeDashboardLayout";
import type { EmployeeProfileMetaItem } from "../components/EmployeeProfileHeader";
import type { EmployeeSectionNavTab } from "../components/EmployeeSectionNav";
import StaffQualificationsPanel from "../components/StaffQualificationsPanel";
import StaffAssetsPanel from "../components/StaffAssetsPanel";
import ExperiencesPanel from "../components/ExperiencesPanel";
import FamilyPanel from "../components/FamilyPanel";
import EmergencyContactsPanel from "../components/EmergencyContactsPanel";
import PerformancePanel from "../components/PerformancePanel";
import { useEmployee } from "../hooks/useEmployee";
import { useLookups } from "../hooks/useLookups";
import { useCompanies } from "../hooks/useCompanies";
import { useNotification } from "../hooks/useNotification";
import { employeeAPI, getApiErrorMessage, getApiFieldErrors, resolveEmployeeFileUrl } from "../services/employee.service";
import { employeeToFormValues, toUpdatePayload } from "../services/employee.validation";
import type { Employee, EmployeeFormValues } from "../services/employee.types";
import { DISABILITY_STATUS, PAYMENT_TYPE_LABELS } from "../services/employee.types";
import "./employee-module.css";
import { Can } from "../components/Can";

const FORM_ID = "employee-profile-form";

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
);

const IconIdCard = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <circle cx="8" cy="11" r="2" />
    <path d="M5 17c0-1.66 1.34-3 3-3s3 1.34 3 3" />
    <line x1="14" y1="9" x2="19" y2="9" />
    <line x1="14" y1="13" x2="19" y2="13" />
  </svg>
);

const IconBriefcase = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const employeeDisplayName = (
  first: string | null,
  middle: string | null,
  last: string | null,
  email: string
): string => {
  const parts = [first, middle, last].filter((p): p is string => Boolean(p && p.trim()));
  return parts.length > 0 ? parts.join(" ") : email;
};

// ─── Export to CSV (View Employee) ──────────────────────────────────────────
// A single "Field / Value" row per employee attribute — reuses the same
// ExportCsvButton/CsvColumn machinery every report page already uses (see
// components/ExportCsvButton.tsx), just fed a two-column shape instead of a
// list of records, since this exports one employee's complete profile
// rather than a table of many. Only fields already present on the loaded
// `Employee` record (the same object the rest of this page renders) are
// used — nothing hardcoded, nothing re-fetched.
interface ProfileCsvRow {
  field: string;
  value: string | number;
}

const profileCsvColumns: CsvColumn<ProfileCsvRow>[] = [
  { header: "Field", accessor: (r) => r.field },
  { header: "Value", accessor: (r) => r.value },
];

const formatCsvDate = (value: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const isPaymentTypeLabel = (value: string): value is keyof typeof PAYMENT_TYPE_LABELS =>
  value in PAYMENT_TYPE_LABELS;

const buildEmployeeProfileCsvRows = (
  employee: Employee,
  departmentName: string,
  branchName: string
): ProfileCsvRow[] => [
  // Basic Information
  { field: "Employee ID", value: employee.reg_no ?? "" },
  { field: "First Name", value: employee.first_name ?? "" },
  { field: "Middle Name", value: employee.middle_name ?? "" },
  { field: "Last Name", value: employee.last_name ?? "" },
  { field: "Father Name", value: employee.father_name ?? "" },
  { field: "Email", value: employee.email },
  { field: "Mobile 1", value: employee.mobile_1 ?? "" },
  { field: "Mobile 2", value: employee.mobile_2 ?? "" },
  { field: "Status", value: employee.status ?? "" },

  // Personal Details
  { field: "Gender", value: employee.gender ?? "" },
  { field: "Date of Birth", value: formatCsvDate(employee.date_of_birth) },
  { field: "Mother Name", value: employee.mother_name ?? "" },
  { field: "Marital Status", value: employee.marital_status ?? "" },
  { field: "Blood Group", value: employee.blood_group ?? "" },
  { field: "Nationality", value: employee.nationality ?? "" },
  { field: "Mother Tongue", value: employee.mother_tongue ?? "" },
  { field: "Disability", value: employee.disability === DISABILITY_STATUS.YES ? "Yes" : "No" },
  { field: "Disability Description", value: employee.disability_description ?? "" },
  { field: "CNIC", value: employee.cnic },
  { field: "CNIC Issue Date", value: formatCsvDate(employee.cnic_issue_date) },
  { field: "CNIC Expiry Date", value: formatCsvDate(employee.cnic_expiry_date) },

  // Contact Info
  { field: "Home Phone", value: employee.home_phone ?? "" },
  { field: "Personal Email", value: employee.pemail ?? "" },
  { field: "Address", value: employee.address ?? "" },
  { field: "City", value: employee.city ?? "" },
  { field: "State", value: employee.state ?? "" },
  { field: "Country", value: employee.country ?? "" },
  { field: "Temporary Address", value: employee.temp_address ?? "" },
  { field: "Temporary State", value: employee.temp_state ?? "" },
  { field: "Temporary Country", value: employee.temp_country ?? "" },

  // Employment Info
  { field: "Staff Type", value: employee.staff_type },
  { field: "Designation", value: employee.designation ?? "" },
  { field: "Department", value: departmentName },
  { field: "Campus", value: branchName },
  { field: "Join Date", value: formatCsvDate(employee.join_date) },
  { field: "Job Status", value: employee.job_status ?? "" },
  { field: "Probation", value: employee.probation ?? "" },
  { field: "Contract Start Date", value: formatCsvDate(employee.start_day_contract) },
  { field: "Contract End Date", value: formatCsvDate(employee.end_day_contract) },
  { field: "Expiry Date", value: formatCsvDate(employee.expiry_date) },
  { field: "First Registration Code", value: employee.first_registration_code ?? "" },
  { field: "Reports To (Employee ID)", value: employee.reports_to ?? "" },
  { field: "Replaced By (Employee ID)", value: employee.replaced_by ?? "" },

  // Professional Profile
  { field: "Qualification", value: employee.qualification ?? "" },
  { field: "Skill", value: employee.skill ?? "" },
  { field: "Experience", value: employee.experience ?? "" },
  { field: "NTN", value: employee.ntn ?? "" },
  { field: "Other Info", value: employee.other_info ?? "" },

  // Salary Structure
  {
    field: "Payment Type",
    value: employee.payment_type && isPaymentTypeLabel(employee.payment_type)
      ? PAYMENT_TYPE_LABELS[employee.payment_type]
      : employee.payment_type ?? "",
  },
  { field: "Basic Salary", value: employee.basic_salary ?? "" },
  { field: "Conveyance", value: employee.conveyance ?? "" },
  { field: "House Rent", value: employee.house_rent ?? "" },
  { field: "Medical Allowances", value: employee.medical_allowances ?? "" },
  { field: "Tax Percentage", value: employee.tax_percentage ?? "" },
  { field: "EPF Amount", value: employee.epf_amount ?? "" },
  { field: "EOBI Amount", value: employee.eobi_amount ?? "" },
  { field: "Bank Account", value: employee.bank_account ?? "" },
  { field: "Salary Per Hour", value: employee.salary_per_hour ?? "" },
  { field: "Hours Worked", value: employee.hours_worked ?? "" },
  { field: "Exempt Amount", value: employee.exempt_amount ?? "" },
  {
    field: "Allowances",
    value: employee.allowances.length
      ? employee.allowances
          .map((a) => `${a.name}: ${a.amount}${a.is_taxable ? " (Taxable)" : " (Non-taxable)"}`)
          .join("; ")
      : "",
  },

  // Record metadata
  { field: "Created At", value: formatCsvDate(employee.created_at) },
  { field: "Updated At", value: formatCsvDate(employee.updated_at) },
];

// Keeps the downloaded filename filesystem-safe on Windows/macOS/Linux
// while still matching the requested "Employee_[ID]_[Name]" pattern.
const sanitizeForFilename = (value: string): string =>
  value.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");

// ─── Tab configuration ────────────────────────────────────────────────────────
// The first six tabs all render the SAME <EmployeeForm> instance, just
// showing a different `activeSection` — the form itself never unmounts, so
// switching between these tabs never loses an unsaved edit while in Edit
// mode. The remaining tabs are independent sub-resources (their own table +
// "Add" modal), scoped to this employee, and are available in both View and
// Edit mode since they always save instantly via their own dialogs.
type ProfileTab =
  | EmployeeFormSection
  | "experience" | "family" | "emergency" | "performance" | "qualifications" | "assets";

const FORM_TABS: ProfileTab[] = ["basic", "personal", "contact", "employment", "professional", "salary"];

const TABS: EmployeeSectionNavTab[] = [
  { key: "basic", label: "Basic Information" },
  { key: "personal", label: "Personal Details" },
  { key: "contact", label: "Contact Info" },
  { key: "employment", label: "Employment Info" },
  { key: "professional", label: "Professional Profile" },
  { key: "experience", label: "Experience" },
  { key: "family", label: "Family Members" },
  { key: "emergency", label: "Emergency Contacts" },
  { key: "performance", label: "Performance Reviews" },
  { key: "qualifications", label: "Qualifications" },
  { key: "assets", label: "Assets" },
  { key: "salary", label: "Salary" },
];

type PageMode = "view" | "edit";

const EmployeeProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { employee, loading, error, refetch } = useEmployee(numericId);
  const lookups = useLookups();
  const { departments, branches } = lookups;
  // Same Companies lookup the Branch form and Add Employee page use —
  // reused, not duplicated, for the Employment Details "School" dropdown
  // (labelled "School" for employees; same underlying Company data).
  const { companies } = useCompanies();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const requestedTab = searchParams.get("tab") as ProfileTab | null;
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    requestedTab && TABS.some((t) => t.key === requestedTab) ? requestedTab : "basic"
  );

  // View Employee is the default; Edit Employee is the same dashboard with
  // the same tabs, just with `readOnly={false}` on the form. Both modes use
  // the exact same layout, nav and section container.
  const [mode, setMode] = useState<PageMode>("view");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  // Profile picture — managed straight from the Employee Profile Card
  // (Add/Change/Remove), independent of the Basic Information / Professional
  // Profile form and its Save button: each action uploads (or clears) and
  // persists immediately via the API, then refetches so it survives a
  // refresh.
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const departmentNameById = useMemo(() => {
    const map = new Map<number, string>();
    departments.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  const branchNameById = useMemo(() => {
    const map = new Map<number, string>();
    branches.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [branches]);

  const changeTab = (tab: string) => {
    setActiveTab(tab as ProfileTab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  const handleFormSubmit = async (values: EmployeeFormValues) => {
    if (!employee) return;
    setSubmitting(true);
    setServerErrors({});
    try {
      const payload = toUpdatePayload(values);
      const res = await employeeAPI.update(employee.id, payload);
      notifySuccess(
        `${employeeDisplayName(res.data.first_name, res.data.middle_name, res.data.last_name, res.data.email)} was updated successfully.`
      );
      setMode("view");
      refetch();
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err);
      if (fieldErrors) setServerErrors(fieldErrors);
      notifyError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarSelect = async (file: File) => {
    if (!employee) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const uploadRes = await employeeAPI.uploadProfileImage(file);
      await employeeAPI.update(employee.id, { staff_image: uploadRes.data.staff_image });
      notifySuccess("Profile picture updated successfully.");
      refetch();
    } catch (err) {
      const message = getApiErrorMessage(err);
      setAvatarError(message);
      notifyError(message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!employee) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      await employeeAPI.update(employee.id, { staff_image: "" });
      notifySuccess("Profile picture removed.");
      refetch();
    } catch (err) {
      const message = getApiErrorMessage(err);
      setAvatarError(message);
      notifyError(message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!employee) return;
    setDeleteLoading(true);
    try {
      await employeeAPI.remove(employee.id);
      notifySuccess(`${name} was deleted successfully.`);
      navigate("/hr/employees");
    } catch (err) {
      notifyError(getApiErrorMessage(err));
      setDeleteLoading(false);
    }
  };

  const name = employee
    ? employeeDisplayName(employee.first_name, employee.middle_name, employee.last_name, employee.email)
    : "";

  const showFormActionsBar = mode === "edit" && FORM_TABS.includes(activeTab);

  // Export to CSV (View Employee) — built from the same `employee` record,
  // department/branch name maps, and display name already used elsewhere on
  // this page, so the export always matches exactly the employee currently
  // being viewed.
  const profileCsvRows = employee
    ? buildEmployeeProfileCsvRows(
        employee,
        employee.department_id != null
          ? departmentNameById.get(employee.department_id) ?? `Dept #${employee.department_id}`
          : "",
        branchNameById.get(employee.branch_id) ?? `Campus #${employee.branch_id}`
      )
    : [];
  const profileCsvFilename = employee
    ? `Employee_${sanitizeForFilename(employee.reg_no ?? String(employee.id))}_${sanitizeForFilename(name)}.csv`
    : "employee.csv";

  return (
    <>
      {loading && (
        <div className="hr-page">
          <div className="hr-page-inner">
            <div className="hr-form-card">
              <div className="hr-state">
                <span className="spinner-wrap">
                  <span className="spinner" />
                </span>
                <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                  Loading employee…
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="hr-page">
          <div className="hr-page-inner">
            <div className="hr-form-card">
              <div className="hr-state hr-state-error">
                <div className="hr-state-icon">
                  <IconAlertTriangle />
                </div>
                <p className="hr-state-title">Couldn't load this employee</p>
                <p className="hr-state-message">{error}</p>
                <button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && employee && (
        <>
          <EmployeeDashboardLayout
            breadcrumbCurrent={name || "Employee Profile"}
            title={mode === "edit" ? "Edit Employee" : "View Employee"}
            headerActions={
              <>
                {mode === "view" && (
                  <ExportCsvButton
                    rows={profileCsvRows}
                    columns={profileCsvColumns}
                    filename={profileCsvFilename}
                    label="Export to CSV"
                  />
                )}
                {mode === "view" && (
                  <Can permission="employee.update">
                    <button type="button" className="hr-btn hr-btn-secondary" onClick={() => setMode("edit")}>
                      <IconEdit />
                      Edit
                    </button>
                  </Can>
                )}
                <Can permission="employee.delete">
                  <button type="button" className="hr-btn hr-btn-danger" onClick={() => setDeleteOpen(true)}>
                    <IconTrash />
                    Delete
                  </button>
                </Can>
              </>
            }
            profile={{
              name,
              imageUrl: resolveEmployeeFileUrl(employee.staff_image),
              status: employee.status,
              subtitle: (
                <>
                  {employee.designation || "No designation"}
                  {employee.department_id != null && (
                    <> · {departmentNameById.get(employee.department_id) ?? `Dept #${employee.department_id}`}</>
                  )}
                  {" · "}
                  {branchNameById.get(employee.branch_id) ?? `Campus #${employee.branch_id}`}
                </>
              ),
              // Fixed order: Employee ID, Email, Phone, Staff Type — label
              // above value for all four, values stay dynamically bound to
              // the loaded employee record.
              metaItems: (
                [
                  { key: "reg_no", icon: <IconIdCard />, label: "Employee ID", value: employee.reg_no ?? "—" },
                  { key: "email", icon: <IconMail />, label: "Email", value: employee.email },
                  { key: "phone", icon: <IconPhone />, label: "Phone", value: employee.mobile_1 ?? "—" },
                  { key: "staff_type", icon: <IconBriefcase />, label: "Staff Type", value: employee.staff_type ?? "—" },
                ] as EmployeeProfileMetaItem[]
              ),
              onAvatarSelect: handleAvatarSelect,
              onAvatarRemove: employee.staff_image ? handleAvatarRemove : undefined,
              avatarUploading,
              avatarError,
            }}
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={changeTab}
          >
            {/* The form stays mounted at all times (it only renders markup
                for the currently active section) so field edits made while
                in Edit mode are never lost while switching tabs. */}
            <EmployeeForm
              key={`${employee.id}-${mode}`}
              formId={FORM_ID}
              mode="edit"
              initialValues={employeeToFormValues(employee)}
              lookups={{ ...lookups, companies }}
              submitting={submitting}
              serverErrors={serverErrors}
              activeSection={activeTab}
              readOnly={mode === "view"}
              onSubmit={handleFormSubmit}
              onValidationError={(section) => changeTab(section)}
            />

            {activeTab === "experience" && (
              <ExperiencesPanel employeeId={employee.id} employeeName={name} />
            )}
            {activeTab === "family" && (
              <FamilyPanel employeeId={employee.id} employeeName={name} />
            )}
            {activeTab === "emergency" && (
              <EmergencyContactsPanel employeeId={employee.id} employeeName={name} />
            )}
            {activeTab === "performance" && (
              <PerformancePanel employeeId={employee.id} employeeName={name} />
            )}
            {activeTab === "qualifications" && (
              <StaffQualificationsPanel employeeId={employee.id} employeeName={name} />
            )}
            {activeTab === "assets" && (
              <StaffAssetsPanel employeeId={employee.id} employeeName={name} />
            )}

            {showFormActionsBar && (
              <EmployeeFormActionsBar
                formId={FORM_ID}
                submitting={submitting}
                submitLabel="Save Changes"
                onCancel={() => setMode("view")}
              />
            )}
          </EmployeeDashboardLayout>

          <ConfirmDialog
            open={deleteOpen}
            title="Delete employee?"
            message={`This will deactivate ${name} (${employee.reg_no ?? "no ID"}). This can be reviewed later, but they will no longer appear in the active employee list.`}
            confirmLabel="Delete"
            danger
            loading={deleteLoading}
            onCancel={() => setDeleteOpen(false)}
            onConfirm={handleConfirmDelete}
          />
        </>
      )}

      <Toast notifications={notifications} onDismiss={dismiss} />
    </>
  );
};

export default EmployeeProfilePage;