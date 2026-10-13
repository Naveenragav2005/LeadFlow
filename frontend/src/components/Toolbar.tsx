import { Search, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { STATUS_META } from "@/lib/status";
import { LEAD_STATUSES, type LeadStatus } from "@/types";

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: LeadStatus | null;
  onStatusChange: (status: LeadStatus | null) => void;
}

const FILTER_OPTIONS: { value: LeadStatus | null; label: string }[] = [
  { value: null, label: "All" },
  ...LEAD_STATUSES.map((value) => ({ value, label: STATUS_META[value].label })),
];

export function Toolbar({ search, onSearchChange, status, onStatusChange }: ToolbarProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search leads by name or company…"
          aria-label="Search leads"
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-9 pl-9 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span id="status-filter-label" className="shrink-0 text-xs font-semibold tracking-wider text-slate-500 uppercase">
          Filters:
        </span>
        <div
          role="group"
          aria-labelledby="status-filter-label"
          className="-my-1 flex gap-2 overflow-x-auto py-1 [scrollbar-width:none]"
        >
          {FILTER_OPTIONS.map((option) => {
            const active = option.value === status;
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={active}
                onClick={() => onStatusChange(option.value)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1 text-sm transition",
                  active
                    ? "border-slate-800 bg-slate-800 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
