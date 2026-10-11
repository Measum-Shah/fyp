import React, { useState, useEffect } from "react";

const TeacherProfilePage: React.FC = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    username: "",
    role: "",
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("erp_user");
      if (raw && raw !== "undefined") {
        const u = JSON.parse(raw);
        setProfile({
          name: u.name || u.full_name || "",
          email: u.email || "",
          username: u.username || u.user_name || "",
          role: u.role_name || u.user_type || u.role || "Teacher",
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    setNotice(null);
    setTimeout(() => {
      try {
        const raw = localStorage.getItem("erp_user");
        const existing = raw && raw !== "undefined" ? JSON.parse(raw) : {};
        const updated = { ...existing, name: profile.name, email: profile.email, username: profile.username };
        localStorage.setItem("erp_user", JSON.stringify(updated));
        window.dispatchEvent(new Event("erp_user_updated"));
        setNotice({ type: "success", msg: "Profile updated successfully." });
      } catch {
        setNotice({ type: "error", msg: "Failed to save profile." });
      }
      setSaving(false);
    }, 600);
  };

  return (
    <div className="teacher-attendance-page">
      <header className="teacher-attendance-header">
        <div>
          <h1 className="teacher-attendance-title">My Profile</h1>
          <p className="teacher-attendance-subtitle">Manage your personal information and profile visibility</p>
        </div>
      </header>

      {notice && (
        <div className={`teacher-attendance-message ${notice.type}`}>
          {notice.msg}
        </div>
      )}

      <div className="teacher-attendance-panel" style={{ maxWidth: "720px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--card-border)" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: 700, flexShrink: 0 }}>
            {profile.name ? profile.name.charAt(0).toUpperCase() : "T"}
          </div>
          <div>
            <button className="teacher-attendance-save" style={{ fontSize: "0.82rem", padding: "0.5rem 1rem" }} type="button">
              Upload New Photo
            </button>
            <p style={{ fontSize: "0.72rem", color: "var(--text-dark-sub)", marginTop: "0.4rem" }}>
              JPG, GIF or PNG. Max size of 800K
            </p>
          </div>
        </div>

        <div className="teacher-attendance-filters">
          <label>
            Full Name *
            <input type="text" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
          </label>
          <label>
            Username
            <input type="text" value={profile.username} onChange={(e) => setProfile(p => ({ ...p, username: e.target.value }))} placeholder="Your username" />
          </label>
          <label>
            Email Address *
            <input type="email" value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" />
          </label>
          <label>
            System Role
            <input type="text" value={profile.role} disabled style={{ background: "var(--input-bg)", cursor: "not-allowed", opacity: 0.7, textTransform: "capitalize" }} />
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--card-border)" }}>
          <button onClick={handleSave} disabled={saving} className="teacher-attendance-save" style={{ fontSize: "0.85rem", padding: "0.5rem 1.5rem" }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfilePage;
