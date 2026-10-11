import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmployeeTable from "../components/EmployeeTable";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import { useEmployees } from "../hooks/useEmployees";
import { useLookups } from "../hooks/useLookups";
import { useNotification } from "../hooks/useNotification";
import { employeeAPI, getApiErrorMessage } from "../services/employee.service";
import type { Employee } from "../services/employee.types";
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

const IconUsers = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

const employeeDisplayName = (employee: Employee): string => {
  const parts = [employee.first_name, employee.last_name].filter(
    (p): p is string => Boolean(p && p.trim())
  );
  return parts.length > 0 ? parts.join(" ") : employee.email;
};

const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    employees,
    meta,
    page,
    setPage,
    search,
    changeSearch,
    loading,
    error,
    refetch,
  } = useEmployees();
  const { departments } = useLookups();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const departmentNameById = useMemo(() => {
    const map = new Map<number, string>();
    departments.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setDeleteLoading(true);
    try {
      await employeeAPI.remove(employeeToDelete.id);
      notifySuccess(`${employeeDisplayName(employeeToDelete)} was deleted successfully.`);
      setEmployeeToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && employees.length === 0 && !error;
  const showErrorState = !loading && error && employees.length === 0;
  const showEmptyState = !loading && !error && employees.length === 0;
  const showTable = !showBigLoadingState && !showErrorState && !showEmptyState;

  return (
    <div className="hr-page">
      <div className="hr-page-inner">
        {/* ── Breadcrumb / Header ──────────────────────────────────────── */}
        <div className="hr-page-header">
          <div>
            <nav className="breadcrumb">
              <Link to="/dashboard" className="breadcrumb-item">
                <IconHome /> Dashboard
              </Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item">HR &amp; Payroll</span>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item breadcrumb-current">Employees</span>
            </nav>
            <h1 className="hr-page-title">Employees</h1>
          </div>

          <Can permission="employee.create">
            <Link to="/hr/employees/new" className="hr-btn hr-btn-primary">
              <IconPlus />
              Add Employee
            </Link>
          </Can>
        </div>


        {/* ── Toolbar ──────────────────────────────────────────────────── */}
        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} />
        </div>

        {/* ── Content ──────────────────────────────────────────────────── */}
        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap">
                <span className="spinner" />
              </span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                Loading employees…
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
              <p className="hr-state-title">Couldn't load employees</p>
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
                <IconUsers />
              </div>
              <p className="hr-state-title">
                {search ? "No matching employees" : "No employees yet"}
              </p>
              <p className="hr-state-message">
                {search
                  ? `No employees match "${search}". Try a different search term.`
                  : "Get started by adding your first employee record."}
              </p>
              {!search && (
                <Can permission="employee.create">
                  <Link to="/hr/employees/new" className="hr-btn hr-btn-primary">
                    <IconPlus />
                    Add Employee
                  </Link>
                </Can>
              )}
            </div>
          </div>
        )}

        {showTable && (
          <>
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
              <EmployeeTable
                employees={employees}
                departmentNameById={departmentNameById}
                onView={(employee) => navigate(`/hr/employees/${employee.id}`)}
                onEdit={(employee) => navigate(`/hr/employees/${employee.id}?tab=basic`)}
                onDeleteClick={(employee) => setEmployeeToDelete(employee)}
              />
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

      <ConfirmDialog
        open={employeeToDelete !== null}
        title="Delete employee?"
        message={
          employeeToDelete
            ? `This will deactivate ${employeeDisplayName(employeeToDelete)} (${
                employeeToDelete.reg_no ?? "no ID"
              }). This can be reviewed later, but they will no longer appear in the active employee list.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setEmployeeToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default EmployeeListPage;