import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import HolidayFormModal from "../components/HolidayFormModal";
import { useHolidays } from "../hooks/useHolidays";
import { useNotification } from "../hooks/useNotification";
import { holidayAPI } from "../services/holiday.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import {
  holidayToFormValues,
  toCreatePayload,
  toUpdatePayload,
} from "../services/holiday.validation";
import type { Holiday, HolidayFormValues } from "../services/holiday.types";
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

const IconCalendar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
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

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

const HolidaysPage: React.FC = () => {
  const {
    holidays,
    meta,
    page,
    setPage,
    search,
    changeSearch,
    loading,
    error,
    refetch,
  } = useHolidays();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingHoliday(null);
    setServerErrors({});
    setModalOpen(true);
  };

  const openEditModal = (holiday: Holiday) => {
    setModalMode("edit");
    setEditingHoliday(holiday);
    setServerErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingHoliday(null);
  };

  const handleSubmit = async (values: HolidayFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        const res = await holidayAPI.create(toCreatePayload(values));
        notifySuccess(`"${res.data.holiday_name}" was added successfully.`);
      } else if (editingHoliday) {
        const res = await holidayAPI.update(editingHoliday.id, toUpdatePayload(values));
        notifySuccess(`"${res.data.holiday_name}" was updated successfully.`);
      }
      setModalOpen(false);
      setEditingHoliday(null);
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
    if (!holidayToDelete) return;
    setDeleteLoading(true);
    try {
      await holidayAPI.remove(holidayToDelete.id);
      notifySuccess(`"${holidayToDelete.holiday_name}" was deleted successfully.`);
      setHolidayToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && holidays.length === 0 && !error;
  const showErrorState = !loading && error && holidays.length === 0;
  const showEmptyState = !loading && !error && holidays.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Holidays</span>
            </nav>
            <h1 className="hr-page-title">Holidays</h1>
          </div>

          <Can permission="holiday.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
            <IconPlus />
            Add Holiday
          </button></Can>
        </div>


        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search holidays by name…" />
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap">
                <span className="spinner" />
              </span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                Loading holidays…
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
              <p className="hr-state-title">Couldn't load holidays</p>
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
                <IconCalendar />
              </div>
              <p className="hr-state-title">
                {search ? "No matching holidays" : "No holidays yet"}
              </p>
              <p className="hr-state-message">
                {search
                  ? `No holidays match "${search}". Try a different search term.`
                  : "Get started by adding your first holiday."}
              </p>
              {!search && (
                <Can permission="holiday.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
                  <IconPlus />
                  Add Holiday
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
                      <th>Holiday</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Days</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.map((holiday) => (
                      <tr key={holiday.id}>
                        <td className="hr-table-name">{holiday.holiday_name}</td>
                        <td>{formatDate(holiday.start_date)}</td>
                        <td>{formatDate(holiday.end_date)}</td>
                        <td>{holiday.days}</td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="holiday.update"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon"
                              aria-label={`Edit ${holiday.holiday_name}`}
                              onClick={() => openEditModal(holiday)}
                            >
                              <IconEdit />
                            </button></Can>
                            <Can permission="holiday.delete"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn"
                              aria-label={`Delete ${holiday.holiday_name}`}
                              onClick={() => setHolidayToDelete(holiday)}
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

      <HolidayFormModal
        key={modalMode === "edit" && editingHoliday ? `edit-${editingHoliday.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingHoliday ? holidayToFormValues(editingHoliday) : undefined}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={holidayToDelete !== null}
        title="Delete holiday?"
        message={
          holidayToDelete
            ? `This will permanently remove "${holidayToDelete.holiday_name}" from the holiday calendar. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setHolidayToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default HolidaysPage;