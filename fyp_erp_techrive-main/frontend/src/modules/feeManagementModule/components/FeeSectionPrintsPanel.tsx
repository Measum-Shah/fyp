import React, { useCallback, useEffect, useState } from "react";
import feeAPI from "../services/feeApi";
import { getErrorMessage } from "../hooks/useFeeLookups";
import type { ConfirmState } from "./FeeModulePanels";
import {
  FeeField,
  FeeInput,
  FeeModal,
  FeeSelect,
  FeeStatusBadge,
  FeeTable,
} from "./FeeUI";

const isActiveStatus = (value: unknown) =>
  value === 1 || value === "1" || value === true;

type Props = {
  showAlert: (type: "success" | "error" | "info", message: string) => void;
  setConfirm: React.Dispatch<React.SetStateAction<ConfirmState>>;
  onChanged: () => void;
};

export const FeeSectionPrintsPanel: React.FC<Props> = ({
  showAlert,
  setConfirm,
  onChanged,
}) => {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    status: "1",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeAPI.listSectionPrints({
        search: search || undefined,
        limit: 100,
      });
      setRows(res.data.data.items || []);
    } catch (err) {
      showAlert("error", getErrorMessage(err, "Failed to load fee section prints"));
    } finally {
      setLoading(false);
    }
  }, [search, showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: "",
      status: "1",
    });
    setModalOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditing(row);
    setForm({
      title: String(row.title || ""),
      status: String(row.status || "1"),
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      showAlert("error", "Title is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        status: form.status,
      };
      if (editing) {
        await feeAPI.updateSectionPrint(Number(editing.id), body);
        showAlert("success", "Fee section print ID updated successfully");
      } else {
        await feeAPI.createSectionPrint(body);
        showAlert("success", "Fee section print ID created successfully");
      }
      setModalOpen(false);
      await load();
      onChanged();
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="fee-panel-header">
        <div>
          <h3>Fee Section Print IDs</h3>
          <p>
            Configure print header categories and voucher print groups referenced by Fee Sections.
          </p>
        </div>
        <div className="fee-panel-actions">
          <FeeInput
            placeholder="Search print titles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="fee-btn fee-btn-primary"
            onClick={openCreate}
          >
            + Add Print ID
          </button>
        </div>
      </div>

      <FeeTable
        loading={loading}
        rows={rows}
        rowKey={(r) => Number(r.id)}
        emptyTitle="No fee section print IDs found"
        emptyDescription="Create your first print ID to configure voucher print grouping for fee sections."
        columns={[
          { key: "id", header: "Print ID", render: (r) => `#${r.id}` },
          { key: "title", header: "Title", render: (r) => String(r.title) },
          {
            key: "status",
            header: "Status",
            render: (r) => <FeeStatusBadge active={isActiveStatus(r.status)} />,
          },
          {
            key: "actions",
            header: "Actions",
            render: (r) => (
              <div className="fee-row-actions">
                <button
                  type="button"
                  className="fee-link-btn"
                  onClick={() => openEdit(r)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="fee-link-btn"
                  onClick={() =>
                    setConfirm({
                      open: true,
                      title: isActiveStatus(r.status)
                        ? "Deactivate print ID"
                        : "Activate print ID",
                      message: `Are you sure you want to ${
                        isActiveStatus(r.status) ? "deactivate" : "activate"
                      } “${r.title}”?`,
                      onConfirm: async () => {
                        await feeAPI.toggleSectionPrint(
                          Number(r.id),
                          isActiveStatus(r.status) ? "0" : "1"
                        );
                        showAlert(
                          "success",
                          `Print ID ${
                            isActiveStatus(r.status) ? "deactivated" : "activated"
                          }`
                        );
                        await load();
                        onChanged();
                      },
                    })
                  }
                >
                  {isActiveStatus(r.status) ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  className="fee-link-btn fee-link-danger"
                  onClick={() =>
                    setConfirm({
                      open: true,
                      title: "Delete print ID",
                      message: `Permanently delete “${r.title}” (#${r.id})? This will fail if any fee sections are currently using it.`,
                      danger: true,
                      onConfirm: async () => {
                        await feeAPI.deleteSectionPrint(Number(r.id));
                        showAlert("success", "Fee section print ID deleted");
                        await load();
                        onChanged();
                      },
                    })
                  }
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />

      <FeeModal
        open={modalOpen}
        title={editing ? "Edit Fee Section Print ID" : "Create Fee Section Print ID"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="fee-btn fee-btn-ghost"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="fee-btn fee-btn-primary"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="fee-form-grid">
          <FeeField label="Title" required hint="e.g. Academic Fees, Examination Fees, Facility Fees">
            <FeeInput
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Academic Fees"
              autoFocus
            />
          </FeeField>
          <FeeField label="Status">
            <FeeSelect
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              options={[
                { value: "1", label: "Active" },
                { value: "0", label: "Inactive" },
              ]}
              placeholder="Status"
            />
          </FeeField>
        </div>
      </FeeModal>
    </div>
  );
};
