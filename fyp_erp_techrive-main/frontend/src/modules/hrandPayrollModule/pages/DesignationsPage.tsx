import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import DesignationFormModal from "../components/DesignationFormModal";
import { useDesignations } from "../hooks/useDesignations";
import { useNotification } from "../hooks/useNotification";
import { designationAPI } from "../services/designation.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import {
  designationToFormValues,
  toCreatePayload,
  toUpdatePayload,
} from "../services/designation.validation";
import type { Designation, DesignationFormValues } from "../services/designation.types";
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

const IconGrid = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
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

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

// ─── DesignationsPage ────────────────────────────────────────────────────
// Manages the designation master table — the source of the Employee form's
// "Designation" suggestion list. Employees store designation as free text
// (see designation.constants.ts on the backend), so deleting a designation
// here never affects existing employee records, only future suggestions.
const DesignationsPage: React.FC = () => {
  const {
    designations,
    meta,
    page,
    setPage,
    search,
    changeSearch,
    loading,
    error,
    refetch,
  } = useDesignations();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [designationToDelete, setDesignationToDelete] = useState<Designation | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingDesignation(null);
    setServerErrors({});
    setModalOpen(true);
  };

  const openEditModal = (designation: Designation) => {
    setModalMode("edit");
    setEditingDesignation(designation);
    setServerErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingDesignation(null);
  };

  const handleSubmit = async (values: DesignationFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        const res = await designationAPI.create(toCreatePayload(values));
        notifySuccess(`"${res.data.name}" was added successfully.`);
      } else if (editingDesignation) {
        const res = await designationAPI.update(editingDesignation.id, toUpdatePayload(values));
        notifySuccess(`"${res.data.name}" was updated successfully.`);
      }
      setModalOpen(false);
      setEditingDesignation(null);
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
    if (!designationToDelete) return;
    setDeleteLoading(true);
    try {
      await designationAPI.remove(designationToDelete.id);
      notifySuccess(`"${designationToDelete.name}" was deleted successfully.`);
      setDesignationToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && designations.length === 0 && !error;
  const showErrorState = !loading && error && designations.length === 0;
  const showEmptyState = !loading && !error && designations.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Designations</span>
            </nav>
            <h1 className="hr-page-title">Designations</h1>
          </div>

          <Can permission="designation.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
            <IconPlus />
            Add Designation
          </button></Can>
        </div>

        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search designations by name…" />
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap">
                <span className="spinner" />
              </span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                Loading designations…
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
              <p className="hr-state-title">Couldn't load designations</p>
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
                <IconGrid />
              </div>
              <p className="hr-state-title">
                {search ? "No matching designations" : "No designations yet"}
              </p>
              <p className="hr-state-message">
                {search
                  ? `No designations match "${search}". Try a different search term.`
                  : "Get started by adding your first designation — these populate the Designation suggestions on the Employee form."}
              </p>
              {!search && (
                <Can permission="designation.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
                  <IconPlus />
                  Add Designation
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
                      <th>Description</th>
                      <th>Created</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {designations.map((designation) => (
                      <tr key={designation.id}>
                        <td className="hr-table-name">{designation.name}</td>
                        <td>
                          {designation.description
                            ? designation.description.length > 80
                              ? `${designation.description.slice(0, 80)}…`
                              : designation.description
                            : "—"}
                        </td>
                        <td>{formatDate(designation.created_at)}</td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="designation.update"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon"
                              aria-label={`Edit ${designation.name}`}
                              onClick={() => openEditModal(designation)}
                            >
                              <IconEdit />
                            </button></Can>
                            <Can permission="designation.delete"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn"
                              aria-label={`Delete ${designation.name}`}
                              onClick={() => setDesignationToDelete(designation)}
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

      <DesignationFormModal
        key={modalMode === "edit" && editingDesignation ? `edit-${editingDesignation.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        editingId={editingDesignation?.id}
        initialValues={editingDesignation ? designationToFormValues(editingDesignation) : undefined}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={designationToDelete !== null}
        title="Delete designation?"
        message={
          designationToDelete
            ? `This will delete "${designationToDelete.name}". Existing employees with this designation keep it unchanged — this only removes it from future suggestions.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setDesignationToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default DesignationsPage;
