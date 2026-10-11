import React, { useEffect, useRef, useState } from "react";

export interface EmployeeSectionNavTab {
  key: string;
  label: string;
}

interface EmployeeSectionNavProps {
  tabs: EmployeeSectionNavTab[];
  activeKey: string;
  onChange: (key: string) => void;
}

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Single reusable horizontal, scrollable tab bar used on the Add Employee,
// View Employee and Edit Employee dashboards. Tabs never wrap and there is
// no dropdown — extra tabs are reached by scrolling/swiping (mouse wheel,
// touch drag, or the edge arrow buttons that appear once content overflows).
const EmployeeSectionNav: React.FC<EmployeeSectionNavProps> = ({ tabs, activeKey, onChange }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [tabs.length]);

  // Keep the active tab in view when it's changed programmatically (e.g. a
  // validation error jumping the user to a different section).
  useEffect(() => {
    activeBtnRef.current?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [activeKey]);

  const scrollByAmount = (amount: number) => {
    trackRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div className="hr-section-nav" role="tablist" aria-label="Employee profile sections">
      {canScrollLeft && (
        <button
          type="button"
          className="hr-section-nav-arrow hr-section-nav-arrow-left"
          onClick={() => scrollByAmount(-220)}
          aria-label="Scroll tabs left"
          tabIndex={-1}
        >
          <IconChevronLeft />
        </button>
      )}

      <div className="hr-section-nav-track" ref={trackRef}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              ref={isActive ? activeBtnRef : undefined}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`hr-section-nav-btn ${isActive ? "hr-section-nav-btn-active" : ""}`}
              onClick={() => onChange(tab.key)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          type="button"
          className="hr-section-nav-arrow hr-section-nav-arrow-right"
          onClick={() => scrollByAmount(220)}
          aria-label="Scroll tabs right"
          tabIndex={-1}
        >
          <IconChevronRight />
        </button>
      )}
    </div>
  );
};

export default EmployeeSectionNav;
