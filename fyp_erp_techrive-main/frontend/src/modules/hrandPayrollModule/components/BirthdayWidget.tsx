import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useUpcomingBirthdays } from "../hooks/useUpcomingBirthdays";
import type { UpcomingBirthday } from "../hooks/useUpcomingBirthdays";

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IconCake = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
    <path d="M4 16h16" />
    <path d="M12 12V8" />
    <path d="M9 8c0-1 .8-1.5.8-2.5S9 3.5 9 3" />
    <path d="M15 8c0-1 .8-1.5.8-2.5S15 3.5 15 3" />
    <path d="M12 8c0-1 .8-1.5.8-2.5S12 3.5 12 3" />
    <circle cx="7" cy="18.5" r="0.5" fill="currentColor" />
    <circle cx="12" cy="18.5" r="0.5" fill="currentColor" />
    <circle cx="17" cy="18.5" r="0.5" fill="currentColor" />
  </svg>
);

const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// How many rows to show before the list scrolls internally rather than
// pushing the rest of the dashboard down indefinitely.
const VISIBLE_LIMIT = 8;

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Deterministically maps a name to one of the app's existing 4 stat-icon
// color variants, so every avatar gets a color but the same person always
// gets the same one (no random re-color on every re-render).
const AVATAR_VARIANTS = ["blue", "green", "gold", "purple"] as const;
const avatarVariantOf = (seed: string): (typeof AVATAR_VARIANTS)[number] => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_VARIANTS[hash % AVATAR_VARIANTS.length];
};

const formatBirthdayDate = (date: Date): string =>
  date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

const daysRemainingLabel = (days: number): string => {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
};

const BirthdayAvatar: React.FC<{ item: UpcomingBirthday }> = ({ item }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const variant = avatarVariantOf(item.name || String(item.employee.id));
  const showImage = Boolean(item.employee.staff_image) && !imgFailed;

  return (
    <div className={`hr-birthday-avatar stat-icon-${variant}`}>
      {showImage ? (
        <img
          src={item.employee.staff_image as string}
          alt={item.name}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span>{initialsOf(item.name)}</span>
      )}
    </div>
  );
};

const BirthdayRow: React.FC<{ item: UpcomingBirthday }> = ({ item }) => (
  <li className={`hr-birthday-row ${item.isToday ? "hr-birthday-row-today" : ""}`}>
    <BirthdayAvatar item={item} />
    <div className="hr-birthday-info">
      <span className="hr-birthday-name">{item.name}</span>
      <span className="hr-birthday-date">{formatBirthdayDate(item.nextBirthday)}</span>
    </div>
    <span className={`hr-birthday-badge ${item.isToday ? "hr-birthday-badge-today" : ""}`}>
      {item.isToday ? "🎉 " : ""}
      {daysRemainingLabel(item.daysRemaining)}
    </span>
  </li>
);

// ─── BirthdayWidget ───────────────────────────────────────────────────────
// Sits at the top of the HR Dashboard. Pulls every employee's Date of Birth
// (captured on the Add/Edit Employee form), works out each person's next
// birthday, and lists them soonest-first with name, photo/initials, date,
// and days remaining — refreshing automatically whenever the dashboard is
// (re)focused, per useUpcomingBirthdays.
const BirthdayWidget: React.FC = () => {
  const { birthdays, loading, error, refetch } = useUpcomingBirthdays();
  const upcoming = birthdays.slice(0, VISIBLE_LIMIT);

  return (
    <section className="hr-birthday-widget" aria-label="Upcoming employee birthdays">
      <div className="hr-birthday-widget-header">
        <div className="hr-birthday-widget-title-group">
          <span className="hr-birthday-widget-icon">
            <IconCake />
          </span>
          <div>
            <h2 className="hr-birthday-widget-title">Upcoming Employee Birthdays</h2>
            <p className="hr-birthday-widget-subtitle">Closest birthday first</p>
          </div>
        </div>
        <button
          type="button"
          className="hr-btn hr-btn-ghost hr-btn-icon"
          onClick={refetch}
          title="Refresh"
          aria-label="Refresh birthdays"
        >
          <IconRefresh />
        </button>
      </div>

      {loading && (
        <div className="hr-birthday-state">
          <span className="spinner-wrap">
            <span className="spinner" />
          </span>
          <p className="hr-state-message" style={{ marginTop: "0.6rem" }}>
            Loading birthdays…
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="hr-birthday-state hr-birthday-state-error">
          <div className="hr-state-icon">
            <IconAlertTriangle />
          </div>
          <p className="hr-state-message">{error}</p>
          <button type="button" className="hr-btn hr-btn-secondary hr-btn-sm" onClick={refetch}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && upcoming.length === 0 && (
        <div className="hr-birthday-state">
          <p className="hr-state-message">
            No birthdays on file yet. Add a Date of Birth on the{" "}
            <Link to="/hr/employees/new">Add Employee</Link> form and it will show up here
            automatically.
          </p>
        </div>
      )}

      {!loading && !error && upcoming.length > 0 && (
        <ul className="hr-birthday-list">
          {upcoming.map((item) => (
            <BirthdayRow key={item.employee.id} item={item} />
          ))}
        </ul>
      )}

      {!loading && !error && birthdays.length > VISIBLE_LIMIT && (
        <Link to="/hr/employees" className="hr-birthday-view-all">
          View all {birthdays.length} employees with a birthday on file →
        </Link>
      )}
    </section>
  );
};

export default BirthdayWidget;
