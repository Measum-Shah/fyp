import API from "../../../api/api";

export type ListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string | number;
  branch_id?: number;
  session_id?: number;
  program_id?: number;
  class_id?: number;
  board_id?: number;
  group_id?: number;
  fee_section_id?: number;
  fee_structure_code?: string;
  student_id?: number;
  fee_term_id?: number;
  scope?: "class" | "group" | "student";
  date_from?: string;
  date_to?: string;
  payment_mode?: string;
  due_status?: string;
  group_by?: string;
  sort?: string;
  action?: string;
  record_type?: string;
  user_id?: number;
  type?: string;
  as_of_date?: string;
};

const qs = (params?: ListQuery) => {
  if (!params) return "";
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const feeAPI = {
  getOverview: (branch_id?: number) =>
    API.get(`/fee/overview${qs({ branch_id })}`),

  getLookups: (branch_id?: number) =>
    API.get(`/fee/lookups${qs({ branch_id })}`),

  searchStudents: (params: ListQuery) =>
    API.get(`/fee/students/search${qs(params)}`),

  // Sections
  listSections: (params?: ListQuery) => API.get(`/fee/sections${qs(params)}`),
  createSection: (body: Record<string, unknown>) => API.post("/fee/sections", body),
  updateSection: (id: number, body: Record<string, unknown>) => API.put(`/fee/sections/${id}`, body),
  toggleSection: (id: number, status: "1" | "0") =>
    API.patch(`/fee/sections/${id}/status`, { status }),
  deleteSection: (id: number) => API.delete(`/fee/sections/${id}`),

  // Fee Section Prints
  listSectionPrints: (params?: ListQuery) => API.get(`/fee/section-prints${qs(params)}`),
  getSectionPrint: (id: number) => API.get(`/fee/section-prints/${id}`),
  createSectionPrint: (body: Record<string, unknown>) => API.post("/fee/section-prints", body),
  updateSectionPrint: (id: number, body: Record<string, unknown>) => API.put(`/fee/section-prints/${id}`, body),
  toggleSectionPrint: (id: number, status: "1" | "0") =>
    API.patch(`/fee/section-prints/${id}/status`, { status }),
  deleteSectionPrint: (id: number) => API.delete(`/fee/section-prints/${id}`),

  // ERP Fee Heads (parent categories for Fee Types)
  listErpFeeHeads: (params?: ListQuery) => API.get(`/fee/erp-fee-heads${qs(params)}`),
  getErpFeeHead: (id: number) => API.get(`/fee/erp-fee-heads/${id}`),
  createErpFeeHead: (body: Record<string, unknown>) => API.post("/fee/erp-fee-heads", body),
  updateErpFeeHead: (id: number, body: Record<string, unknown>) => API.put(`/fee/erp-fee-heads/${id}`, body),
  toggleErpFeeHead: (id: number, status: number) =>
    API.patch(`/fee/erp-fee-heads/${id}/status`, { status }),
  deleteErpFeeHead: (id: number) => API.delete(`/fee/erp-fee-heads/${id}`),

  // Heads / Fee Types
  listHeads: (params?: ListQuery) => API.get(`/fee/heads${qs(params)}`),
  createHead: (body: Record<string, unknown>) => API.post("/fee/heads", body),
  updateHead: (id: number, body: Record<string, unknown>) => API.put(`/fee/heads/${id}`, body),
  toggleHead: (id: number, status: number) =>
    API.patch(`/fee/heads/${id}/status`, { status }),
  deleteHead: (id: number) => API.delete(`/fee/heads/${id}`),

  // Terms / Cycles
  listTerms: (params?: ListQuery) => API.get(`/fee/terms${qs(params)}`),
  createTerm: (body: Record<string, unknown>) => API.post("/fee/terms", body),
  updateTerm: (id: number, body: Record<string, unknown>) => API.put(`/fee/terms/${id}`, body),
  toggleTerm: (id: number, status: string) =>
    API.patch(`/fee/terms/${id}/status`, { status }),
  deleteTerm: (id: number) => API.delete(`/fee/terms/${id}`),

  // Installments
  listInstallments: (params?: ListQuery) => API.get(`/fee/installments${qs(params)}`),
  createInstallment: (body: Record<string, unknown>) => API.post("/fee/installments", body),
  updateInstallment: (id: number, body: Record<string, unknown>) =>
    API.put(`/fee/installments/${id}`, body),
  toggleInstallment: (id: number, status: string) =>
    API.patch(`/fee/installments/${id}/status`, { status }),
  deleteInstallment: (id: number) => API.delete(`/fee/installments/${id}`),
  excludeStudentFromInstallment: (body: { student_id: number; installment_id: number; reason?: string }) =>
    API.post("/fee/installments/exclude", body),
  removeInstallmentExclusion: (body: { student_id: number; installment_id: number }) =>
    API.post("/fee/installments/remove-exclusion", body),
  checkInstallmentExclusion: (student_id: number, installment_id: number) =>
    API.get(`/fee/installments/check-exclusion${qs({ student_id, installment_id } as unknown as ListQuery)}`),

  // Structures
  listStructures: (params?: ListQuery) => API.get(`/fee/structures${qs(params)}`),
  listStructureGroups: (params?: ListQuery) =>
    API.get(`/fee/structures/groups${qs(params)}`),
  createStructure: (body: Record<string, unknown>) => API.post("/fee/structures", body),
  createStructureBulk: (body: Record<string, unknown>) =>
    API.post("/fee/structures/bulk", body),
  updateStructure: (id: number, body: Record<string, unknown>) =>
    API.put(`/fee/structures/${id}`, body),
  toggleStructure: (id: number, status: number) =>
    API.patch(`/fee/structures/${id}/status`, { status }),
  toggleStructureGroup: (code: string, status: number) =>
    API.patch(`/fee/structures/groups/${encodeURIComponent(code)}/status`, { status }),
  deleteStructure: (id: number) => API.delete(`/fee/structures/${id}`),

  // Assignments
  listAssignments: (params?: ListQuery) => API.get(`/fee/assignments${qs(params)}`),
  getAssignment: (id: number) => API.get(`/fee/assignments/${id}`),
  createAssignment: (body: Record<string, unknown>) => API.post("/fee/assignments", body),
  updateAssignment: (id: number, body: Record<string, unknown>) =>
    API.put(`/fee/assignments/${id}`, body),
  toggleAssignment: (id: number, status: string) =>
    API.patch(`/fee/assignments/${id}/status`, { status }),
  deleteAssignment: (id: number) => API.delete(`/fee/assignments/${id}`),

  // Module 2 — Student Fee Records
  listStudentFeeRecords: (params?: ListQuery & { status?: string }) =>
    API.get(`/fee/student-records${qs(params)}`),
  getStudentFeeDashboard: (studentId: number) =>
    API.get(`/fee/student-records/${studentId}/dashboard`),
  getStudentInvoice: (basicId: number) =>
    API.get(`/fee/student-records/invoices/${basicId}`),
  getStudentReceipt: (basicId: number) =>
    API.get(`/fee/student-records/receipts/${basicId}`),
  recordStudentPayment: (body: Record<string, unknown>) =>
    API.post("/fee/student-records/payments", body),
  upsertStudentFeeSettings: (body: Record<string, unknown>) =>
    API.post("/fee/student-records/settings", body),
  upsertFeeAutomate: (body: Record<string, unknown>) =>
    API.post("/fee/student-records/automate", body),
  listDiscountTypes: () => API.get("/fee/discount-types"),

  // Module 3 — Payment Processing
  getPaymentWorkspace: (studentId: number) =>
    API.get(`/fee/payments/workspace/${studentId}`),
  listPaymentMethods: () => API.get("/fee/payments/methods"),
  listPaymentSettings: () => API.get("/fee/payments/settings"),
  listStudentPaymentHistory: (studentId: number) =>
    API.get(`/fee/payments/history/${studentId}`),
  processFeePayment: (body: Record<string, unknown> | FormData) =>
    API.post("/fee/payments/process", body, body instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined),
  initiateOnlinePayment: (body: Record<string, unknown>) =>
    API.post("/fee/payments/online/initiate", body),
  completeOnlinePayment: (body: Record<string, unknown>) =>
    API.post("/fee/payments/online/complete", body),

  // Module 4 — Discounts & Concessions
  listDiscountTypesAdmin: (params?: ListQuery & { status?: string }) =>
    API.get(`/fee/discounts/types${qs(params)}`),
  createDiscountType: (body: Record<string, unknown>) =>
    API.post("/fee/discounts/types", body),
  updateDiscountType: (id: number, body: Record<string, unknown>) =>
    API.put(`/fee/discounts/types/${id}`, body),
  setDiscountTypeStatus: (id: number, status: string) =>
    API.patch(`/fee/discounts/types/${id}/status`, { status }),

  listScholarshipCatalog: (params?: ListQuery) =>
    API.get(`/fee/discounts/scholarships${qs(params)}`),
  getScholarshipCatalog: (id: number) =>
    API.get(`/fee/discounts/scholarships/${id}`),
  createScholarshipCatalog: (body: Record<string, unknown>) =>
    API.post("/fee/discounts/scholarships", body),
  updateScholarshipCatalog: (id: number, body: Record<string, unknown>) =>
    API.put(`/fee/discounts/scholarships/${id}`, body),
  setScholarshipCatalogStatus: (id: number, status: string) =>
    API.patch(`/fee/discounts/scholarships/${id}/status`, { status }),

  listScholarshipRules: (params?: ListQuery) =>
    API.get(`/fee/discounts/rules${qs(params)}`),
  createScholarshipRule: (body: Record<string, unknown>) =>
    API.post("/fee/discounts/rules", body),
  updateScholarshipRule: (id: number, body: Record<string, unknown>) =>
    API.put(`/fee/discounts/rules/${id}`, body),

  listScholarshipSettings: () => API.get("/fee/discounts/settings"),
  upsertScholarshipSettings: (body: Record<string, unknown>) =>
    API.post("/fee/discounts/settings", body),

  getDiscountWorkspace: (studentId: number) =>
    API.get(`/fee/discounts/workspace/${studentId}`),
  applyStudentDiscount: (body: Record<string, unknown>) =>
    API.post("/fee/discounts/apply-discount", body),
  applyStudentScholarship: (body: Record<string, unknown>) =>
    API.post("/fee/discounts/apply-scholarship", body),
  applyStudentConcession: (body: Record<string, unknown>) =>
    API.post("/fee/discounts/apply-concession", body),
  applyStudentNoDiscount: (body: Record<string, unknown>) =>
    API.post("/fee/discounts/apply-no-discount", body),

  // Module 5 — Late Fee Management
  getLateFeeWorkspace: (branch_id?: number) =>
    API.get(`/fee/late-fees/workspace${qs({ branch_id })}`),
  listLateFeeRules: (params?: ListQuery & { status?: string }) =>
    API.get(`/fee/late-fees/rules${qs(params)}`),
  createLateFeeRule: (body: Record<string, unknown>) =>
    API.post("/fee/late-fees/rules", body),
  updateLateFeeRule: (id: number, body: Record<string, unknown>) =>
    API.put(`/fee/late-fees/rules/${id}`, body),
  setLateFeeRuleStatus: (id: number, status: string) =>
    API.patch(`/fee/late-fees/rules/${id}/status`, { status }),
  deleteLateFeeRule: (id: number) => API.delete(`/fee/late-fees/rules/${id}`),
  listLateFeeIncidents: (params?: ListQuery) =>
    API.get(`/fee/late-fees/incidents${qs(params)}`),
  previewLateFee: (basicId: string | number, as_of_date?: string) =>
    API.get(
      `/fee/late-fees/preview/${encodeURIComponent(String(basicId).trim())}${qs({
        as_of_date,
      })}`
    ),

  // Module 6 — Alerts & Notifications
  getNotificationWorkspace: (branch_id?: number) =>
    API.get(`/fee/notifications/workspace${qs({ branch_id })}`),
  getNotificationSettings: () => API.get("/fee/notifications/settings"),
  updateNotificationSettings: (body: Record<string, unknown>) =>
    API.put("/fee/notifications/settings", body),
  listNotificationLog: (params?: ListQuery & { type?: string; status?: string }) =>
    API.get(`/fee/notifications/log${qs(params)}`),
  previewNotificationCandidates: (branch_id?: number) =>
    API.get(`/fee/notifications/candidates${qs({ branch_id })}`),
  runDueDateReminders: (body?: { branch_id?: number; dry_run?: boolean }) =>
    API.post("/fee/notifications/run-due-reminders", body || {}),
  runOverdueNotifications: (body?: { branch_id?: number; dry_run?: boolean }) =>
    API.post("/fee/notifications/run-overdue", body || {}),

  // Module 8 — Security & Access Control
  getFeeAccessProfile: () => API.get("/fee/access"),
  getMyFeeDashboard: (student_id?: number) =>
    API.get(`/fee/me/dashboard${qs({ student_id })}`),
  getMyPaymentWorkspace: (student_id?: number) =>
    API.get(`/fee/me/payments/workspace${qs({ student_id })}`),
  getMyPaymentHistory: (student_id?: number) =>
    API.get(`/fee/me/payments/history${qs({ student_id })}`),
  getMyInvoice: (basicId: number) => API.get(`/fee/me/invoices/${basicId}`),
  getMyReceipt: (basicId: number) => API.get(`/fee/me/receipts/${basicId}`),
  payMyFees: (body: Record<string, unknown>) =>
    API.post("/fee/me/payments/process", body),

  // Module 7 — Reporting & Analytics
  getReportingWorkspace: (params?: ListQuery) =>
    API.get(`/fee/reports/workspace${qs(params)}`),
  getReportingAnalytics: (params?: ListQuery) =>
    API.get(`/fee/reports/analytics${qs(params)}`),
  getCollectionReport: (params?: ListQuery) =>
    API.get(`/fee/reports/collections${qs(params)}`),
  getOutstandingDuesReport: (params?: ListQuery) =>
    API.get(`/fee/reports/outstanding${qs(params)}`),
  getDiscountReport: (params?: ListQuery) =>
    API.get(`/fee/reports/discounts${qs(params)}`),
  getDefaultersReport: (params?: ListQuery) =>
    API.get(`/fee/reports/defaulters${qs(params)}`),
  getFeeAuditTrail: (params?: ListQuery) =>
    API.get(`/fee/reports/audit-trail${qs(params)}`),
};

export default feeAPI;
