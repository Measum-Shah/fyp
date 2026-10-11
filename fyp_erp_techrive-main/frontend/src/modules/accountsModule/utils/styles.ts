/**
 * Shared styles for the Accounts Module — uses the global index.css design system
 * (same variables used by AcademicModule, HR Module, etc.)
 */

export const S = {
  // Page wrapper
  page: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.5rem",
    padding: "1.5rem 2rem 2.5rem",
  },

  // Page header card
  pageHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap" as const,
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "14px",
    padding: "1.5rem",
    boxShadow: "var(--shadow-card)",
  },

  h1: {
    fontSize: "1.45rem",
    fontWeight: 800,
    color: "var(--text-dark)",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  },

  subtitle: {
    fontSize: "0.85rem",
    color: "var(--text-dark-sub)",
    marginTop: "0.3rem",
    lineHeight: 1.5,
  },

  // Filter bar
  filterBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
    padding: "1rem 1.25rem",
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "12px",
  },

  input: {
    padding: "0.6rem 0.9rem",
    background: "var(--input-bg)",
    border: "1.5px solid var(--input-border)",
    borderRadius: "8px",
    color: "var(--text-dark)",
    fontSize: "0.85rem",
    fontFamily: "inherit",
    outline: "none",
    minWidth: "220px",
  },

  select: {
    padding: "0.6rem 0.9rem",
    background: "var(--input-bg)",
    border: "1.5px solid var(--input-border)",
    borderRadius: "8px",
    color: "var(--text-dark)",
    fontSize: "0.85rem",
    fontFamily: "inherit",
    outline: "none",
    cursor: "pointer",
  },

  // Table container
  tableWrap: {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "14px",
    overflow: "hidden",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.85rem",
    color: "var(--text-dark)",
  },

  th: {
    padding: "0.85rem 1rem",
    textAlign: "left" as const,
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "var(--text-dark-sub)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    background: "var(--input-bg)",
    borderBottom: "1px solid var(--card-border)",
  },

  thRight: {
    padding: "0.85rem 1rem",
    textAlign: "right" as const,
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "var(--text-dark-sub)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    background: "var(--input-bg)",
    borderBottom: "1px solid var(--card-border)",
  },

  thCenter: {
    padding: "0.85rem 1rem",
    textAlign: "center" as const,
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "var(--text-dark-sub)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    background: "var(--input-bg)",
    borderBottom: "1px solid var(--card-border)",
  },

  td: {
    padding: "0.85rem 1rem",
    borderBottom: "1px solid var(--divider-color)",
    color: "var(--text-dark)",
    verticalAlign: "middle" as const,
  },

  tdRight: {
    padding: "0.85rem 1rem",
    borderBottom: "1px solid var(--divider-color)",
    color: "var(--text-dark)",
    textAlign: "right" as const,
    fontFamily: "monospace",
    fontWeight: 700,
  },

  tdCenter: {
    padding: "0.85rem 1rem",
    borderBottom: "1px solid var(--divider-color)",
    textAlign: "center" as const,
  },

  // Modal overlay
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(4px)",
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },

  modal: {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "560px",
    padding: "2rem",
    boxShadow: "var(--shadow-card)",
    maxHeight: "90vh",
    overflowY: "auto" as const,
  },

  modalTitle: {
    fontSize: "1.15rem",
    fontWeight: 800,
    color: "var(--text-dark)",
    marginBottom: "1.5rem",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.4rem",
  },

  label: {
    fontSize: "0.76rem",
    fontWeight: 700,
    color: "var(--text-dark-sub)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },

  // Buttons
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.65rem 1.25rem",
    background: "linear-gradient(135deg, var(--accent) 0%, var(--steel-light) 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(29,111,191,0.35)",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap" as const,
  },

  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.65rem 1.25rem",
    background: "var(--input-bg)",
    color: "var(--text-dark)",
    border: "1.5px solid var(--card-border)",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap" as const,
  },

  btnDanger: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.65rem 1.25rem",
    background: "rgba(214,64,64,0.1)",
    color: "var(--error)",
    border: "1.5px solid rgba(214,64,64,0.25)",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap" as const,
  },

  // Tags/Badges
  tag: (color: "green" | "red" | "blue" | "gold" | "purple" | "gray") => {
    const map = {
      green:  { bg: "rgba(34,197,94,0.1)",   color: "#16a34a", border: "rgba(34,197,94,0.25)" },
      red:    { bg: "rgba(239,68,68,0.1)",    color: "#dc2626", border: "rgba(239,68,68,0.25)" },
      blue:   { bg: "rgba(29,111,191,0.1)",   color: "var(--accent)", border: "rgba(29,111,191,0.25)" },
      gold:   { bg: "rgba(201,162,39,0.12)",  color: "var(--gold)",   border: "rgba(201,162,39,0.3)" },
      purple: { bg: "rgba(139,92,246,0.1)",   color: "#7c3aed", border: "rgba(139,92,246,0.25)" },
      gray:   { bg: "var(--input-bg)",        color: "var(--text-dark-sub)", border: "var(--card-border)" },
    };
    const c = map[color];
    return {
      display: "inline-block",
      padding: "0.25rem 0.65rem",
      borderRadius: "20px",
      fontSize: "0.72rem",
      fontWeight: 700,
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      whiteSpace: "nowrap" as const,
    };
  },

  mono: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: "var(--accent)",
    fontSize: "0.88rem",
  },

  emptyRow: {
    padding: "3rem",
    textAlign: "center" as const,
    color: "var(--text-dark-sub)",
    fontSize: "0.9rem",
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
    paddingTop: "1.25rem",
    borderTop: "1px solid var(--divider-color)",
    marginTop: "1.25rem",
  },

  textarea: {
    padding: "0.6rem 0.9rem",
    background: "var(--input-bg)",
    border: "1.5px solid var(--input-border)",
    borderRadius: "8px",
    color: "var(--text-dark)",
    fontSize: "0.85rem",
    fontFamily: "inherit",
    outline: "none",
    resize: "vertical" as const,
    minHeight: "80px",
    width: "100%",
  },
};

export const typeColor = (type: string): "green" | "red" | "blue" | "gold" | "purple" | "gray" => {
  switch (type) {
    case "ASSET": return "green";
    case "LIABILITY": return "gold";
    case "EQUITY": return "purple";
    case "REVENUE": return "blue";
    case "EXPENSE": return "red";
    default: return "gray";
  }
};

export const statusColor = (status: string): "green" | "red" | "blue" | "gold" | "purple" | "gray" => {
  switch (status?.toUpperCase()) {
    case "POSTED": case "PAID": case "ACTIVE": case "APPROVED": return "green";
    case "OVERDUE": case "CANCELLED": case "REJECTED": return "red";
    case "DRAFT": case "PENDING": return "gray";
    case "SUBMITTED": case "PARTIALLY_PAID": case "PARTIAL": return "gold";
    case "CLOSED": case "LOCKED": return "purple";
    default: return "blue";
  }
};

export const pkr = (n?: number | string) =>
  `PKR ${Number(n || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
