import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import BranchFormModal from "../components/BranchFormModal";
import { useBranches } from "../hooks/useBranches";
import { useCompanies } from "../hooks/useCompanies";
import { useNotification } from "../hooks/useNotification";
import { branchAPI } from "../services/branch.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import {
  branchToFormValues,
  toCreatePayload,
  toUpdatePayload,
} from "../services/branch.validation";
import { BRANCH_STATUS } from "../services/branch.types";
import type { Branch, BranchFormValues } from "../services/branch.types";
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

const IconBuilding = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="1" />
    <line x1="9" y1="7" x2="9" y2="7.01" />
    <line x1="15" y1="7" x2="15" y2="7.01" />
    <line x1="9" y1="11" x2="9" y2="11.01" />
    <line x1="15" y1="11" x2="15" y2="11.01" />
    <line x1="9" y1="15" x2="9" y2="15.01" />
    <line x1="15" y1="15" x2="15" y2="15.01" />
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

const BranchesPage: React.FC = () => {
  const {
    branches,
    meta,
    page,
    setPage,
    search,
    changeSearch,
    loading,
    error,
    refetch,
  } = useBranches();
  const { companies } = useCompanies();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingBranch(null);
    setServerErrors({});
    setModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setModalMode("edit");
    setEditingBranch(branch);
    setServerErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingBranch(null);
  };

  const handleSubmit = async (values: BranchFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        const res = await branchAPI.create(toCreatePayload(values));
        notifySuccess(`"${res.data.name}" was added successfully.`);
      } else if (editingBranch) {
        const res = await branchAPI.update(editingBranch.id, toUpdatePayload(values));
        notifySuccess(`"${res.data.name}" was updated successfully.`);
      }
      setModalOpen(false);
      setEditingBranch(null);
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
    if (!branchToDelete) return;
    setDeleteLoading(true);
    try {
      await branchAPI.remove(branchToDelete.id);
      notifySuccess(`"${branchToDelete.name}" was deleted successfully.`);
      setBranchToDelete(null);
      refetch();
    } catch (err) {
      // Includes the "still has employees assigned" 409 case from the backend
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && branches.length === 0 && !error;
  const showErrorState = !loading && error && branches.length === 0;
  const showEmptyState = !loading && !error && branches.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Campuses</span>
            </nav>
            <h1 className="hr-page-title">Campuses</h1>
          </div>

          <Can permission="branch.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
            <IconPlus />
            Add Campus
          </button></Can>
        </div>


        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search campuses by name or email…" />
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap">
                <span className="spinner" />
              </span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                Loading campuses…
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
              <p className="hr-state-title">Couldn't load campuses</p>
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
                <IconBuilding />
              </div>
              <p className="hr-state-title">
                {search ? "No matching campuses" : "No campuses yet"}
              </p>
              <p className="hr-state-message">
                {search
                  ? `No campuses match "${search}". Try a different search term.`
                  : "Get started by adding your first campus."}
              </p>
              {!search && (
                <Can permission="branch.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
                  <IconPlus />
                  Add Campus
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
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map((branch) => (
                      <tr key={branch.id}>
                        <td className="hr-table-name">{branch.name}</td>
                        <td>{branch.phone}</td>
                        <td>{branch.email}</td>
                        <td>
                          <span
                            className={`profile-status ${
                              branch.status === BRANCH_STATUS.ACTIVE
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            {branch.status === BRANCH_STATUS.ACTIVE ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="branch.update"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon"
                              aria-label={`Edit ${branch.name}`}
                              onClick={() => openEditModal(branch)}
                            >
                              <IconEdit />
                            </button></Can>
                            <Can permission="branch.delete"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn"
                              aria-label={`Delete ${branch.name}`}
                              onClick={() => setBranchToDelete(branch)}
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

      <BranchFormModal
        key={modalMode === "edit" && editingBranch ? `edit-${editingBranch.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingBranch ? branchToFormValues(editingBranch) : undefined}
        companies={companies}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={branchToDelete !== null}
        title="Delete campus?"
        message={
          branchToDelete
            ? `This will deactivate "${branchToDelete.name}". This can be reviewed later, but if any employees are still assigned to this campus, the deletion will be blocked.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setBranchToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default BranchesPage;