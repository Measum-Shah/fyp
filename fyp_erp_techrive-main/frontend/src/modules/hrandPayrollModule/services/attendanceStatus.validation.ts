import { ATTENDANCE_STATUS_TITLE_MAX_LENGTH, DISPLAY_CLASS_OPTIONS } from "./attendanceStatus.constants";
import type { DisplayClass } from "./attendanceStatus.constants";
import type {
  AttendanceStatus,
  AttendanceStatusFormValues,
  CreateAttendanceStatusPayload,
  UpdateAttendanceStatusPayload,
} from "./attendanceStatus.types";

const isBlank = (value: string) => value.trim().length === 0;

export const validateAttendanceStatusForm = (
  values: AttendanceStatusFormValues
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.title)) {
    errors.title = "Title is required";
  } else if (values.title.trim().length > ATTENDANCE_STATUS_TITLE_MAX_LENGTH) {
    errors.title = `Title must be at most ${ATTENDANCE_STATUS_TITLE_MAX_LENGTH} characters`;
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

export const toCreatePayload = (values: AttendanceStatusFormValues): CreateAttendanceStatusPayload => ({
  title: values.title.trim(),
  display_class: (values.display_class as DisplayClass) || null,
  counts_as_absent: values.counts_as_absent,
  status: values.status !== "" ? Number(values.status) : undefined,
});

export const toUpdatePayload = (values: AttendanceStatusFormValues): UpdateAttendanceStatusPayload =>
  toCreatePayload(values);

export const attendanceStatusToFormValues = (status: AttendanceStatus): AttendanceStatusFormValues => ({
  title: status.title,
  display_class: status.display_class ?? "",
  counts_as_absent: status.counts_as_absent === 1 ? 1 : 0,
  status: String(status.status),
});

export { DISPLAY_CLASS_OPTIONS };