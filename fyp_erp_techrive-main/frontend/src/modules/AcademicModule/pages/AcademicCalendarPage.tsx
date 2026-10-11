import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import API from "../../../api/api";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { toast } from "./AcademicLayout";
import { useRoleAccess } from "../hooks/useRoleAccess";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type EventSource = "calendar" | "holiday";

type CalendarEvent = {
  id: number;
  source: EventSource;
  title: string;
  start: string;
  end: string;
  type: string;
  color: string;
  branch_id: number | null;
  created_by: number | null;
  created_at: string;
};

type EventForm = {
  title: string;
  start: string;
  end: string;
  type: string;
  color: string;
};

const EVENT_TYPES = [
  "National Holiday",
  "Academic Event",
  "Exam Period",
  "Semester Break",
  "Other",
];

const EVENT_COLORS: { value: string; label: string; hex: string }[] = [
  { value: "green",  label: "Green",  hex: "#22c55e" },
  { value: "blue",   label: "Blue",   hex: "#3b82f6" },
  { value: "red",    label: "Red",    hex: "#ef4444" },
  { value: "orange", label: "Orange", hex: "#f97316" },
  { value: "purple", label: "Purple", hex: "#a855f7" },
  { value: "yellow", label: "Yellow", hex: "#eab308" },
];

const colorHex = (color: string) =>
  EVENT_COLORS.find((c) => c.value === color)?.hex ?? "#64748b";

const toInputDate = (iso: string) => iso ? iso.slice(0, 10) : "";

const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const emptyForm: EventForm = {
  title: "",
  start: "",
  end: "",
  type: "National Holiday",
  color: "green",
};

/* ─── Style helpers ─────────────────────────────────────────────────────────── */
const btn = (variant: "primary" | "secondary" | "danger"): React.CSSProperties => ({
  border: "none",
  borderRadius: "6px",
  padding: "0.6rem 1rem",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "0.85rem",
  ...(variant === "primary"  && { background: "var(--accent)", color: "#fff" }),
  ...(variant === "secondary" && { background: "var(--input-bg)", color: "var(--text-dark)", border: "1px solid var(--card-border)" }),
  ...(variant === "danger"   && { background: "var(--input-bg)", color: "var(--error)", border: "1px solid var(--error-border, #fca5a5)" }),
});

const getErr = (error: unknown, fallback: string) =>
  axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message || fallback
    : fallback;

