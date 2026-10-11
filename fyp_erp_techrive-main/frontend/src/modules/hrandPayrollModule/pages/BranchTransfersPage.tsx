import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import BranchTransferFormModal from "../components/BranchTransferFormModal";
import BranchTransferApprovalModal from "../components/BranchTransferApprovalModal";
import { useBranchTransfers } from "../hooks/useBranchTransfers";
import { useStaffLookup } from "../hooks/useStaffLookup";
import { useLookups } from "../hooks/useLookups";
import { useNotification } from "../hooks/useNotification";
import { branchTransferAPI } from "../services/branchTransfer.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import { branchTransferToFormValues, toCreatePayload, toUpdatePayload } from "../services/branchTransfer.validation";
import { APPROVAL_STATUS } from "../services/branchTransfer.types";
import type { BranchTransfer, BranchTransferFormValues, UpdateBranchTransferApprovalPayload } from "../services/branchTransfer.types";
import "./employee-module.css";
import { Can } from "../components/Can";

const IconHome = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>);
const IconPlus = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const IconShuffle = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>);
const IconAlertTriangle = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>);
const IconEdit = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>);
const IconTrash = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);
const IconCheckSquare = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>);

const BranchTransfersPage: React.FC = () => {
  const { transfers, meta, page, setPage, search, changeSearch, loading, error, refetch } = useBranchTransfers();
  const { staff, loading: staffLoading } = useStaffLookup();
  const { designations, loading: lookupsLoading } = useLookups();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<BranchTransfer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [approvalRecord, setApprovalRecord] = useState<BranchTransfer | null>(null);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [approvalServerErrors, setApprovalServerErrors] = useState<Record<string, string>>({});

  const [recordToDelete, setRecordToDelete] = useState<BranchTransfer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: BranchTransfer) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: BranchTransferFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await branchTransferAPI.create(toCreatePayload(values));
        notifySuccess("Campus transfer request was submitted successfully.");
      } else if (editingRecord) {
        await branchTransferAPI.update(editingRecord.id, toUpdatePayload(values));
        notifySuccess("Campus transfer was updated successfully.");
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

  const handleApprovalSubmit = async (payload: UpdateBranchTransferApprovalPayload) => {
    if (!approvalRecord) return;
    setApprovalSubmitting(true);
    setApprovalServerErrors({});
    try {
      const res = await branchTransferAPI.updateApproval(approvalRecord.id, payload);
      notifySuccess(
        res.data.status === APPROVAL_STATUS.APPROVED
          ? "Transfer approved — the employee has been moved to the destination campus."
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
      await branchTransferAPI.remove(recordToDelete.id);
      notifySuccess("Campus transfer was deleted successfully.");
      setRecordToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && transfers.length === 0 && !error;
  const showErrorState = !loading && error && transfers.length === 0;
  const showEmptyState = !loading && !error && transfers.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Campus Transfers</span>
            </nav>
            <h1 className="hr-page-title">Campus Transfers</h1>
          </div>
          <Can permission="branch_transfer.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />New Transfer Request</button></Can>
        </div>


        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search by reason…" />
        </div>

        {showBigLoadingState && (<div className="hr-table-wrap"><div className="hr-state"><span className="spinner-wrap"><span className="spinner" /></span><p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Loading campus transfers…</p></div></div>)}
        {showErrorState && (<div className="hr-table-wrap"><div className="hr-state hr-state-error"><div className="hr-state-icon"><IconAlertTriangle /></div><p className="hr-state-title">Couldn't load campus transfers</p><p className="hr-state-message">{error}</p><button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>Try again</button></div></div>)}
        {showEmptyState && (<div className="hr-table-wrap"><div className="hr-state"><div className="hr-state-icon"><IconShuffle /></div><p className="hr-state-title">{search ? "No matching transfers" : "No campus transfers yet"}</p><p className="hr-state-message">{search ? `No transfers match "${search}".` : "Request a campus transfer to get started."}</p>{!search && <Can permission="branch_transfer.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />New Transfer Request</button></Can>}</div></div>)}

        {showTable && (
          <>
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
              <div className="hr-table-wrap">
                <table className="hr-table">
                  <thead>
                    <tr><th>Reason</th><th>Date</th><th>Status</th><th className="hr-table-actions-col">Actions</th></tr>
                  </thead>
                  <tbody>
                    {transfers.map((record) => (
                      <tr key={record.id}>
                        <td className="hr-table-name">{record.reason}</td>
                        <td>{record.date ? record.date.slice(0, 10) : "—"}</td>
                        <td>
                          <span className={`profile-status ${record.status === APPROVAL_STATUS.APPROVED ? "status-active" : "status-inactive"}`}>{record.status ?? "Unknown"}</span>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="branch_transfer.approve"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label="Manage approval" onClick={() => { setApprovalServerErrors({}); setApprovalRecord(record); }}><IconCheckSquare /></button></Can>
                            <Can permission="branch_transfer.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label="Edit transfer" onClick={() => openEditModal(record)}><IconEdit /></button></Can>
                            <Can permission="branch_transfer.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label="Delete transfer" onClick={() => setRecordToDelete(record)}><IconTrash /></button></Can>
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

      <BranchTransferFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingRecord ? branchTransferToFormValues(editingRecord) : undefined}
        staff={staff}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <BranchTransferApprovalModal
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
        title="Delete transfer request?"
        message="This will permanently delete this transfer request. Only Pending transfers can be deleted."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default BranchTransfersPage;
