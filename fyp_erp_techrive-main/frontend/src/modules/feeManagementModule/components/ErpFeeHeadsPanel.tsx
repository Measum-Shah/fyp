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
  FeeTextarea,
} from "./FeeUI";

const isActiveStatus = (value: unknown) =>
  value === 1 || value === "1" || value === true;

type Props = {
  showAlert: (type: "success" | "error" | "info", message: string) => void;
  setConfirm: React.Dispatch<React.SetStateAction<ConfirmState>>;
  onChanged: () => void;
};

export const ErpFeeHeadsPanel: React.FC<Props> = ({
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
    description: "",
    status: "1",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeAPI.listErpFeeHeads({
        search: search || undefined,
        limit: 100,
      });
      setRows(res.data.data.items || []);
    } catch (err) {
      showAlert("error", getErrorMessage(err, "Failed to load ERP fee heads"));
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
      description: "",
      status: "1",
    });
    setModalOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditing(row);
    setForm({
      title: String(row.title || ""),
      description: String(row.description || ""),
      status: String(row.status ?? "1"),
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
        description: form.description?.trim() || null,
        status: Number(form.status),
      };
      if (editing) {
        await feeAPI.updateErpFeeHead(Number(editing.id), body);
        showAlert("success", "ERP fee head updated successfully");
      } else {
        await feeAPI.createErpFeeHead(body);
        showAlert("success", "ERP fee head created successfully");
      }
      setModalOpen(false);
      await load();
      onChanged();
    } catch (err) {
      showAlert("error", getErrorMessage(err, "Failed to save ERP fee head"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="fee-panel-header">
        <div>
          <h3>ERP Fee Heads</h3>
          <p>Configure parent fee head categories used as parents when creating Fee Types.</p>
        </div>
        <div className="fee-panel-actions">
          <FeeInput
            placeholder="Search ERP fee heads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="fee-btn fee-btn-primary"
            onClick={openCreate}
          >
            + Add ERP Fee Head
          </button>
        </div>
      </div>

      <FeeTable
        loading={loading}
        rows={rows}
        rowKey={(r) => Number(r.id)}
        emptyTitle="No ERP fee heads found"
        emptyDescription="Create your first ERP fee head to use as a parent category for Fee Types."
        columns={[
          {
            key: "id",
            header: "#",
            render: (r) => (
              <span className="font-mono text-xs font-semibold text-gray-500">
                #{String(r.id)}
              </span>
            ),
          },
          {
            key: "title",
            header: "Title",
            render: (r) => (
              <span className="font-medium text-gray-900">{String(r.title || "—")}</span>
            ),
          },
          {
            key: "description",
            header: "Description",
            render: (r) => (
              <span className="text-sm text-gray-600">{String(r.description || "—")}</span>
            ),
          },
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
                        ? "Deactivate ERP Fee Head"
                        : "Activate ERP Fee Head",
                      message: `Are you sure you want to ${
                        isActiveStatus(r.status) ? "deactivate" : "activate"
                      } "${r.title}"?`,
                      onConfirm: async () => {
                        await feeAPI.toggleErpFeeHead(
                          Number(r.id),
                          isActiveStatus(r.status) ? 0 : 1
                        );
                        showAlert(
                          "success",
                          `ERP fee head ${isActiveStatus(r.status) ? "deactivated" : "activated"}`
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
                      title: "Delete ERP Fee Head",
                      message: `Permanently delete "${r.title}"? This will fail if any Fee Types are using it as a parent.`,
                      danger: true,
                      onConfirm: async () => {
                        await feeAPI.deleteErpFeeHead(Number(r.id));
                        showAlert("success", "ERP fee head deleted successfully");
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
        title={editing ? "Edit ERP Fee Head" : "Create ERP Fee Head"}
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
          <FeeField label="Title" required>
            <FeeInput
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Tuition Fee, Exam Fee, Security Deposit"
            />
          </FeeField>
          <FeeField label="Description">
            <FeeTextarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description or remarks"
              rows={3}
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
