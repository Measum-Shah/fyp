import React, { useState, useEffect } from "react";
import { toast } from "./AcademicLayout";

const UserProfilePage: React.FC = () => {
  const [profile, setProfile] = useState({
    name: "Admin",
    email: "admin@erp.edu",
    username: "admin_user",
    role: "admin",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("erp_user");
      if (raw && raw !== "undefined") {
        const u = JSON.parse(raw);
        setProfile((prev) => ({ ...prev, ...u }));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem("erp_user", JSON.stringify(profile));
      // Dispatch custom event to trigger topnav update
      window.dispatchEvent(new Event("erp_user_updated"));
      toast.success("Profile Updated", "Your profile information has been saved successfully.");
      setSaving(false);
    }, 600);
  };

  return (
    <div style={{ padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "800px", margin: "0 auto" }}>
      <div className="panel-card-header">
        <div>
          <h2 className="topbar-title" style={{ fontSize: "1.4rem" }}>My Profile</h2>
          <p className="topbar-date">Manage your personal information and profile visibility</p>
        </div>
      </div>

      <div className="panel-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", borderBottom: "1px solid var(--divider-color)", paddingBottom: "1.5rem" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 700 }}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <button className="submit-btn" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", width: "auto", margin: 0 }}>Upload New Photo</button>
            <p style={{ fontSize: "0.75rem", color: "var(--text-dark-sub)", marginTop: "0.5rem" }}>JPG, GIF or PNG. Max size of 800K</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
          <div>
            <label className="field-label">Full Name *</label>
            <input 
              type="text" 
              value={profile.name} 
              onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} 
              className="field-input" 
            />
          </div>
          <div>
            <label className="field-label">Username</label>
            <input 
              type="text" 
              value={profile.username} 
              onChange={(e) => setProfile(p => ({ ...p, username: e.target.value }))} 
              className="field-input" 
            />
          </div>
          <div>
            <label className="field-label">Email Address *</label>
            <input 
              type="email" 
              value={profile.email} 
              onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} 
              className="field-input" 
            />
          </div>
          <div>
            <label className="field-label">System Role</label>
            <input 
              type="text" 
              value={profile.role} 
              disabled 
              className="field-input" 
              style={{ background: "var(--badge-bg)", cursor: "not-allowed", textTransform: "capitalize" }} 
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "1rem", borderTop: "1px solid var(--divider-color)" }}>
          <button onClick={handleSave} disabled={saving} className="submit-btn" style={{ width: "auto", margin: 0, padding: "0.5rem 1.5rem" }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
