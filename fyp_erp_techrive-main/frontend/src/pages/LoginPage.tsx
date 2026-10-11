import React, { useState } from "react";
import { authAPI } from "../api/api";

interface LoginForm {
  email: string;
  password: string;
}

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const IconEmail = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconLock = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconEyeOff = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconEye = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/* ── Component ─────────────────────────────────────────────────────────────── */
const LoginPage: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await authAPI.login(form.email, form.password);
      const { token, user } = res.data;

      localStorage.setItem("erp_token", token);
      localStorage.setItem("erp_user", JSON.stringify(user));

      setSuccess(`Welcome back, ${user.name}! Redirecting…`);
      // Route based on user_type
      let redirectPath = "/dashboard";
      if (user.user_type === "parent") redirectPath = "/parent/dashboard";
      else if (user.user_type === "student") redirectPath = "/student/dashboard";
      else if (user.user_type === "staff" || user.user_type === "teacher") redirectPath = "/teacher/dashboard";

      setTimeout(() => { window.location.href = redirectPath; }, 1500);
    } catch (err: unknown) {
      interface ErrorResponse {
        response?: {
          data?: {
            message?: string;
          };
        };
      }

      const getErrorMessage = (error: any) => {
        const response = error.response;
        if (response?.data?.message) {
          return response.data.message;
        }
        return error.message || "Invalid credentials. Please try again.";
      };

      setError(getErrorMessage(err as ErrorResponse));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">

      {/* ═══ LEFT — Branding Panel ═══════════════════════════════════════════ */}
      <div className="login-panel-left">
        <div className="panel-left-content">

          {/* Brand */}
          <div className="panel-brand">
            <div className="panel-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div>
              <div className="panel-brand-name">TechRive ERP</div>
              <div className="panel-brand-tagline">Enterprise Resource Planning</div>
            </div>
          </div>

          {/* Hero */}
          <div className="panel-hero">
            <div className="panel-hero-eyebrow">
              <span className="panel-hero-eyebrow-dot" />
              Trusted by Institutions
            </div>
            <h1 className="panel-hero-title">
              Manage Your Enterprise with <span>Confidence</span>
            </h1>
            <p className="panel-hero-desc">
              A unified platform for academic operations, HR, payroll, accounts,
              and fee management — built for reliability and scale.
            </p>
          </div>

          {/* Trust Badges Removed */}

        </div>
      </div>

      {/* ═══ RIGHT — Form Panel ══════════════════════════════════════════════ */}
      <div className="login-panel-right">
        <div className="login-form-wrapper">

          {/* Header */}
          <div className="form-header">
            <p className="form-welcome">Welcome</p>
            <h2 className="form-title">Sign in to your account</h2>
            <p className="form-subtitle">
              Enter your registered email and password to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form" noValidate>

            {/* Email */}
            <div className="field-group">
              <label htmlFor="email" className="field-label">
                Email Address
              </label>
              <div className="input-wrap">
                <span className="input-icon"><IconEmail /></span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@organization.com"
                  value={form.email}
                  onChange={handleChange}
                  className={`field-input ${error ? "input-error" : ""}`}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="field-group">
              <div className="label-row">
                <label htmlFor="password" className="field-label">Password</label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>
              <div className="input-wrap">
                <span className="input-icon"><IconLock /></span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={`field-input ${error ? "input-error" : ""}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="alert alert-error" role="alert">
                <IconAlert />
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success" role="alert">
                <IconCheck />
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-wrap">
                  <span className="spinner" />
                  Authenticating…
                </span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Footer Removed */}

        </div>
      </div>

    </div>
  );
};

export default LoginPage;
