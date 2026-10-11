import React, { useEffect, useState } from "react";
import FormField from "./FormField";
import { userAPI } from "../services/user.service";
import { employeeAPI } from "../services/employee.service";
import { USER_TYPE_OPTIONS, EMPTY_USER_FORM_VALUES } from "../services/user.types";
import type { EmployeeLookupOption, User, UserFormValues } from "../services/user.types";
import type { LookupOption } from "../services/employee.types";
import { useCompanyLookup } from "../hooks/useCompanyLookup";

interface UserFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  user?: User;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: UserFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const toFormValues = (user?: User): UserFormValues =>
  user
    ? {
        name: user.name,
        email: user.email,
        password: "",
        branch_id: user.branch_id != null ? String(user.branch_id) : "",
        employee_id: user.employee_id != null ? String(user.employee_id) : "",
        user_type: (user.user_type as UserFormValues["user_type"]) ?? "staff",
      }
    : EMPTY_USER_FORM_VALUES;

const validate = (values: UserFormValues, mode: "create" | "edit"): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!values.name.trim()) errors.name = "Name is required";
  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address";
  }
  if (mode === "create") {
    if (!values.password) {
      errors.password = "Password is required";
    } else if (values.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
  }
  return errors;
};

// Create/Edit User. Branch is loaded as its own dropdown (not a paginated
// list — same reasoning as DesignationFormModal's parent-designation
// dropdown). Password is only collected here on create; changing an
// existing user's password goes through ResetPasswordModal instead.
//
// There used to be a "Role" dropdown here, tied to the Roles &
// Permissions system. That system has been removed — access to the HR &
// Payroll module is now decided entirely by the "Account Type" field
// below (admin/hr get in, everything else doesn't), so there's nothing
// left for a per-account role to control.
const UserFormModal: React.FC<UserFormModalProps> = ({
  open,
  mode,
  user,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<UserFormValues>(toFormValues(user));
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [branchOptions, setBranchOptions] = useState<LookupOption[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeLookupOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  // Company → Branch cascade (see the Company→Branch scoping task). Edit
  // mode has an existing branch_id but no stored company_id to prefill, so
  // default to the legacy full list (undefined) rather than empty/gated —
  // otherwise the existing branch selection would vanish from the
  // dropdown. Create mode starts gated (null) since there's nothing to
  // preserve.
  const [companyId, setCompanyId] = useState<number | null | undefined>(
    mode === "edit" ? undefined : null
  );
  const { companies } = useCompanyLookup();

  useEffect(() => {
    if (!open) return;
    setValues(toFormValues(user));
    setClientErrors({});
    setCompanyId(mode === "edit" ? undefined : null);
    setOptionsLoading(true);
    userAPI.lookups
      .employees()
      .then((employeesRes) => {
        // The employees lookup only returns NOT-YET-LINKED employees (so
        // the dropdown doesn't offer dead-end picks) — which means the
        // employee this user is *already* linked to, if any, would be
        // missing from that list and silently disappear from the
        // dropdown while editing. Add it back in manually using the name
        // the user record itself already carries (employee_name).
        const options = [...employeesRes.data];
        if (user?.employee_id != null && !options.some((e) => e.id === user.employee_id)) {
          options.unshift({ id: user.employee_id, name: user.employee_name ?? `Employee #${user.employee_id}`, reg_no: null });
        }
        setEmployeeOptions(options);
      })
      .catch(() => {
        setEmployeeOptions([]);
      })
      .finally(() => setOptionsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  // Branches re-fetch whenever companyId changes, scoped to that company
  // (see the Company→Branch scoping task). companyId === null means
  // gated/empty; undefined means the legacy full list.
  useEffect(() => {
    if (!open) return;
    if (companyId === null) {
      setBranchOptions([]);
      return;
    }
    employeeAPI.lookups
      .branches(companyId ?? undefined)
      .then((res) => setBranchOptions(res.data))
      .catch(() => setBranchOptions([]));
  }, [open, companyId]);

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof UserFormValues) => errors[field];

  const handleChange = (field: keyof UserFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const nextValue = e.target.value;
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(values, mode);
    setClientErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      onSubmit(values);
    }
  };

  return (
    <div
      className="hr-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close">
          <IconClose />
        </button>

        <h3 id="user-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Create User" : `Edit User — ${user?.name}`}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Full Name" htmlFor="user-name" required error={err("name")}>
            <input
              id="user-name"
              className={`field-input ${err("name") ? "input-error" : ""}`}
              value={values.name}
              onChange={handleChange("name")}
              placeholder="e.g. Ayesha Khan"
              disabled={submitting}
              autoFocus
            />
          </FormField>

          <FormField label="Email" htmlFor="user-email" required error={err("email")}>
            <input
              id="user-email"
              type="email"
              className={`field-input ${err("email") ? "input-error" : ""}`}
              value={values.email}
              onChange={handleChange("email")}
              placeholder="name@university.edu"
              disabled={submitting}
            />
          </FormField>

          {mode === "create" && (
            <FormField
              label="Password"
              htmlFor="user-password"
              required
              error={err("password")}
              hint="At least 6 characters"
            >
              <input
                id="user-password"
                type="password"
                className={`field-input ${err("password") ? "input-error" : ""}`}
                value={values.password}
                onChange={handleChange("password")}
                placeholder="Set an initial password"
                disabled={submitting}
              />
            </FormField>
          )}

          <FormField label="School / University" htmlFor="user-company">
            <select
              id="user-company"
              className="field-input hr-select"
              value={companyId ?? ""}
              onChange={(e) => {
                setCompanyId(e.target.value ? Number(e.target.value) : null);
                // A branch from the old company is no longer valid/visible — clear it.
                setValues((prev) => ({ ...prev, branch_id: "" }));
              }}
              disabled={submitting || optionsLoading}
            >
              <option value="">All school / university</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Campus" htmlFor="user-branch" error={err("branch_id")}>
            <select
              id="user-branch"
              className="field-input hr-select"
              value={values.branch_id}
              onChange={handleChange("branch_id")}
              disabled={submitting || optionsLoading || companyId === null}
            >
              <option value="">{companyId === null ? "Select a school / university first…" : "No campus"}</option>
              {branchOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Link to Employee"
            htmlFor="user-employee"
            error={err("employee_id")}
          >
            <select
              id="user-employee"
              className="field-input hr-select"
              value={values.employee_id}
              onChange={handleChange("employee_id")}
              disabled={submitting || optionsLoading}
            >
              <option value="">Not linked</option>
              {employeeOptions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                  {e.reg_no ? ` (${e.reg_no})` : ""}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Account Type"
            htmlFor="user-type"
            error={err("user_type")}
            hint="Only Admin and HR accounts can access the HR & Payroll module."
          >
            <select
              id="user-type"
              className="field-input hr-select"
              value={values.user_type}
              onChange={handleChange("user_type")}
              disabled={submitting}
            >
              {USER_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t === "admin" ? "Admin" : "Staff"}
                </option>
              ))}
            </select>
          </FormField>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="spinner-wrap">
                  <span className="spinner" />
                  Saving…
                </span>
              ) : mode === "create" ? (
                "Create User"
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
