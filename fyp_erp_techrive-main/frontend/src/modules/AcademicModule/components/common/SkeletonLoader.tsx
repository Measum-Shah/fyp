import React from "react";

export const SkeletonLoader: React.FC<{ rows?: number; type?: "card" | "table" | "list" }> = ({
  rows = 4,
  type = "card",
}) => {
  if (type === "card") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 space-y-3"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2" />
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-slate-800/50"
        />
      ))}
    </div>
  );
};
