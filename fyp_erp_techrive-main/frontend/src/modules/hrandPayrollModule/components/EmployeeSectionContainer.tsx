import React from "react";

interface EmployeeSectionContainerProps {
  children: React.ReactNode;
}

// Thin, deliberately dumb wrapper — just applies the same `.hr-form-card`
// surface (background/border/radius/shadow/padding) that every section's
// content sits inside on the Add / View / Edit Employee dashboards, so all
// three screens render section content with identical spacing and styling.
const EmployeeSectionContainer: React.FC<EmployeeSectionContainerProps> = ({ children }) => (
  <div className="hr-form-card">{children}</div>
);

export default EmployeeSectionContainer;
