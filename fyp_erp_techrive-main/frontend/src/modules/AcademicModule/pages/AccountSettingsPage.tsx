import React, { useState, useEffect } from "react";
import { toast } from "./AcademicLayout";

const AccountSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    theme: "corporate-trust",
    language: "en",
    notificationsEmail: true,
    notificationsPush: true,
    twoFactorAuth: false,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("erp_theme");
      const savedSettings = localStorage.getItem("erp_account_settings");
      
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings), theme: savedTheme || prev.theme }));
      } else if (savedTheme) {
        setSettings(prev => ({ ...prev, theme: savedTheme }));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem("erp_account_settings", JSON.stringify(settings));
      if (settings.theme !== localStorage.getItem("erp_theme")) {
        localStorage.setItem("erp_theme", settings.theme);
        document.documentElement.setAttribute("data-theme", settings.theme);
      }
      toast.success("Settings Saved", "Your account settings have been updated.");
      setSaving(false);
    }, 600);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Password Updated", "Your password has been changed successfully.");
  };

  return (
    <div style={{ padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "800px", margin: "0 auto" }}>
      <div className="panel-card-header">
        <div>
          <h2 className="topbar-title" style={{ fontSize: "1.4rem" }}>Account Settings</h2>
          <p className="topbar-date">Manage your preferences, security, and application settings</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Security Preferences */}
        <div className="panel-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-dark)", borderBottom: "1px solid var(--divider-color)", paddingBottom: "0.5rem" }}>Security</h3>
          
          <form onSubmit={handlePasswordChange} style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", alignItems: "end" }}>
            <div>
              <label className="field-label">Current Password *</label>
              <input type="password" required className="field-input" />
            </div>
            <div>
              <label className="field-label">New Password *</label>
              <input type="password" required className="field-input" />
            </div>
            <div>
              <label className="field-label">Confirm New Password *</label>
              <input type="password" required className="field-input" />
            </div>
            <div>
              <button type="submit" className="submit-btn" style={{ width: "auto", margin: 0, padding: "0.55rem 1.5rem" }}>Change Password</button>
            </div>
          </form>

          <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input 
              type="checkbox" 
              id="tfa" 
              checked={settings.twoFactorAuth} 
              onChange={(e) => setSettings(s => ({ ...s, twoFactorAuth: e.target.checked }))} 
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <label htmlFor="tfa" style={{ fontSize: "0.85rem", color: "var(--text-dark)", fontWeight: 600, cursor: "pointer" }}>Enable Two-Factor Authentication (2FA)</label>
          </div>
        </div>

        {/* Application Preferences */}
        <div className="panel-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-dark)", borderBottom: "1px solid var(--divider-color)", paddingBottom: "0.5rem" }}>Application Preferences</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
            <div>
              <label className="field-label">Theme Preference</label>
              <select 
                value={settings.theme} 
                onChange={(e) => setSettings(s => ({ ...s, theme: e.target.value }))} 
                className="field-input"
              >
                <option value="corporate-trust">Corporate Trust (Light/Blue)</option>
                <option value="midnight-blue">Midnight Blue (Dark)</option>
              </select>
            </div>
            <div>
              <label className="field-label">Language</label>
              <select 
                value={settings.language} 
                onChange={(e) => setSettings(s => ({ ...s, language: e.target.value }))} 
                className="field-input"
              >
                <option value="en">English</option>
                <option value="ar">Arabic (العربية)</option>
                <option value="fr">French (Français)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-dark)", marginBottom: "0.5rem" }}>Notifications</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input 
                  type="checkbox" 
                  id="notif_email" 
                  checked={settings.notificationsEmail} 
                  onChange={(e) => setSettings(s => ({ ...s, notificationsEmail: e.target.checked }))} 
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label htmlFor="notif_email" style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)", cursor: "pointer" }}>Receive email notifications for important updates</label>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input 
                  type="checkbox" 
                  id="notif_push" 
                  checked={settings.notificationsPush} 
                  onChange={(e) => setSettings(s => ({ ...s, notificationsPush: e.target.checked }))} 
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label htmlFor="notif_push" style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)", cursor: "pointer" }}>Receive push notifications in browser</label>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={handleSave} disabled={saving} className="submit-btn" style={{ width: "auto", margin: 0, padding: "0.5rem 1.5rem" }}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
