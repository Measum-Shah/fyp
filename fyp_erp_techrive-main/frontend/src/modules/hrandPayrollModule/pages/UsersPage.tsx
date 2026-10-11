import React, { useState } from "react";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import UserFormModal from "../components/UserFormModal";
import ResetPasswordModal from "../components/ResetPasswordModal";
import { Can } from "../components/Can";
import { useUsers } from "../hooks/useUsers";
import { useNotification } from "../hooks/useNotification";
import { userAPI } from "../services/user.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import type { User, UserFormValues } from "../services/user.types";
import "./employee-module.css";

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
  </svg>
);
const IconKey = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
);
const IconPower = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);
const IconUsers = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// ─── UsersPage ────────────────────────────────────────────────────────────────
// Creates/edits login accounts (erp_users). Access to the HR & Payroll
// module is decided entirely by an account's "Account Type" (user_type) —
// admin/hr get in, everything else doesn't (see hrAccess.middleware.ts on
// the backend and App.tsx's ProtectedRoute adminOnly on the frontend).
const UsersPage: React.FC = () => {
  const { users, meta, page, setPage, search, changeSearch, loading, error, refetch } = useUsers();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);

  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [toggling, setToggling] = useState(false);

  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingUser(undefined);
    setServerErrors({});
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setModalMode("edit");
    setEditingUser(user);
    setServerErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingUser(undefined);
  };

  const handleSubmit = async (values: UserFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        branch_id: values.branch_id ? Number(values.branch_id) : null,
        employee_id: values.employee_id ? Number(values.employee_id) : null,
        user_type: values.user_type,
      };

      if (modalMode === "create") {
        await userAPI.create({ ...payload, password: values.password, active: 1 });
        notifySuccess("User created successfully.");
      } else if (editingUser) {
        await userAPI.update(editingUser.id, payload);
        notifySuccess("User updated successfully.");
      }
      setModalOpen(false);
      setEditingUser(undefined);
      refetch();
    } catch (err) {
      setServerErrors(getApiFieldErrors(err) ?? {});
      notifyError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (password: string) => {
    if (!resetPasswordUser) return;
    setResettingPassword(true);
    try {
      await userAPI.resetPassword(resetPasswordUser.id, password);
      notifySuccess(`Password reset for ${resetPasswordUser.name}.`);
      setResetPasswordUser(null);
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setResettingPassword(false);
    }
  };

  const handleToggleActive = async () => {
    if (!userToToggle) return;
    setToggling(true);
    try {
      const nextActive = userToToggle.active === 1 ? 0 : 1;
      await userAPI.update(userToToggle.id, { active: nextActive });
      notifySuccess(nextActive === 1 ? "User reactivated." : "User deactivated.");
      setUserToToggle(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await userAPI.remove(userToDelete.id);
      notifySuccess("User deleted successfully.");
      setUserToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const showBigLoadingState = loading && users.length === 0;
  const showErrorState = !loading && !!error;
  const showEmptyState = !loading && !error && users.length === 0;
  const showTable = !showBigLoadingState && !showErrorState && !showEmptyState;

  return (
    <div className="hr-page">
      <div className="hr-page-inner">
        <div className="hr-page-header">
          <div>
            <h1 className="hr-page-title">Users</h1>
            <p className="hr-page-subtitle">
              Create and manage login accounts for the HR & Payroll module.
            </p>
          </div>
          <Can permission="user.create">
            <button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
              <IconPlus />
              Create User
            </button>
          </Can>
        </div>

        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search by name or email…" />
        </div>

        <div className="hr-table-wrap">
          {showBigLoadingState && (
            <div className="hr-state">
              <span className="spinner" />
              <p className="hr-state-message">Loading users…</p>
            </div>
          )}

          {showErrorState && (
            <div className="hr-state hr-state-error">
              <div className="hr-state-icon"><IconUsers /></div>
              <p className="hr-state-title">Couldn't load users</p>
              <p className="hr-state-message">{error}</p>
              <button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>
                Try again
              </button>
            </div>
          )}

          {showEmptyState && (
            <div className="hr-state">
              <div className="hr-state-icon"><IconUsers /></div>
              <p className="hr-state-title">No users found</p>
              <p className="hr-state-message">
                {search ? "Try a different search." : "Create the first login account to get started."}
              </p>
              {!search && (
                <Can permission="user.create">
                  <button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
                    <IconPlus />
                    Create User
                  </button>
                </Can>
              )}
            </div>
          )}

          {showTable && (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Campus</th>
                  <th>Linked Employee</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.branch_name ?? "—"}</td>
                    <td>{user.employee_name ?? <span className="hr-field-hint">Not linked</span>}</td>
                    <td>
                      <span className={`hr-badge ${user.active === 1 ? "status-active" : "hr-badge-neutral"}`}>
                        {user.active === 1 ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td>
                      <div className="hr-table-actions">
                        <Can permission="user.update">
                          <button
                            type="button"
                            className="hr-btn hr-btn-ghost hr-btn-icon"
                            aria-label={`Edit ${user.name}`}
                            onClick={() => openEditModal(user)}
                          >
                            <IconEdit />
                          </button>
                        </Can>
                        <Can permission="user.reset_password">
                          <button
                            type="button"
                            className="hr-btn hr-btn-ghost hr-btn-icon"
                            aria-label={`Reset password for ${user.name}`}
                            onClick={() => setResetPasswordUser(user)}
                          >
                            <IconKey />
                          </button>
                        </Can>
                        <Can permission="user.update">
                          <button
                            type="button"
                            className="hr-btn hr-btn-ghost hr-btn-icon"
                            aria-label={user.active === 1 ? `Deactivate ${user.name}` : `Reactivate ${user.name}`}
                            onClick={() => setUserToToggle(user)}
                          >
                            <IconPower />
                          </button>
                        </Can>
                        <Can permission="user.delete">
                          <button
                            type="button"
                            className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn"
                            aria-label={`Delete ${user.name}`}
                            onClick={() => setUserToDelete(user)}
                          >
                            <IconTrash />
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showTable && meta.totalPages > 1 && (
          <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
        )}
      </div>

      <UserFormModal
        open={modalOpen}
        mode={modalMode}
        user={editingUser}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ResetPasswordModal
        open={!!resetPasswordUser}
        user={resetPasswordUser}
        submitting={resettingPassword}
        onSubmit={handleResetPassword}
        onCancel={() => setResetPasswordUser(null)}
      />

      <ConfirmDialog
        open={!!userToToggle}
        title={userToToggle?.active === 1 ? "Deactivate user" : "Reactivate user"}
        message={
          userToToggle?.active === 1
            ? `Deactivate "${userToToggle?.name}"? They will no longer be able to log in until reactivated.`
            : `Reactivate "${userToToggle?.name}"? They will be able to log in again.`
        }
        confirmLabel={userToToggle?.active === 1 ? "Deactivate" : "Reactivate"}
        danger={userToToggle?.active === 1}
        loading={toggling}
        onConfirm={handleToggleActive}
        onCancel={() => setUserToToggle(null)}
      />

      <ConfirmDialog
        open={!!userToDelete}
        title="Delete user"
        message={`Permanently delete "${userToDelete?.name}"? This cannot be undone — consider Deactivate instead if you might need this account again.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setUserToDelete(null)}
      />

      <Toast notifications={notifications} onDismiss={dismiss} />
    </div>
  );
};

export default UsersPage;
