"use client";

import { RotateCw } from "lucide-react";
import { useState } from "react";

import { Header } from "@/components/Header";
import { LeadList } from "@/components/LeadList";
import { Toolbar } from "@/components/Toolbar";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLeads } from "@/hooks/useLeads";
import { useNow } from "@/hooks/useNow";
import type { Lead, LeadStatus } from "@/types";

export function LeadsDashboard() {
  const [statusFilter, setStatusFilter] = useState<LeadStatus | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput.trim(), 250);

  const { leads, error, isLoading, hasLoaded, reload } = useLeads(statusFilter, search);
  const now = useNow();

  const [, setSelectedLead] = useState<Lead | null>(null);

  return (
    <>
      <Header onAddLead={() => {}} />

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:px-6">
        <Toolbar
          search={searchInput}
          onSearchChange={setSearchInput}
          status={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {error && (
          <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={reload}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1 font-medium hover:bg-red-100"
            >
              <RotateCw aria-hidden className="size-3.5" />
              Retry
            </button>
          </div>
        )}

        <div className={isLoading && hasLoaded ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <LeadList
            leads={leads}
            now={now}
            hasLoaded={hasLoaded}
            isFiltered={statusFilter !== null || search !== ""}
            onSelect={setSelectedLead}
          />
        </div>
      </main>
    </>
  );
}
