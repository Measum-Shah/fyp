import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import ResignationFormModal from "../components/ResignationFormModal";
import ResignationApprovalModal from "../components/ResignationApprovalModal";
import { useResignations } from "../hooks/useResignations";
import { useStaffLookup } from "../hooks/useStaffLookup";
import { useLookups } from "../hooks/useLookups";
import { useNotification } from "../hooks/useNotification";
import { resignationAPI } from "../services/resignation.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import { resignationToFormValues, toCreatePayload, toUpdatePayload } from "../services/resignation.validation";
import { APPROVAL_STATUS } from "../services/resignation.types";
import type { Resignation, ResignationFormValues, UpdateResignationApprovalPayload } from "../services/resignation.types";
import "./employee-module.css";
import { Can } from "../components/Can";

const IconHome = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>);
const IconPlus = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const IconLogOut = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>);
const IconAlertTriangle = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>);
const IconEdit = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>);
const IconTrash = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);
const IconCheckSquare = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>);

const ResignationsPage: React.FC = () => {
  const { resignations, meta, page, setPage, search, changeSearch, loading, error, refetch } = useResignations();
  const { staff, loading: staffLoading } = useStaffLookup();
  const { designations, loading: lookupsLoading } = useLookups();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<Resignation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [approvalRecord, setApprovalRecord] = useState<Resignation | null>(null);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [approvalServerErrors, setApprovalServerErrors] = useState<Record<string, string>>({});

  const [recordToDelete, setRecordToDelete] = useState<Resignation | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: Resignation) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: ResignationFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await resignationAPI.create(toCreatePayload(values));
        notifySuccess("Resignation was submitted successfully.");
      } else if (editingRecord) {
        await resignationAPI.update(editingRecord.id, toUpdatePayload(values));
        notifySuccess("Resignation was updated successfully.");
      }
      setModalOpen(false);
      setEditingRecord(null);
      refetch();
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err);
      if (fieldErrors) setServerErrors(fieldErrors);
      notifyError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovalSubmit = async (payload: UpdateResignationApprovalPayload) => {
    if (!approvalRecord) return;
    setApprovalSubmitting(true);
    setApprovalServerErrors({});
    try {
      const res = await resignationAPI.updateApproval(approvalRecord.id, payload);
      notifySuccess(
        res.data.status === APPROVAL_STATUS.APPROVED
          ? "Resignation approved — the employee has been marked Inactive."
          : "Approval status updated."
      );
      setApprovalRecord(null);
      refetch();
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err);
      if (fieldErrors) setApprovalServerErrors(fieldErrors);
      notifyError(getApiErrorMessage(err));
    } finally {
      setApprovalSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    setDeleteLoading(true);
    try {
      await resignationAPI.remove(recordToDelete.id);
      notifySuccess("Resignation was deleted successfully.");
      setRecordToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && resignations.length === 0 && !error;
  const showErrorState = !loading && error && resignations.length === 0;
  const showEmptyState = !loading && !error && resignations.length === 0;
  const showTable = !showBigLoadingState && !showErrorState && !showEmptyState;

  return (
    <div className="hr-page">
      <div className="hr-page-inner">
        <div className="hr-page-header">
          <div>
            <nav className="breadcrumb">
              <Link to="/dashboard" className="breadcrumb-item"><IconHome /> Dashboard</Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item">HR &amp; Payroll</span>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item breadcrumb-current">Resignations</span>
            </nav>
            <h1 className="hr-page-title">Resignations</h1>
          </div>
          <Can permission="resignation.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />New Resignation</button></Can>
        </div>


        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search by reason…" />
        </div>

        {showBigLoadingState && (<div className="hr-table-wrap"><div className="hr-state"><span className="spinner-wrap"><span className="spinner" /></span><p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Loading resignations…</p></div></div>)}
        {showErrorState && (<div className="hr-table-wrap"><div className="hr-state hr-state-error"><div className="hr-state-icon"><IconAlertTriangle /></div><p className="hr-state-title">Couldn't load resignations</p><p className="hr-state-message">{error}</p><button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>Try again</button></div></div>)}
        {showEmptyState && (<div className="hr-table-wrap"><div className="hr-state"><div className="hr-state-icon"><IconLogOut /></div><p className="hr-state-title">{search ? "No matching resignations" : "No resignations yet"}</p><p className="hr-state-message">{search ? `No resignations match "${search}".` : "Record an employee's resignation to get started."}</p>{!search && <Can permission="resignation.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />New Resignation</button></Can>}</div></div>)}

        {showTable && (
          <>
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
              <div className="hr-table-wrap">
                <table className="hr-table">
                  <thead>
                    <tr><th>Reason</th><th>Notice Period</th><th>Last Day</th><th>Status</th><th className="hr-table-actions-col">Actions</th></tr>
                  </thead>
                  <tbody>
                    {resignations.map((record) => (
                      <tr key={record.id}>
                        <td className="hr-table-name">{record.reason}</td>
                        <td>{record.notice_period}</td>
                        <td>{record.last_day_of_work ? record.last_day_of_work.slice(0, 10) : "—"}</td>
                        <td>
                          <span className={`profile-status ${record.status === APPROVAL_STATUS.APPROVED ? "status-active" : "status-inactive"}`}>{record.status ?? "Unknown"}</span>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="resignation.approve"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label="Manage approval" onClick={() => { setApprovalServerErrors({}); setApprovalRecord(record); }}><IconCheckSquare /></button></Can>
                            <Can permission="resignation.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label="Edit resignation" onClick={() => openEditModal(record)}><IconEdit /></button></Can>
                            <Can permission="resignation.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label="Delete resignation" onClick={() => setRecordToDelete(record)}><IconTrash /></button></Can>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
          </>
        )}
      </div>

      <Toast notifications={notifications} onDismiss={dismiss} />

      <ResignationFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingRecord ? resignationToFormValues(editingRecord) : undefined}
        staff={staff}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ResignationApprovalModal
        open={approvalRecord !== null}
        record={approvalRecord}
        staff={staff}
        staffLoading={staffLoading}
        designations={designations}
        designationsLoading={lookupsLoading}
        submitting={approvalSubmitting}
        serverErrors={approvalServerErrors}
        onSubmit={handleApprovalSubmit}
        onCancel={() => setApprovalRecord(null)}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete resignation?"
        message="This will permanently delete this resignation record. Only Pending resignations can be deleted."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default ResignationsPage;
