import { useCallback, useRef, useState } from "react";
import { NOTIFICATION_TIMEOUT_MS } from "../services/employee.constants";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

// ─── useNotification ─────────────────────────────────────────────────────────
// Small local toast-queue hook. Each page that needs notifications calls this
// once and renders <Toast notifications={...} onDismiss={...} />. Kept
// per-page (not a global provider) so nothing outside hrandPayrollModule
// needs to change to support it.
export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (type: NotificationType, message: string) => {
      const id = nextId.current++;
      setNotifications((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => dismiss(id), NOTIFICATION_TIMEOUT_MS);
    },
    [dismiss]
  );

  const notifySuccess = useCallback(
    (message: string) => notify("success", message),
    [notify]
  );

  const notifyError = useCallback(
    (message: string) => notify("error", message),
    [notify]
  );

  const notifyWarning = useCallback(
    (message: string) => notify("warning", message),
    [notify]
  );

  const notifyInfo = useCallback(
    (message: string) => notify("info", message),
    [notify]
  );

  return { notifications, notifySuccess, notifyError, notifyWarning, notifyInfo, dismiss };
};