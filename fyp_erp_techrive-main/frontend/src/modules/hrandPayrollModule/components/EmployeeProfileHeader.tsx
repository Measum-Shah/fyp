import React from "react";
import StatusBadge from "./StatusBadge";
import EmployeeAvatar from "./EmployeeAvatar";

// One of the four Employee Profile Card detail cells (Employee ID, Email,
// Phone, Staff Type) — label always renders above the value.
export interface EmployeeProfileMetaItem {
  key: string;
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

export interface EmployeeProfileHeaderProps {
  // Placeholder mode (Add Employee, before anything has been typed) shows
  // dashed "empty" affordances instead of real data — same layout, same
  // spacing, same card, just nothing to display yet.
  placeholder?: boolean;
  name: string;
  imageUrl?: string | null;
  status?: string | null;
  subtitle?: React.ReactNode;
  metaItems?: EmployeeProfileMetaItem[];
  // Profile-picture management, driven entirely from this card. Omitted on
  // the Add Employee placeholder (there's no employee record yet to attach
  // a picture to) — when omitted the avatar is not clickable.
  onAvatarSelect?: (file: File) => void;
  onAvatarRemove?: () => void;
  avatarUploading?: boolean;
  avatarError?: string | null;
}

const IconUserPlus = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="16" y1="11" x2="22" y2="11" />
  </svg>
);

// Reused, unmodified, across Add / View / Edit Employee — the only thing
// that changes between screens is the data (or `placeholder` while the Add
// Employee form is still empty). The profile picture itself is the one
// piece of state this component partially owns: it renders the clickable
// avatar and delegates Add/Change/Remove actions back to the page via the
// on* callbacks, which are responsible for calling the API and persisting
// the change.
const EmployeeProfileHeader: React.FC<EmployeeProfileHeaderProps> = ({
  placeholder = false,
  name,
  imageUrl,
  status,
  subtitle,
  metaItems = [],
  onAvatarSelect,
  onAvatarRemove,
  avatarUploading = false,
  avatarError = null,
}) => {
  if (placeholder) {
    // Add Employee still has no employee id to attach a picture to, but the
    // page can already stage an upload (see AddEmployeePage) — when it wires
    // up onAvatarSelect, swap the static dashed icon for the exact same
    // clickable EmployeeAvatar used on View/Edit (same size, same
    // click-to-open-file-picker behaviour, same upload spinner/preview).
    // Nothing else in the placeholder card changes.
    const avatarEditable = Boolean(onAvatarSelect);

    return (
      <div className="hr-profile-card hr-profile-card-placeholder">
        {avatarEditable ? (
          <EmployeeAvatar
            name={name}
            imageUrl={imageUrl}
            size="xl"
            editable
            uploading={avatarUploading}
            onFileSelect={onAvatarSelect}
          />
        ) : (
          <div className="hr-profile-avatar hr-profile-avatar-placeholder" aria-hidden="true">
            <IconUserPlus />
          </div>
        )}
        <div className="hr-profile-card-main">
          <div className="hr-profile-card-heading">
            <h2 className="hr-profile-name hr-profile-name-placeholder">New Employee</h2>
          </div>
          <p className="hr-profile-subtitle hr-profile-subtitle-placeholder">
            Fill in the sections below to create this employee's profile.
          </p>
          {avatarError && (
            <p className="hr-field-error" role="alert">
              {avatarError}
            </p>
          )}
        </div>
      </div>
    );
  }

  const avatarEditable = Boolean(onAvatarSelect);

  return (
    <div className="hr-profile-card">
      <EmployeeAvatar
        name={name}
        imageUrl={imageUrl}
        size="xl"
        editable={avatarEditable}
        uploading={avatarUploading}
        onFileSelect={onAvatarSelect}
        onRemove={onAvatarRemove}
      />
      <div className="hr-profile-card-main">
        <div className="hr-profile-card-heading">
          <h2 className="hr-profile-name">{name}</h2>
          {status !== undefined && <StatusBadge status={status} />}
        </div>
        {subtitle && <p className="hr-profile-subtitle">{subtitle}</p>}
        {avatarError && (
          <p className="hr-field-error" role="alert">
            {avatarError}
          </p>
        )}
        {metaItems.length > 0 && (
          <div className="hr-profile-meta-grid">
            {metaItems.map((item) => (
              <div className="hr-profile-meta-cell" key={item.key}>
                <span className="hr-profile-meta-label">
                  {item.icon}
                  {item.label}
                </span>
                <span className="hr-profile-meta-value">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfileHeader;
