import {
  PAY_STATUS_OPTIONS,
  REMARKS_MAX_LENGTH,
  TOTAL_ABSENTS_MAX,
  TOTAL_ABSENTS_MIN,
} from "./attendanceSummary.constants";
import type { PayStatus } from "./attendanceSummary.constants";
import type {
  AttendanceSummary,
  AttendanceSummaryFormValues,
  CreateAttendanceSummaryPayload,
  UpdateAttendanceSummaryPayload,
} from "./attendanceSummary.types";

const isBlank = (value: string) => value.trim().length === 0;
const isValidPositiveInt = (value: string) => /^\d+$/.test(value.trim());

export const validateAttendanceSummaryForm = (
  values: AttendanceSummaryFormValues,
  mode: "create" | "edit"
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (mode === "create") {
    if (isBlank(values.staff_id) || !isValidPositiveInt(values.staff_id)) {
      errors.staff_id = "Please select an employee";
    }
    if (isBlank(values.branch_id) || !isValidPositiveInt(values.branch_id)) {
      errors.branch_id = "Please select a campus";
    }
    if (isBlank(values.month_id) || !isValidPositiveInt(values.month_id)) {
      errors.month_id = "Please select a month";
    }
    if (isBlank(values.year_id) || !isValidPositiveInt(values.year_id)) {
      errors.year_id = "Please select a year";
    }
  }

  if (isBlank(values.pay_status)) {
    errors.pay_status = "Pay status is required";
  }

  if (!isBlank(values.total_absents)) {
    if (!isValidPositiveInt(values.total_absents)) {
      errors.total_absents = "Total absents must be a whole number";
    } else {
      const n = Number(values.total_absents);
      if (n < TOTAL_ABSENTS_MIN || n > TOTAL_ABSENTS_MAX) {
        errors.total_absents = `Total absents must be between ${TOTAL_ABSENTS_MIN} and ${TOTAL_ABSENTS_MAX}`;
      }
    }
  }

  if (values.remarks.trim().length > REMARKS_MAX_LENGTH) {
    errors.remarks = `Remarks must be at most ${REMARKS_MAX_LENGTH} characters`;
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

export const toCreatePayload = (values: AttendanceSummaryFormValues): CreateAttendanceSummaryPayload => ({
  branch_id: Number(values.branch_id),
  staff_id: Number(values.staff_id),
  month_id: Number(values.month_id),
  year_id: Number(values.year_id),
  total_absents: values.total_absents.trim() !== "" ? Number(values.total_absents) : undefined,
  remarks: values.remarks.trim() !== "" ? values.remarks.trim() : undefined,
  pay_status: values.pay_status as PayStatus,
});

export const toUpdatePayload = (values: AttendanceSummaryFormValues): UpdateAttendanceSummaryPayload => ({
  total_absents: values.total_absents.trim() !== "" ? Number(values.total_absents) : undefined,
  remarks: values.remarks.trim() !== "" ? values.remarks.trim() : undefined,
  pay_status: values.pay_status !== "" ? (values.pay_status as PayStatus) : undefined,
});

export const summaryToFormValues = (summary: AttendanceSummary): AttendanceSummaryFormValues => ({
  branch_id: String(summary.branch_id),
  staff_id: String(summary.staff_id),
  employee_label: summary.employee
    ? `${summary.employee.name}${summary.employee.reg_no ? ` (${summary.employee.reg_no})` : ""}`
    : "",
  month_id: String(summary.month_id),
  year_id: String(summary.year_id),
  total_absents: summary.total_absents != null ? String(summary.total_absents) : "0",
  remarks: summary.remarks ?? "",
  pay_status: summary.pay_status,
});

export { PAY_STATUS_OPTIONS };