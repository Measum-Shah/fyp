import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import BankAccountFormModal from "../components/BankAccountFormModal";
import { useBankAccounts } from "../hooks/useBankAccounts";
import { useStaffLookup } from "../hooks/useStaffLookup";
import { useNotification } from "../hooks/useNotification";
import { bankAccountAPI } from "../services/bankAccount.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import {
  bankAccountToFormValues,
  toCreatePayload,
  toUpdatePayload,
} from "../services/bankAccount.validation";
import { BANK_ACCOUNT_STATUS } from "../services/bankAccount.types";
import type { BankAccount, BankAccountFormValues } from "../services/bankAccount.types";
import "./employee-module.css";
import { Can } from "../components/Can";

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconBank = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="21" x2="21" y2="21" />
    <line x1="5" y1="21" x2="5" y2="10" />
    <line x1="19" y1="21" x2="19" y2="10" />
    <polygon points="12 3 21 9 3 9" />
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

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const BankAccountsPage: React.FC = () => {
  const { bankAccounts, meta, page, setPage, search, changeSearch, loading, error, refetch } =
    useBankAccounts();
  const { staff } = useStaffLookup();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<BankAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [recordToDelete, setRecordToDelete] = useState<BankAccount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingRecord(null);
    setServerErrors({});
    setModalOpen(true);
  };

  const openEditModal = (record: BankAccount) => {
    setModalMode("edit");
    setEditingRecord(record);
    setServerErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingRecord(null);
  };

  const handleSubmit = async (values: BankAccountFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        const res = await bankAccountAPI.create(toCreatePayload(values));
        notifySuccess(`Bank account "${res.data.account_title}" was added successfully.`);
      } else if (editingRecord) {
        const res = await bankAccountAPI.update(editingRecord.id, toUpdatePayload(values));
        notifySuccess(`Bank account "${res.data.account_title}" was updated successfully.`);
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

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    setDeleteLoading(true);
    try {
      await bankAccountAPI.remove(recordToDelete.id);
      notifySuccess(`Bank account "${recordToDelete.account_title}" was deleted successfully.`);
      setRecordToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && bankAccounts.length === 0 && !error;
  const showErrorState = !loading && error && bankAccounts.length === 0;
  const showEmptyState = !loading && !error && bankAccounts.length === 0;
  const showTable = !showBigLoadingState && !showErrorState && !showEmptyState;

  return (
    <div className="hr-page">
      <div className="hr-page-inner">
        <div className="hr-page-header">
          <div>
            <nav className="breadcrumb">
              <Link to="/dashboard" className="breadcrumb-item">
                <IconHome /> Dashboard
              </Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item">HR &amp; Payroll</span>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item breadcrumb-current">Bank Accounts</span>
            </nav>
            <h1 className="hr-page-title">Bank Accounts</h1>
          </div>

          <Can permission="bank_account.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
            <IconPlus />
            Add Bank Account
          </button></Can>
        </div>


        <div className="hr-page-toolbar">
          <SearchBar
            value={search}
            onChange={changeSearch}
            placeholder="Search by account title, number, or branch…"
          />
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap">
                <span className="spinner" />
              </span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                Loading bank accounts…
              </p>
            </div>
          </div>
        )}

        {showErrorState && (
          <div className="hr-table-wrap">
            <div className="hr-state hr-state-error">
              <div className="hr-state-icon">
                <IconAlertTriangle />
              </div>
              <p className="hr-state-title">Couldn't load bank accounts</p>
              <p className="hr-state-message">{error}</p>
              <button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>
                Try again
              </button>
            </div>
          </div>
        )}

        {showEmptyState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <div className="hr-state-icon">
                <IconBank />
              </div>
              <p className="hr-state-title">
                {search ? "No matching bank accounts" : "No bank accounts yet"}
              </p>
              <p className="hr-state-message">
                {search
                  ? `No bank accounts match "${search}". Try a different search term.`
                  : "Add an employee's disbursement account to get started."}
              </p>
              {!search && (
                <Can permission="bank_account.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
                  <IconPlus />
                  Add Bank Account
                </button></Can>
              )}
            </div>
          </div>
        )}

        {showTable && (
          <>
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
              <div className="hr-table-wrap">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Employee (Reg. No.)</th>
                      <th>Account Title</th>
                      <th>Account Number</th>
                      <th>Bank Branch</th>
                      <th>Status</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankAccounts.map((record) => (
                      <tr key={record.id}>
                        <td className="hr-table-name">{record.staff_reg_no ?? "—"}</td>
                        <td>{record.account_title}</td>
                        <td>{record.account_number}</td>
                        <td>{record.bank_branch}</td>
                        <td>
                          <span
                            className={`profile-status ${
                              record.status === BANK_ACCOUNT_STATUS.ACTIVE
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            {record.status ?? "Unknown"}
                          </span>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="bank_account.update"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon"
                              aria-label={`Edit ${record.account_title}`}
                              onClick={() => openEditModal(record)}
                            >
                              <IconEdit />
                            </button></Can>
                            <Can permission="bank_account.delete"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn"
                              aria-label={`Delete ${record.account_title}`}
                              onClick={() => setRecordToDelete(record)}
                            >
                              <IconTrash />
                            </button></Can>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <Toast notifications={notifications} onDismiss={dismiss} />

      <BankAccountFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingRecord ? bankAccountToFormValues(editingRecord) : undefined}
        staff={staff}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete bank account?"
        message={
          recordToDelete
            ? `This will permanently delete the bank account "${recordToDelete.account_title}". This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default BankAccountsPage;
