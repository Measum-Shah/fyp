import React from "react";
import StatusBadge from "./StatusBadge";
import EmployeeAvatar from "./EmployeeAvatar";
import { resolveEmployeeFileUrl } from "../services/employee.service";
import type { Employee } from "../services/employee.types";
import { Can } from "./Can";

interface EmployeeTableProps {
  employees: Employee[];
  departmentNameById: Map<number, string>;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDeleteClick: (employee: Employee) => void;
}

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
    <circle cx="12" cy="12" r="3" />
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

const formatJoinDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const displayName = (employee: Employee): string => {
  const parts = [employee.first_name, employee.middle_name, employee.last_name].filter(
    (p): p is string => Boolean(p && p.trim())
  );
  return parts.length > 0 ? parts.join(" ") : "—";
};

// Purely presentational — all data-fetching and dialog/notification state
// lives in EmployeeListPage. department_id -> name resolution is passed in
// as a Map (built from useLookups' departments list) rather than fetched
// here, so this component has a single responsibility: render rows.
const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  departmentNameById,
  onView,
  onEdit,
  onDeleteClick,
}) => {
  return (
    <div className="hr-table-wrap">
      <table className="hr-table">
        <thead>
          <tr>
            <th className="hr-table-avatar-col">Photo</th>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Join Date</th>
            <th>Status</th>
            <th className="hr-table-actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td className="hr-table-avatar-col">
                <EmployeeAvatar
                  name={displayName(employee) !== "—" ? displayName(employee) : employee.email}
                  imageUrl={resolveEmployeeFileUrl(employee.staff_image)}
                  size="sm"
                  viewHref={resolveEmployeeFileUrl(employee.staff_image)}
                />
              </td>
              <td className="hr-table-mono">{employee.reg_no ?? "—"}</td>
              <td className="hr-table-name">{displayName(employee)}</td>
              <td>{employee.email}</td>
              <td>{employee.mobile_1 ?? "—"}</td>
              <td>
                {employee.department_id != null
                  ? departmentNameById.get(employee.department_id) ??
                    `#${employee.department_id}`
                  : "—"}
              </td>
              <td>{employee.designation ?? "—"}</td>
              <td>{formatJoinDate(employee.join_date)}</td>
              <td>
                <StatusBadge status={employee.status} />
              </td>
              <td>
                <div className="hr-table-actions">
                  <button
                    type="button"
                    className="hr-btn hr-btn-ghost hr-btn-icon"
                    aria-label={`View ${displayName(employee)}`}
                    onClick={() => onView(employee)}
                  >
                    <IconEye />
                  </button>
                  <Can permission="employee.update">
                    <button
                      type="button"
                      className="hr-btn hr-btn-ghost hr-btn-icon"
                      aria-label={`Edit ${displayName(employee)}`}
                      onClick={() => onEdit(employee)}
                    >
                      <IconEdit />
                    </button>
                  </Can>
                  <Can permission="employee.delete">
                    <button
                      type="button"
                      className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn"
                      aria-label={`Delete ${displayName(employee)}`}
                      onClick={() => onDeleteClick(employee)}
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
    </div>
  );
};

export default EmployeeTable;
