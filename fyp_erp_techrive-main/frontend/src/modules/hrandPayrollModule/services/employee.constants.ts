// ─── Employee Management — Frontend Constants ────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/constants/employee.constants.ts
// so client-side validation gives the same verdict the API will.

export const EMPLOYEE_ID_REGEX = /^[A-Za-z0-9\-_/]{2,50}$/;
export const CNIC_REGEX = /^\d{5}-?\d{7}-?\d{1}$/;
export const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// How long a toast/notification stays on screen before auto-dismissing
export const NOTIFICATION_TIMEOUT_MS = 4000;