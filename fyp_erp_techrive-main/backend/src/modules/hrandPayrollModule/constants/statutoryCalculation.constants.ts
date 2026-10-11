// ─── EOBI / EPF Calculation Defaults ─────────────────────────────────────────
// Replaces the old "Statutory Settings" admin screen (hr_statutory_
// contribution_settings + its CRUD UI/API), which let someone configure a
// list of named configurations and mark one "Default". That indirection
// was the actual pain point being fixed here: EOBI/EPF should just always
// auto-calculate using Pakistan's standard formula, with no separate page
// to visit first. These are now plain constants, used directly by
// statutory-calculation.util.ts.
//
// EOBI_MINIMUM_WAGE: the government-notified minimum wage EOBI's employee
// contribution is based on (NOT the employee's actual salary). This is
// PKR 40,000/month, the figure most provinces (Punjab, Sindh, KPK, ICT)
// have been using since the 2025–2026 budget; Balochistan and the federal
// rate under the Finance Act 2026 differ slightly (PKR 37,000 /
// PKR 40,700). Minimum wage changes with each Finance Act/provincial
// notification — if it's been revised since this was last touched, update
// the value below rather than reintroducing a settings screen for it.
//
// EOBI_EMPLOYEE_PERCENT: fixed by the EOBI Act at 1% of minimum wage
// (employer separately pays a further 5%, not deducted from the employee).
//
// EPF_PERCENT_OF_BASIC: Pakistani law sets no statutory EPF/Provident Fund
// percentage — it's a company-policy figure, commonly 8–10% of basic
// salary. 5% is this app's default; change it here if this organization's policy differs.
export const STATUTORY_CALCULATION_DEFAULTS = {
  EOBI_MINIMUM_WAGE: 40000,
  EOBI_EMPLOYEE_PERCENT: 1,
  EPF_PERCENT_OF_BASIC: 5,
} as const;
