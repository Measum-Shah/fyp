import API from "../../../api/api";
import type {
  AttendanceRecordsReportParams,
  AttendanceRecordsReportResponse,
  AttendanceSummaryReportParams,
  AttendanceSummaryReportResponse,
} from "./attendanceReport.types";

// ─── Attendance Reports — API Service ───────────────────────────────────────
export const attendanceReportAPI = {
  attendanceRecords: (params: AttendanceRecordsReportParams = {}) =>
    API.get<AttendanceRecordsReportResponse>("/reports/attendance-records", { params }).then(
      (res) => res.data
    ),

  attendanceSummary: (params: AttendanceSummaryReportParams = {}) =>
    API.get<AttendanceSummaryReportResponse>("/reports/attendance-summary", { params }).then(
      (res) => res.data
    ),
};
