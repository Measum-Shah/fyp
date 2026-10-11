import React from "react";
import { Outlet } from "react-router-dom";
import HrSidebar from "./HrSidebar";
import "./hr-sidebar.css";

/* ═══════════════════════════════════════════════════════════════════════
   HrLayout
   Mounted once via a parent <Route> in App.tsx that wraps every /hr/*
   route with an <Outlet />. Because this component itself never
   unmounts while navigating between HR pages, <HrSidebar /> stays
   mounted (and visible) at all times — it does not re-render or
   disappear when the person moves between Employees, Departments,
   Payroll, Reports, etc.
═══════════════════════════════════════════════════════════════════════ */
const HrLayout: React.FC = () => {
  return (
    <div className="hr-layout">
      <HrSidebar />
      <div className="hr-layout-content">
        <Outlet />
      </div>
    </div>
  );
};

export default HrLayout;