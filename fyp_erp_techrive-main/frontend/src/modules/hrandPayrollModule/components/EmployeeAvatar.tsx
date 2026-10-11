import React, { useEffect, useRef, useState } from "react";

interface EmployeeAvatarProps {
  // Full name (or email fallback) used to derive the initials shown when no
  // picture is set — never left blank, matching the rest of the module's
  // "—" / initials-style graceful-empty conventions.
  name: string;
  // Already-resolved, browser-loadable URL (see resolveEmployeeFileUrl) —
  // this component never talks to the API or knows about upload paths.
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  // Renders the camera/edit affordance and hidden file input; the parent
  // owns what happens on file selection (immediate upload, persisted right
  // away via the API from the Employee Profile Card) — kept purely
  // presentational here, same division of responsibility as
  // StaffQualificationFormModal's own upload handling.
  editable?: boolean;
  uploading?: boolean;
  onFileSelect?: (file: File) => void;
  // When provided (together with `editable` and an existing `imageUrl`),
  // clicking the avatar opens a small Add/Change/Remove menu instead of
  // jumping straight to the file picker, and this is called when "Remove
  // Photo" is chosen.
  onRemove?: () => void;
  // Non-editable circles (e.g. the table row avatar) can still be clicked to
  // view the full picture in a new tab.
  viewHref?: string | null;
  className?: string;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

const IconCamera = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const EmployeeAvatar: React.FC<EmployeeAvatarProps> = ({
  name,
  imageUrl,
  size = "md",
  editable = false,
  uploading = false,
  onFileSelect,
  onRemove,
  viewHref,
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Removing is only offered once there's actually a picture to remove.
  const showMenu = editable && Boolean(onRemove) && Boolean(imageUrl);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (file && onFileSelect) onFileSelect(file);
  };

  const handleCircleClick = () => {
    if (!editable) return;
    if (showMenu) {
      setMenuOpen((open) => !open);
    } else {
      inputRef.current?.click();
    }
  };

  const circle = (
    <div
      className={`hr-avatar hr-avatar-${size} ${editable ? "hr-avatar-editable" : ""} ${className}`}
      role={editable ? "button" : undefined}
      tabIndex={editable ? 0 : undefined}
      aria-label={
        editable ? (imageUrl ? "Change profile picture" : "Add profile picture") : undefined
      }
      onClick={editable ? handleCircleClick : undefined}
      onKeyDown={
        editable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCircleClick();
              }
            }
          : undefined
      }
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="hr-avatar-img" />
      ) : (
        <span className="hr-avatar-initials">{getInitials(name)}</span>
      )}

      {uploading && (
        <span className="hr-avatar-spinner-wrap">
          <span className="spinner" />
        </span>
      )}

      {/* Purely decorative — the whole circle (above) is the click target,
          this badge just signals "you can add/edit a picture here" so it
          doesn't create a nested interactive element inside the circle. */}
      {editable && !uploading && (
        <span className="hr-avatar-edit-badge" aria-hidden="true">
          <IconCamera />
        </span>
      )}

      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hr-avatar-file-input"
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
    </div>
  );

  if (editable) {
    return (
      <div className="hr-avatar-wrap" ref={wrapRef}>
        {circle}
        {showMenu && menuOpen && (
          <div className="hr-avatar-menu" role="menu">
            <button
              type="button"
              className="hr-avatar-menu-item"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                inputRef.current?.click();
              }}
            >
              <IconCamera /> Change Photo
            </button>
            <button
              type="button"
              className="hr-avatar-menu-item hr-avatar-menu-item-danger"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onRemove?.();
              }}
            >
              <IconTrash /> Remove Photo
            </button>
          </div>
        )}
      </div>
    );
  }

  // View-only circles (e.g. table rows) link out to the full picture when one
  // exists; editable circles never wrap in a link (the button already owns
  // the click).
  if (viewHref) {
    return (
      <a
        href={viewHref}
        target="_blank"
        rel="noreferrer"
        className="hr-avatar-link"
        aria-label={`View ${name}'s profile picture`}
      >
        {circle}
      </a>
    );
  }

  return circle;
};

export default EmployeeAvatar;
