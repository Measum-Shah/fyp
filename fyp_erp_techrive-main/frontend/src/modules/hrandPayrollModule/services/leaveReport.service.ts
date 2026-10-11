import API from "../../../api/api";
import type {
  LeaveBalancesReportParams,
  LeaveBalancesReportResponse,
  LeaveRequestsReportParams,
  LeaveRequestsReportResponse,
} from "./leaveReport.types";

// ─── Leave Reports — API Service ─────────────────────────────────────────────
// Same shape as reportAPI in report.service.ts.

export const leaveReportAPI = {
  leaveRequests: (params: LeaveRequestsReportParams = {}) =>
    API.get<LeaveRequestsReportResponse>("/reports/leave-requests", { params }).then(
      (res) => res.data
    ),

  leaveBalances: (params: LeaveBalancesReportParams = {}) =>
    API.get<LeaveBalancesReportResponse>("/reports/leave-balances", { params }).then(
      (res) => res.data
    ),
};
