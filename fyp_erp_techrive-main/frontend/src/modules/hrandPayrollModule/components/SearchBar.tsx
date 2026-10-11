import React, { useEffect, useRef, useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconClear = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Debounced text search input, visually based on the existing .topbar-search
// pattern from HomePage.tsx but full-width for use above the Employee table.
// Keeps its own local draft state so keystrokes feel instant, and only calls
// onChange (which triggers the API request) after the user pauses typing.
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search employees by name, email, or Employee ID…",
  debounceMs = 350,
}) => {
  const [draft, setDraft] = useState(value);
  // Tracks the last external `value` we've synced from, so we can detect an
  // external reset (e.g. a "clear filters" action) and re-sync local draft
  // state DURING render rather than in an effect — the pattern React itself
  // recommends for "adjusting state when a prop changes"
  // (https://react.dev/learn/you-might-not-need-an-effect), and what our
  // lint config (react-hooks/set-state-in-effect) enforces.
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  const timeoutRef = useRef<number | undefined>(undefined);

  const handleChange = (next: string) => {
    setDraft(next);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => onChange(next), debounceMs);
  };

  const handleClear = () => {
    window.clearTimeout(timeoutRef.current);
    setDraft("");
    onChange("");
  };

  // Cleanup only — clearing a timeout is not a setState call, so this does
  // not trigger react-hooks/set-state-in-effect.
  useEffect(() => {
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div className="hr-search-bar">
      <span className="hr-search-icon">
        <IconSearch />
      </span>
      <input
        type="text"
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search employees"
      />
      {draft && (
        <button
          type="button"
          className="hr-search-clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <IconClear />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