/* ═══════════════════════════════════════════════════════════════════════════════
   MONTH GRID CALENDAR
═══════════════════════════════════════════════════════════════════════════════ */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function MonthGrid({
  year,
  month,
  events,
  onDayClick,
  onEventClick,
}: {
  year: number;
  month: number; // 0-indexed
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsOnDay = (day: number) => {
    const target = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => {
      const s = e.start.slice(0, 10);
      const en = e.end.slice(0, 10);
      return s <= target && target <= en;
    });
  };

  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  return (
    <div style={{ overflowX: "auto" }}>
      {/* Day headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px",
          marginBottom: "2px",
        }}
      >
        {DAYS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--text-dark-sub)",
              padding: "0.35rem 0",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px",
        }}
      >
        {cells.map((day, idx) => {
          if (!day) {
            return (
              <div
                key={`empty-${idx}`}
                style={{
                  minHeight: "90px",
                  background: "var(--input-bg)",
                  borderRadius: "6px",
                  opacity: 0.35,
                }}
              />
            );
          }
          const dayEvents = eventsOnDay(day);
          const todayCell = isToday(day);
          return (
            <div
              key={day}
              onClick={() => onDayClick(new Date(year, month, day))}
              style={{
                minHeight: "90px",
                background: todayCell ? "rgba(var(--accent-rgb,59,130,246),0.08)" : "var(--card-bg, var(--input-bg))",
                borderRadius: "6px",
                border: todayCell ? "1.5px solid var(--accent)" : "1px solid var(--card-border)",
                padding: "0.3rem",
                cursor: "pointer",
                transition: "background 0.15s",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                position: "relative",
              }}
            >
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: todayCell ? 800 : 600,
                  color: todayCell ? "var(--accent)" : "var(--text-dark)",
                  alignSelf: "flex-end",
                  lineHeight: 1,
                  padding: "0.1rem 0.2rem",
                }}
              >
                {day}
              </span>
              {dayEvents.slice(0, 3).map((evt) => (
                <div
                  key={`${evt.source}-${evt.id}`}
                  onClick={(e) => { e.stopPropagation(); onEventClick(evt); }}
                  title={evt.title}
                  style={{
                    background: colorHex(evt.color),
                    color: "#fff",
                    borderRadius: "4px",
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    padding: "1px 4px",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    cursor: "pointer",
                    lineHeight: 1.5,
                  }}
                >
                  {evt.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div
                  style={{
                    fontSize: "0.62rem",
                    color: "var(--text-dark-sub)",
                    fontWeight: 600,
                    paddingLeft: "2px",
                  }}
                >
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   EVENT DETAIL POPUP
═══════════════════════════════════════════════════════════════════════════════ */
function EventDetailPopup({
  event,
  isAdmin,
  onEdit,
  onDelete,
  onClose,
}: {
  event: CalendarEvent;
  isAdmin: boolean;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.25)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--card-bg, #fff)",
          borderRadius: "12px",
          padding: "1.5rem",
          maxWidth: "380px",
          width: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          border: "1px solid var(--card-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color stripe */}
        <div
          style={{
            height: "4px",
            borderRadius: "4px",
            background: colorHex(event.color),
            marginBottom: "1rem",
          }}
        />
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "var(--text-dark)" }}>
          {event.title}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)" }}>
            <strong>Type:</strong> {event.type}
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)" }}>
            <strong>Start:</strong> {formatDate(event.start)}
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)" }}>
            <strong>End:</strong> {formatDate(event.end)}
          </span>
          {event.source === "holiday" && (
            <span
              style={{
                fontSize: "0.72rem",
                background: "var(--input-bg)",
                border: "1px solid var(--card-border)",
                borderRadius: "4px",
                padding: "2px 8px",
                color: "var(--text-dark-sub)",
                display: "inline-flex",
                alignSelf: "flex-start",
                marginTop: "0.25rem",
              }}
            >
              Public Holiday (read-only)
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          {isAdmin && event.source === "calendar" && (
            <>
              <button style={btn("secondary")} onClick={() => { onClose(); onEdit(event); }}>
                Edit
              </button>
              <button style={btn("danger")} onClick={() => { onClose(); onDelete(event.id); }}>
                Delete
              </button>
            </>
          )}
          <button style={btn("primary")} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════════ */
const AcademicCalendarPage: React.FC = () => {
  const { isAdmin } = useRoleAccess();

  /* ── State ─────────────────────────────────────────────────────────────── */
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "list">("month");

  // Month navigation
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);

  // Filter
  const [filterType, setFilterType] = useState<string>("");

  /* ── Data loading ──────────────────────────────────────────────────────── */
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/academic/calendar");
      setEvents(res.data.data || []);
    } catch (err) {
      toast.error("Load Failed", getErr(err, "Unable to load calendar events."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  const openCreate = (prefillDate?: Date) => {
    setEditing(null);
    const dateStr = prefillDate
      ? prefillDate.toISOString().slice(0, 10)
      : "";
    setForm({ ...emptyForm, start: dateStr, end: dateStr });
    setModalOpen(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setEditing(event);
    setForm({
      title: event.title,
      start: toInputDate(event.start),
      end: toInputDate(event.end),
      type: event.type,
      color: event.color,
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Validation", "Title is required."); return; }
    if (!form.start)        { toast.error("Validation", "Start date is required."); return; }
    if (!form.end)          { toast.error("Validation", "End date is required."); return; }
    if (form.end < form.start) { toast.error("Validation", "End date must be on or after start date."); return; }
    setSaving(true);
    try {
      if (editing) {
        const res = await API.put(`/academic/calendar/${editing.id}`, form);
        setEvents((prev) =>
          prev.map((e) => (e.source === "calendar" && e.id === editing.id ? { ...e, ...res.data.data, source: "calendar" as const } : e))
        );
        toast.success("Event Updated", `"${form.title}" has been updated.`);
      } else {
        const res = await API.post("/academic/calendar", form);
        setEvents((prev) => [...prev, { ...res.data.data, source: "calendar" as const }].sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        ));
        toast.success("Event Created", `"${form.title}" has been added to the calendar.`);
      }
      setModalOpen(false);
    } catch (err) {
      toast.error("Save Failed", getErr(err, "Unable to save event."));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await API.delete(`/academic/calendar/${deleteId}`);
      setEvents((prev) => prev.filter((e) => !(e.source === "calendar" && e.id === deleteId)));
      toast.success("Event Deleted");
    } catch (err) {
      toast.error("Delete Failed", getErr(err, "Unable to delete event."));
    } finally {
      setDeleteId(null);
    }
  };

  /* ── Month navigation ────────────────────────────────────────────────────── */
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  /* ── Filtered events ────────────────────────────────────────────────────── */
  const filteredEvents = filterType
    ? events.filter((e) => e.type === filterType)
    : events;

  // Events visible in current month view
  const monthEvents = filteredEvents.filter((e) => {
    const s = new Date(e.start);
    const en = new Date(e.end);
    const monthStart = new Date(viewYear, viewMonth, 1);
    const monthEnd = new Date(viewYear, viewMonth + 1, 0);
    return s <= monthEnd && en >= monthStart;
  });

  /* ── List view sorted events ─────────────────────────────────────────────── */
  const listEvents = [...filteredEvents].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  /* ─────────────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────────────────*/
  return (
    <div
      style={{
        padding: "1.5rem clamp(1rem, 3vw, 2rem) 2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        maxWidth: "1400px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        className="panel-card-header"
        style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: 0 }}
      >
        <div>
          <h1 className="topbar-title" style={{ fontSize: "1.4rem", color: "var(--text-dark)" }}>
            Academic Calendar
          </h1>
          <p style={{ color: "var(--text-dark-sub)", marginTop: "0.3rem" }}>
            View academic events, holidays, exam periods, and semester schedules.
          </p>
        </div>
        {isAdmin && (
          <button style={btn("primary")} onClick={() => openCreate()}>
            + Add Event
          </button>
        )}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* View toggle */}
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {(["month", "list"] as const).map((v) => (
            <button
              key={v}
              style={{
                ...btn(viewMode === v ? "primary" : "secondary"),
                padding: "0.45rem 0.9rem",
                display: "flex",
                alignItems: "center",
              }}
              onClick={() => setViewMode(v)}
            >
              {v === "month" ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "6px"}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Month</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "6px"}}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> List</>
              )}
            </button>
          ))}
        </div>

        {/* Month nav (only in month view) */}
        {viewMode === "month" && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button style={{ ...btn("secondary"), padding: "0.4rem 0.7rem" }} onClick={prevMonth}>
              ‹
            </button>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-dark)", minWidth: "160px", textAlign: "center" }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button style={{ ...btn("secondary"), padding: "0.4rem 0.7rem" }} onClick={nextMonth}>
              ›
            </button>
            <button style={{ ...btn("secondary"), padding: "0.4rem 0.7rem", fontSize: "0.75rem" }} onClick={goToday}>
              Today
            </button>
          </div>
        )}

        {/* Type filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)", fontWeight: 600 }}>
            Filter:
          </label>
          <select
            className="field-input"
            style={{ padding: "0.4rem 0.7rem", fontSize: "0.82rem", minWidth: "160px" }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
        {EVENT_TYPES.map((type) => {
          const colorMap: Record<string, string> = {
            "National Holiday": "green",
            "Academic Event":   "blue",
            "Exam Period":      "red",
            "Semester Break":   "orange",
            "Other":            "purple",
          };
          const c = colorMap[type] || "yellow";
          return (
            <span
              key={type}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.73rem",
                fontWeight: 600,
                color: "var(--text-dark-sub)",
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: colorHex(c),
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              {type}
            </span>
          );
        })}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              border: "3px solid var(--accent)",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      ) : viewMode === "month" ? (
        /* ── Month Grid ──────────────────────────────────────────────── */
        <div
          style={{
            background: "var(--card-bg, var(--input-bg))",
            borderRadius: "14px",
            border: "1px solid var(--card-border)",
            padding: "1rem",
          }}
        >
          <MonthGrid
            year={viewYear}
            month={viewMonth}
            events={monthEvents}
            onDayClick={(date) => isAdmin && openCreate(date)}
            onEventClick={(evt) => setDetailEvent(evt)}
          />
          {monthEvents.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "var(--text-dark-sub)",
                fontSize: "0.85rem",
                marginTop: "2rem",
                paddingBottom: "1rem",
              }}
            >
              No events this month.
              {isAdmin && " Click any day to add one."}
            </p>
          )}
        </div>
      ) : (
        /* ── List / Agenda View ──────────────────────────────────────── */
        <div
          style={{
            background: "var(--card-bg, var(--input-bg))",
            borderRadius: "14px",
            border: "1px solid var(--card-border)",
            overflow: "hidden",
          }}
        >
          {listEvents.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "var(--text-dark-sub)",
                fontSize: "0.85rem",
                padding: "3rem 1rem",
              }}
            >
              No calendar events found.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "var(--input-bg)",
                    borderBottom: "1px solid var(--card-border)",
                  }}
                >
                  {["#", "Title", "Type", "Start", "End", "Source", ...(isAdmin ? ["Actions"] : [])].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "left",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "var(--text-dark-sub)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {listEvents.map((evt, idx) => (
                  <tr
                    key={`${evt.source}-${evt.id}`}
                    style={{
                      borderBottom: "1px solid var(--card-border)",
                      background: idx % 2 === 0 ? "transparent" : "var(--input-bg)",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(var(--accent-rgb,59,130,246),0.06)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        idx % 2 === 0 ? "transparent" : "var(--input-bg)")
                    }
                  >
                    {/* Index */}
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-dark-sub)", fontWeight: 700, fontSize: "0.85rem" }}>
                      {idx + 1}
                    </td>
                    {/* Title with color dot */}
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: colorHex(evt.color),
                            flexShrink: 0,
                            display: "inline-block",
                          }}
                        />
                        <span
                          style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-dark)" }}
                        >
                          {evt.title}
                        </span>
                      </div>
                    </td>
                    {/* Type badge */}
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        style={{
                          background: colorHex(evt.color) + "20",
                          color: colorHex(evt.color),
                          border: `1px solid ${colorHex(evt.color)}40`,
                          borderRadius: "20px",
                          padding: "2px 10px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {evt.type}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", color: "var(--text-dark-sub)", whiteSpace: "nowrap" }}>
                      {formatDate(evt.start)}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", color: "var(--text-dark-sub)", whiteSpace: "nowrap" }}>
                      {formatDate(evt.end)}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          background: "var(--input-bg)",
                          border: "1px solid var(--card-border)",
                          borderRadius: "4px",
                          padding: "1px 6px",
                          color: "var(--text-dark-sub)",
                          textTransform: "capitalize",
                        }}
                      >
                        {evt.source === "holiday" ? "Public Holiday" : "Calendar"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-start" }}>
                          {evt.source === "calendar" ? (
                            <>
                              <button
                                style={{ ...btn("secondary"), padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                                onClick={() => openEdit(evt)}
                              >
                                Edit
                              </button>
                              <button
                                style={{ ...btn("danger"), padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                                onClick={() => setDeleteId(evt.id)}
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: "0.72rem", color: "var(--text-dark-sub)" }}>
                              —
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Event count ────────────────────────────────────────────────────── */}
      {!loading && (
        <p style={{ fontSize: "0.78rem", color: "var(--text-dark-sub)", margin: 0 }}>
          {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} total
          {filterType ? ` · filtered by "${filterType}"` : ""}
        </p>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      {isAdmin && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Calendar Event" : "Add Calendar Event"}
          maxWidth="md"
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button style={btn("secondary")} onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button style={btn("primary")} onClick={save} disabled={saving}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Create Event"}
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Title */}
            <label className="field-label">
              Title *
              <input
                type="text"
                className="field-input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Mid-term Exams, Eid Holiday…"
              />
            </label>

            {/* Dates row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label className="field-label">
                Start Date *
                <input
                  type="date"
                  className="field-input"
                  value={form.start}
                  onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                />
              </label>
              <label className="field-label">
                End Date *
                <input
                  type="date"
                  className="field-input"
                  value={form.end}
                  min={form.start}
                  onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                />
              </label>
            </div>

            {/* Type */}
            <label className="field-label">
              Event Type
              <select
                className="field-input"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            {/* Color */}
            <div>
              <span
                className="field-label"
                style={{ display: "block", marginBottom: "0.5rem" }}
              >
                Color
              </span>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: c.hex,
                      border: form.color === c.value
                        ? "3px solid var(--text-dark)"
                        : "2px solid transparent",
                      cursor: "pointer",
                      outline: form.color === c.value ? "2px solid var(--accent)" : "none",
                      outlineOffset: "2px",
                      transition: "transform 0.1s",
                      transform: form.color === c.value ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete Calendar Event?"
        message="This event will be permanently removed from the calendar."
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />

      {/* ── Event Detail Popup ───────────────────────────────────────────────── */}
      {detailEvent && (
        <EventDetailPopup
          event={detailEvent}
          isAdmin={isAdmin}
          onEdit={openEdit}
          onDelete={setDeleteId}
          onClose={() => setDetailEvent(null)}
        />
      )}
    </div>
  );
};

export default AcademicCalendarPage;
