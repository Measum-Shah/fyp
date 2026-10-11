import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { parentService } from "../services/parentService";

const ParentLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await parentService.login(email, password);
      if (res.success) {
        localStorage.setItem("parent_token", res.token);
        localStorage.setItem("parent_user",  JSON.stringify(res.user));
        navigate("/parent/dashboard");
      } else {
        setError(res.message || "Login failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--body-bg, #f4f6fb)" }}>
      <div style={{ width:"100%", maxWidth:"420px", padding:"2rem", background:"var(--card-bg,#fff)", borderRadius:"16px", boxShadow:"0 8px 32px rgba(0,0,0,0.1)" }}>
        {/* Logo / Header */}
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:"56px", height:"56px", borderRadius:"12px", background:"var(--accent,#1d6fbf)", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>
            <svg width="28" height="28" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <h1 style={{ fontSize:"1.5rem", fontWeight:700, color:"var(--text-dark,#1a1a2e)", margin:0 }}>Parent Portal</h1>
          <p style={{ fontSize:"0.875rem", color:"var(--text-dark-sub,#6b7280)", marginTop:"0.25rem" }}>Login to view your child&apos;s progress</p>
        </div>

        <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div>
            <label style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--text-dark,#1a1a2e)", display:"block", marginBottom:"0.375rem" }}>Email Address</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="parent@email.com"
              style={{ width:"100%", padding:"0.65rem 0.875rem", borderRadius:"8px", border:"1px solid var(--input-border,#e5e7eb)", background:"var(--input-bg,#f9fafb)", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--text-dark,#1a1a2e)", display:"block", marginBottom:"0.375rem" }}>Password</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width:"100%", padding:"0.65rem 0.875rem", borderRadius:"8px", border:"1px solid var(--input-border,#e5e7eb)", background:"var(--input-bg,#f9fafb)", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" }}
            />
          </div>

          {error && (
            <div style={{ padding:"0.75rem", borderRadius:"8px", background:"rgba(239,68,68,0.1)", color:"#dc2626", fontSize:"0.8rem", fontWeight:500, display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ padding:"0.75rem", borderRadius:"8px", background:"var(--accent,#1d6fbf)", color:"white", border:"none", fontSize:"0.9rem", fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1, marginTop:"0.5rem" }}>
            {loading ? "Logging in..." : "Login to Parent Portal"}
          </button>
        </form>

        <p style={{ textAlign:"center", fontSize:"0.75rem", color:"var(--text-dark-sub,#6b7280)", marginTop:"1.5rem" }}>
          Contact school administration for login credentials
        </p>
      </div>
    </div>
  );
};

export default ParentLoginPage;
