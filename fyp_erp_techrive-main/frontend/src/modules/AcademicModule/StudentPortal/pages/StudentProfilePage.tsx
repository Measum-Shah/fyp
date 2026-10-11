import React, { useState, useEffect } from "react";
import { StudentAPI } from "../services/api";

const StudentProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    StudentAPI.getProfile()
      .then(res => { 
        const data = res.data.data || {};
        if (!data.email && data.student_email) data.email = data.student_email;
        setProfile(data); 
        setForm(data); 
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      await StudentAPI.updateProfile({ 
        mobile_1: form.mobile_1, 
        home_phone: form.home_phone, 
        address: form.address,
        blood_group: form.blood_group,
        email: form.email
      });
      setMsg("Profile updated successfully!"); setEditing(false);
      const res = await StudentAPI.getProfile(); 
      const data = res.data.data || {};
      if (!data.email && data.student_email) data.email = data.student_email;
      setProfile(data);
    } catch { setMsg("Failed to update profile."); }
    setSaving(false);
  };

  if (loading) return <div className="flex flex-col gap-6 animate-pulse"><div className="panel-card" style={{height:400}}/></div>;

  const fields = [
    { label: "Registration No", value: profile?.reg_no, key: "" },
    { label: "Gender",          value: profile?.gender, key: "" },
    { label: "Date of Birth",   value: profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : "N/A", key: "" },
    { label: "Nationality",     value: profile?.nationality, key: "" },
    { label: "City",            value: profile?.city, key: "" },
    { label: "State",           value: profile?.state, key: "" },
    { label: "Country",         value: profile?.country, key: "" },
  ];
  const editableFields = [
    { label: "Blood Group", key: "blood_group" },
    { label: "Email",       key: "email" },
    { label: "Phone",       key: "mobile_1" },
    { label: "Home Phone",  key: "home_phone" },
    { label: "Address",     key: "address" },
  ];

  return (
    <div className="flex flex-col gap-6" style={{maxWidth:900}}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{color: "var(--text-dark)"}}>My Profile</h1>
        {!editing && <button style={{ background: "var(--accent)", color: "#ffffff", border: "none", padding: "0.5rem 1.25rem", borderRadius: "var(--radius-btn)", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem", boxShadow: "0 2px 8px rgba(29,111,191,0.25)", transition: "all 0.25s ease" }} onClick={() => setEditing(true)} onMouseOver={e => { e.currentTarget.style.background = "var(--accent-bright)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(29,111,191,0.35)"; }} onMouseOut={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(29,111,191,0.25)"; }}>Edit Profile</button>}
      </div>

      {msg && <div className="p-3 rounded-lg text-sm font-medium" style={{background: msg.includes("success") ? "var(--success-bg)" : "var(--error-bg)", color: msg.includes("success") ? "var(--success)" : "var(--error)", border: `1px solid ${msg.includes("success") ? "var(--success-border)" : "var(--error-border)"}` }}>{msg}</div>}

      {/* Header Card */}
      <div className="panel-card">
        <div className="p-6 flex items-center gap-6" style={{borderBottom:"1px solid var(--input-border)"}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:700,color:"#fff"}}>
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{color:"var(--text-dark)"}}>{profile?.first_name} {profile?.last_name}</h2>
            <p className="text-sm mt-1" style={{color:"var(--text-secondary)"}}>Reg No: {profile?.reg_no || "N/A"}</p>
            <span className="inline-block mt-2 text-xs font-semibold" style={{padding:"4px 12px", borderRadius:"9999px", background:"var(--success-bg)", color:"var(--success)", border:"1px solid var(--success-border)"}}>
              {profile?.academic_status || "Active"}
            </span>
          </div>
        </div>

        {/* Read-only Fields */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {fields.map((f, i) => (
            <div key={i}>
              <label className="text-xs font-semibold uppercase tracking-wider" style={{color:"var(--text-muted)"}}>{f.label}</label>
              <p className="mt-1 font-medium text-sm" style={{color:"var(--text-dark)"}}>{f.value || "N/A"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editable Fields - Contact Information */}
      <div className="panel-card" style={{
        border: editing ? "1.5px solid var(--accent)" : "1px solid var(--card-border)",
        boxShadow: editing ? "0 0 0 3px var(--input-focus-sh)" : "none",
        transition: "all 0.3s ease",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
          padding: editing ? "0.75rem 1rem" : "0",
          background: editing ? "var(--input-bg)" : "transparent",
          borderRadius: editing ? "var(--radius-input)" : "0",
          transition: "all 0.3s ease",
        }}>
          <h3 style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--text-dark)",
          }}>
            Contact Information
            {editing && (
              <span style={{
                marginLeft: "0.75rem",
                fontSize: "0.7rem",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "9999px",
                background: "var(--accent)",
                color: "#ffffff",
                verticalAlign: "middle",
              }}>EDITING</span>
            )}
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5" style={{paddingTop: 0}}>
          {editableFields.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-semibold uppercase tracking-wider" style={{
                color: "var(--text-secondary)",
                letterSpacing: "0.05em",
              }}>{f.label}</label>
              {editing ? (
                <input
                  className="form-input mt-1"
                  value={form[f.key] || ""}
                  onChange={e => setForm({...form, [f.key]: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "var(--radius-input)",
                    border: "1px solid var(--input-border)",
                    background: "var(--input-bg)",
                    color: "var(--text-dark)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "var(--input-focus)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--input-focus-sh)"; e.currentTarget.style.background = "var(--input-focus-bg)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "var(--input-border)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "var(--input-bg)"; }}
                />
              ) : (
                <p className="mt-1 font-medium text-sm" style={{color:"var(--text-dark)"}}>{profile?.[f.key] || "N/A"}</p>
              )}
            </div>
          ))}
        </div>
        {editing && (
          <div className="flex justify-end gap-3 px-6 pb-6 pt-4 mt-2" style={{borderTop: "1px solid var(--input-border)"}}>
            <button
              onClick={() => { setEditing(false); setForm(profile); }}
              style={{
                background: "var(--input-bg)",
                color: "var(--text-dark)",
                border: "1px solid var(--input-border)",
                padding: "0.5rem 1.25rem",
                borderRadius: "var(--radius-btn)",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.875rem",
                transition: "all 0.2s ease",
              }}
              onMouseOver={e => { e.currentTarget.style.background = "var(--input-border)"; }}
              onMouseOut={e => { e.currentTarget.style.background = "var(--input-bg)"; }}
            >Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: "var(--accent)",
                color: "#ffffff",
                border: "none",
                padding: "0.5rem 1.5rem",
                borderRadius: "var(--radius-btn)",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                boxShadow: "0 2px 8px rgba(29,111,191,0.25)",
                opacity: saving ? 0.7 : 1,
                transition: "all 0.25s ease",
              }}
              onMouseOver={e => { if (!saving) { e.currentTarget.style.background = "var(--accent-bright)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(29,111,191,0.35)"; }}}
              onMouseOut={e => { if (!saving) { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(29,111,191,0.25)"; }}}
            >{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfilePage;
