import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0f172a",
            color: "#ffffff",
            fontFamily: "sans-serif",
            padding: "20px",
          }}
        >
          <div
            style={{
              maxWidth: "450px",
              width: "100%",
              padding: "32px",
              borderRadius: "20px",
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "40px",
                marginBottom: "16px",
              }}
            >
              ⚠️
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>
              Application Error
            </h2>
            <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "24px", lineHeight: "1.5" }}>
              {this.state.error?.message || "An unexpected rendering error occurred."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/dashboard";
              }}
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
              }}
            >
              Reset Session & Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
