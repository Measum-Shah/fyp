/**
 * Fee Management sidebar icons.
 *
 * Inline SVGs in the same stroke style already used by this project's
 * sidebars, so no icon dependency is introduced. Keyed by the existing
 * FeeTabKey values — this file adds presentation only and does not change
 * any navigation item, label, order or behaviour.
 */

import React from "react";
import type { FeeTabKey } from "../components/FeeModuleWorkspace";

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Overview — dashboard layout */
const IconOverview = (
  <svg {...svgProps}>
    <rect x="3" y="3" width="7" height="8" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="11" width="7" height="10" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

/** Fee Sections — stacked layers */
const IconSections = (
  <svg {...svgProps}>
    <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
    <path d="M3 12.5 12 17l9-4.5" />
    <path d="M3 17 12 21.5 21 17" />
  </svg>
);

/** Fee Types — category tag */
const IconTypes = (
  <svg {...svgProps}>
    <path d="M20.6 13.4 12.4 21.6a2 2 0 0 1-2.8 0L3 15V4a1 1 0 0 1 1-1h8l8.6 8.6a2 2 0 0 1 0 2.8Z" />
    <circle cx="7.5" cy="7.5" r="1.4" />
  </svg>
);

/** Cycles & Installments — repeating billing period */
const IconCycles = (
  <svg {...svgProps}>
    <path d="M20 11a8 8 0 1 0-2.6 5.9" />
    <polyline points="20 4 20 11 13.5 11" />
    <path d="M12 8v4l2.6 1.6" />
  </svg>
);

/** Fee Structures — amount matrix */
const IconStructures = (
  <svg {...svgProps}>
    <rect x="3" y="3.5" width="18" height="17" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9.5" y1="9" x2="9.5" y2="20.5" />
    <line x1="3" y1="15" x2="21" y2="15" />
  </svg>
);

/** Assignments — clipboard */
const IconAssignments = (
  <svg {...svgProps}>
    <path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z" />
    <path d="M8 5H6.5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H16" />
    <polyline points="9 13 11 15 15 11" />
  </svg>
);

/** Student Fee Records — student ledger */
const IconStudentRecords = (
  <svg {...svgProps}>
    <path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5L14 3.5Z" />
    <polyline points="14 3.5 14 8.5 19 8.5" />
    <circle cx="12" cy="13" r="2" />
    <path d="M9 18a3 3 0 0 1 6 0" />
  </svg>
);

/** Payment Processing — card transaction */
const IconPayments = (
  <svg {...svgProps}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
    <line x1="2.5" y1="10" x2="21.5" y2="10" />
    <line x1="6" y1="14.5" x2="9.5" y2="14.5" />
    <line x1="13" y1="14.5" x2="18" y2="14.5" />
  </svg>
);

/** Discounts & Concessions — percentage offer */
const IconDiscounts = (
  <svg {...svgProps}>
    <circle cx="12" cy="12" r="9" />
    <line x1="8.8" y1="15.2" x2="15.2" y2="8.8" />
    <circle cx="9.2" cy="9.2" r="1.3" />
    <circle cx="14.8" cy="14.8" r="1.3" />
  </svg>
);

/** Late Fee Management — overdue clock */
const IconLateFees = (
  <svg {...svgProps}>
    <circle cx="11" cy="12.5" r="7.5" />
    <polyline points="11 8.5 11 12.5 14 14" />
    <line x1="20.5" y1="4" x2="20.5" y2="8.5" />
    <line x1="20.5" y1="11" x2="20.5" y2="11.2" />
  </svg>
);

/** Alerts & Notifications — bell */
const IconNotifications = (
  <svg {...svgProps}>
    <path d="M18 8.5a6 6 0 0 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5Z" />
    <path d="M13.7 19.5a2 2 0 0 1-3.4 0" />
  </svg>
);

/** Reporting & Analytics — report chart */
const IconReports = (
  <svg {...svgProps}>
    <rect x="3" y="3.5" width="18" height="17" rx="2" />
    <line x1="8" y1="16.5" x2="8" y2="11.5" />
    <line x1="12" y1="16.5" x2="12" y2="8" />
    <line x1="16" y1="16.5" x2="16" y2="13.5" />
  </svg>
);

/** Fee Section Prints — printer icon */
const IconSectionPrints = (
  <svg {...svgProps}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

/** ERP Fee Heads — tag/label icon */
const IconErpFeeHeads = (
  <svg {...svgProps}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

export const FEE_SIDEBAR_ICONS: Record<FeeTabKey, React.ReactNode> = {
  overview: IconOverview,
  sections: IconSections,
  "section-prints": IconSectionPrints,
  "erp-fee-heads": IconErpFeeHeads,
  types: IconTypes,
  cycles: IconCycles,
  structures: IconStructures,
  assignments: IconAssignments,
  "student-records": IconStudentRecords,
  payments: IconPayments,
  discounts: IconDiscounts,
  "late-fees": IconLateFees,
  notifications: IconNotifications,
  reports: IconReports,
};

/** Back to ERP control */
export const FeeBackToErpIcon = (
  <svg {...svgProps} width="16" height="16">
    <line x1="19" y1="12" x2="6" y2="12" />
    <polyline points="11 7 6 12 11 17" />
  </svg>
);
